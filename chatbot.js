// ============== CONFIG ==============
const API_URL        = "https://88kfphk737.execute-api.eu-south-1.amazonaws.com/chat";
const COGNITO_DOMAIN = "https://eu-south-1hire1kaem.auth.eu-south-1.amazoncognito.com";
const CLIENT_ID      = "5869fpe4vmomj0v2ule4sgmv5h";
const REDIRECT_URI   = "https://d3ccmtxs746aw5.cloudfront.net/";
const LOGOUT_URI     = "https://d3ccmtxs746aw5.cloudfront.net/";
const RESPONSE_TYPE  = "token";
const SCOPE          = "openid+email+phone";
// ====================================

// Elements
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
const heroContent    = document.querySelector(".hero-content");
const topNav         = document.querySelector(".top-nav");

// --- AUTHENTICATION ---

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

  // Per logout completo da Cognito
  const url =
    COGNITO_DOMAIN +
    "/logout?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&logout_uri=" + encodeURIComponent(LOGOUT_URI);

  window.location.href = url;
}

function parseHashTokens() {
  if (!window.location.hash) return;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const idToken = params.get("id_token");
  const accessToken = params.get("access_token");

  if (idToken) localStorage.setItem("id_token", idToken);
  if (accessToken) localStorage.setItem("access_token", accessToken);

  history.replaceState(null, "", window.location.pathname);
}

function isLoggedIn() {
  return !!localStorage.getItem("id_token");
}

function updateUI() {
  const userLogged = isLoggedIn();

  // Gestione pulsanti Header
  if (userLogged) {
    navLoginBtn.classList.add("hidden");
    navLogoutBtn.classList.remove("hidden");
    if (heroLoginBtn) heroLoginBtn.classList.add("hidden");
    
    // Mostra info utente
    if (userInfo) userInfo.textContent = "Logged In (Premium Access)";
  } else {
    navLoginBtn.classList.remove("hidden");
    navLogoutBtn.classList.add("hidden");
    if (heroLoginBtn) heroLoginBtn.classList.remove("hidden");
    
    if (userInfo) userInfo.textContent = "Guest Mode";
  }
}

// --- CHAT LOGIC ---

/**
 * Funzione aggiornata per supportare il Markdown
 */
function addMessage(text, role) {
  const row = document.createElement("div");
  row.className = "msg-row " + (role === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (role === "user" ? "bubble-user" : "bubble-bot");
  
  if (role === "bot") {
    // Utilizziamo marked.parse per convertire il Markdown in HTML
    // Questo permette di visualizzare grassetto (**), liste (*) e codice
    bubble.innerHTML = marked.parse(text);
  } else {
    // Per i messaggi dell'utente manteniamo innerText per sicurezza (prevenzione XSS)
    bubble.innerText = text;
  }

  row.appendChild(bubble);
  messagesDiv.appendChild(row);
  
  // Scroll automatico verso il basso
  requestAnimationFrame(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  // 1. Mostra messaggio utente
  addMessage(text, "user");
  inputEl.value = "";
  
  // UI Loading
  statusText.textContent = "AI is thinking...";
  typingEl.classList.remove("hidden");
  sendBtn.disabled = true;

  try {
    const headers = { "Content-Type": "application/json" };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      console.error("HTTP Error", res.status);
      addMessage("⚠️ Server error or unauthorized. Please try again.", "bot");
      statusText.textContent = "Error";
      return;
    }

    const data = await res.json();
    let answer = data && data.answer ? String(data.answer).trim() : "";

    if (!answer) answer = "I didn't get a response.";

    // Pulizia errori grezzi
    const lower = answer.toLowerCase();
    if (lower.startsWith("gemini http") || lower.includes("gemini generic error")) {
      answer = "My brain is having a temporary glitch. Try again!";
    }

    addMessage(answer, "bot");
    statusText.textContent = "Online";
  } catch (err) {
    console.error("Fetch error:", err);
    addMessage("Network error. Check your connection.", "bot");
    statusText.textContent = "Connection Error";
  } finally {
    typingEl.classList.add("hidden");
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// --- SCROLL & PARALLAX ---

function setupScrollEffects() {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      topNav.classList.add("scrolled");
    } else {
      topNav.classList.remove("scrolled");
    }
    
    if (heroContent) {
      const offset = Math.min(window.scrollY * 0.4, 150);
      heroContent.style.transform = `translateY(${offset}px)`;
      heroContent.style.opacity = 1 - Math.min(window.scrollY / 500, 1);
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

// --- THEME ---

function applyStoredTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light") {
    document.body.classList.add("light-theme");
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

// --- INIT ---

document.addEventListener("DOMContentLoaded", () => {
  parseHashTokens();
  applyStoredTheme();
  updateUI();
  setupScrollEffects();

  if (navLoginBtn)  navLoginBtn.addEventListener("click", login);
  if (heroLoginBtn) heroLoginBtn.addEventListener("click", login);
  if (navLogoutBtn) navLogoutBtn.addEventListener("click", logout);
  
  if (startChatBtn) {
    startChatBtn.addEventListener("click", () => {
      document.getElementById("chatSection").scrollIntoView({ behavior: "smooth" });
      inputEl.focus();
    });
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});