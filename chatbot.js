// ============== CONFIG ==============
const API_URL        = "https://88kfphk737.execute-api.eu-south-1.amazonaws.com/chat";
const COGNITO_DOMAIN = "https://eu-south-1hire1kaem.auth.eu-south-1.amazoncognito.com";
const CLIENT_ID      = "5869fpe4vmomj0v2ule4sgmv5h";
const REDIRECT_URI   = "https://d3ccmtxs746aw5.cloudfront.net/";
const LOGOUT_URI     = "https://d3ccmtxs746aw5.cloudfront.net/";
const RESPONSE_TYPE  = "token";
const SCOPE          = "openid+email+phone";
// ====================================

const navLoginBtn    = document.getElementById("navLoginBtn");
const navLogoutBtn   = document.getElementById("navLogoutBtn");
const heroLoginBtn   = document.getElementById("heroLoginBtn");
const startChatBtn   = document.getElementById("startChatBtn");
const userInfo       = document.getElementById("userInfo");
const messagesDiv    = document.getElementById("messages");
const inputEl        = document.getElementById("input");
const sendBtn        = document.getElementById("sendBtn");
const statusText     = document.getElementById("statusText");
const typingEl       = document.getElementById("typingIndicator");
const themeToggle    = document.getElementById("themeToggle");

// --- AUTHENTICATION ---
function login() {
  const url = `${COGNITO_DOMAIN}/login?client_id=${encodeURIComponent(CLIENT_ID)}&response_type=${encodeURIComponent(RESPONSE_TYPE)}&scope=${SCOPE}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
}

function logout() {
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
}

function parseHashTokens() {
  if (!window.location.hash) return;
  const params = new URLSearchParams(window.location.hash.substring(1));
  const idToken = params.get("id_token");
  const accessToken = params.get("access_token");
  if (idToken) localStorage.setItem("id_token", idToken);
  if (accessToken) localStorage.setItem("access_token", accessToken);
  history.replaceState(null, "", window.location.pathname);
}

function updateUI() {
  const userLogged = !!localStorage.getItem("id_token");
  if (userLogged) {
    navLoginBtn?.classList.add("hidden");
    navLogoutBtn?.classList.remove("hidden");
    heroLoginBtn?.classList.add("hidden");
    if (userInfo) userInfo.textContent = "Authenticated User";
  } else {
    navLoginBtn?.classList.remove("hidden");
    navLogoutBtn?.classList.add("hidden");
    heroLoginBtn?.classList.remove("hidden");
  }
}

// --- CHAT LOGIC ---
function addMessage(text, role) {
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;
  const bubble = document.createElement("div");
  bubble.className = `bubble bubble-${role}`;
  
  if (role === "bot") {
    bubble.innerHTML = marked.parse(text);
  } else {
    bubble.innerText = text;
  }

  row.appendChild(bubble);
  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, "user");
  inputEl.value = "";
  
  statusText.textContent = "OCRAM is thinking...";
  typingEl.classList.remove("hidden");
  sendBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    let answer = data?.answer?.trim() || "I didn't get a response.";
    addMessage(answer, "bot");
    statusText.textContent = "Online";
  } catch (err) {
    addMessage("Connection error. Check your AWS setup.", "bot");
  } finally {
    typingEl.classList.add("hidden");
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  parseHashTokens();
  updateUI();

  navLoginBtn?.addEventListener("click", login);
  heroLoginBtn?.addEventListener("click", login);
  navLogoutBtn?.addEventListener("click", logout);
  
  startChatBtn?.addEventListener("click", () => {
    document.getElementById("chatSection").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => inputEl.focus(), 800);
  });

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
  themeToggle?.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });

  // Scroll Animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
});