// ============== CONFIG ==============
const API_URL        = "https://88kfphk737.execute-api.eu-south-1.amazonaws.com/chat";
const COGNITO_DOMAIN = "https://eu-south-1hire1kaem.auth.eu-south-1.amazoncognito.com";
const CLIENT_ID      = "5869fpe4vmomj0v2ule4sgmv5h";
const REDIRECT_URI   = "https://d3ccmtxs746aw5.cloudfront.net/";
const LOGOUT_URI     = "https://d3ccmtxs746aw5.cloudfront.net/";
const RESPONSE_TYPE  = "token";
const SCOPE          = "openid+email+phone";
// ====================================

const hero        = document.getElementById("hero");
const chatSection = document.getElementById("chatSection");
const loginBtn    = document.getElementById("loginBtn");
const logoutBtn   = document.getElementById("logoutBtn");
const userInfo    = document.getElementById("userInfo");
const messagesDiv = document.getElementById("messages");
const inputEl     = document.getElementById("input");
const sendBtn     = document.getElementById("sendBtn");
const statusText  = document.getElementById("statusText");
const typingEl    = document.getElementById("typingIndicator");
const themeToggle = document.getElementById("themeToggle");
const heroContent = document.querySelector(".hero-content");

function login() {
  const url =
    COGNITO_DOMAIN +
    "/login?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&response_type=" + encodeURIComponent(RESPONSE_TYPE) +
    "&scope=" + SCOPE +
    "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

  window.location.href = url;
}

function logout() {
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");

  const url =
    COGNITO_DOMAIN +
    "/logout?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&logout_uri=" + encodeURIComponent(LOGOUT_URI);

  window.location.href = url;
}

// read tokens from URL fragment after login
function parseHashTokens() {
  if (!window.location.hash) return;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const idToken = params.get("id_token");
  const accessToken = params.get("access_token");

  if (idToken) localStorage.setItem("id_token", idToken);
  if (accessToken) localStorage.setItem("access_token", accessToken);

  // clean URL
  history.replaceState(null, "", window.location.pathname);
}

function isLoggedIn() {
  return !!localStorage.getItem("id_token");
}

function updateUI() {
  if (isLoggedIn()) {
    hero.classList.add("hidden");
    chatSection.classList.remove("hidden");
    if (userInfo) userInfo.textContent = "Logged in";
  } else {
    hero.classList.remove("hidden");
    chatSection.classList.add("hidden");
    if (userInfo) userInfo.textContent = "";
  }
}

function addMessage(text, role) {
  const row = document.createElement("div");
  row.className = "msg-row " + (role === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (role === "user" ? "bubble-user" : "bubble-bot");
  bubble.textContent = text;

  row.appendChild(bubble);
  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  if (!isLoggedIn()) {
    alert("You need to log in first.");
    return;
  }

  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, "user");
  inputEl.value = "";
  statusText.textContent = "Sending message…";
  typingEl.classList.remove("hidden");
  sendBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      addMessage("The server returned an error. Please try again.", "bot");
      statusText.textContent = "Server error";
      return;
    }

    const data = await res.json();
    let answer = data && data.answer ? String(data.answer).trim() : "";

    // Pulizia e fallback
    if (!answer) {
      answer = "I could not generate a response.";
    }

    // Se dal backend arrivano stringhe di errore grezze di Gemini, le puliamo
    const lower = answer.toLowerCase();
    if (lower.startsWith("gemini http") || lower.includes("gemini generic error")) {
      answer = "Sorry, the AI backend had a problem. Please try again in a moment.";
    }

    addMessage(answer, "bot");
    statusText.textContent = "Response received";
  } catch (err) {
    console.error("Fetch error:", err);
    addMessage("Network error while calling the API.", "bot");
    statusText.textContent = "Network error";
  } finally {
    typingEl.classList.add("hidden");
    sendBtn.disabled = false;
  }
}

// THEME HANDLING

function applyStoredTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

// SCROLL REVEAL

function setupScrollReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  elements.forEach(el => observer.observe(el));
}

// SIMPLE PARALLAX

function setupParallax() {
  if (!heroContent) return;
  window.addEventListener("scroll", () => {
    const y = window.scrollY || window.pageYOffset || 0;
    const offset = Math.min(y * 0.08, 40);
    heroContent.style.transform = `translateY(${offset * -1}px)`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // auth
  parseHashTokens();
  applyStoredTheme();
  updateUI();

  // listeners
  loginBtn.addEventListener("click", login);
  logoutBtn.addEventListener("click", logout);
  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // small welcome message when logged in
  if (isLoggedIn()) {
    addMessage("You are logged in. Ask me anything.", "bot");
  }

  // UI extras
  setupScrollReveal();
  setupParallax();
});
