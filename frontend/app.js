/**
 * app.js — Logika Antarmuka ELYSIA
 * Gaya Bersih & Terang (Gemini / DeepSeek) dengan Estetika Emma (Veil)
 * Tanpa Emoji — Menggunakan Lucide Icons untuk seluruh ikonografi.
 */

// Menyesuaikan origin secara otomatis saat diakses via Flask (http://127.0.0.1:5000/) maupun file://
const API_BASE = window.location.protocol.startsWith("http")
  ? `${window.location.origin}/api`
  : "http://127.0.0.1:5000/api";

// ── State Aplikasi ────────────────────────────────────────────────────────
let sessionId = null;
let isStreaming = false;
let messageCount = 0;

// ── Referensi Elemen DOM ──────────────────────────────────────────────────
const messagesEl         = document.getElementById("messages");
const welcomeHeroEl      = document.getElementById("welcome-hero");
const userInputEl        = document.getElementById("user-input");
const sendBtnEl          = document.getElementById("send-btn");
const typingEl           = document.getElementById("typing-indicator");
const chatScrollEl       = document.getElementById("chat-scroll");
const toastEl            = document.getElementById("toast");
const toastTextEl        = document.getElementById("toast-text");
const toastIconEl        = document.getElementById("toast-icon");
const statusDotEl        = document.getElementById("status-dot");
const statusTextEl       = document.getElementById("status-text");
const btnRecommend       = document.getElementById("btn-recommend");
const btnSave            = document.getElementById("btn-save");
const btnClear           = document.getElementById("btn-clear");
const btnToggleSidebar   = document.getElementById("btn-toggle-sidebar");
const btnCloseSidebar    = document.getElementById("btn-close-sidebar");
const sidebarDrawer      = document.getElementById("sidebar-drawer");
const sidebarCountEl     = document.getElementById("sidebar-count");
const gameCardsEl        = document.getElementById("game-cards");
const sidebarEmptyEl     = document.getElementById("sidebar-empty");

// ── Inisialisasi Ikon Lucide ──────────────────────────────────────────────
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

// ── Notifikasi Toast ──────────────────────────────────────────────────────
function showToast(text, type = "info", durationMs = 3200) {
  toastTextEl.textContent = text;
  
  if (type === "success") {
    toastIconEl.setAttribute("data-lucide", "check-circle-2");
  } else if (type === "error") {
    toastIconEl.setAttribute("data-lucide", "alert-circle");
  } else {
    toastIconEl.setAttribute("data-lucide", "info");
  }

  refreshIcons();
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, durationMs);
}

// ── Scroll ke Pesan Terbaru ──────────────────────────────────────────────
function scrollToBottom() {
  chatScrollEl.scrollTop = chatScrollEl.scrollHeight;
}

// ── Auto-resize Textarea & Validasi Input ──────────────────────────────────
userInputEl.addEventListener("input", () => {
  userInputEl.style.height = "auto";
  userInputEl.style.height = Math.min(userInputEl.scrollHeight, 140) + "px";
  sendBtnEl.disabled = !userInputEl.value.trim() || isStreaming;
});

userInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtnEl.disabled) {
      sendMessage();
    }
  }
});

sendBtnEl.addEventListener("click", () => {
  if (!sendBtnEl.disabled) {
    sendMessage();
  }
});

// ── Event Listener Tombol Navigasi & Sidebar ───────────────────────────────
function toggleSidebar(forceOpen = null) {
  const isClosed = sidebarDrawer.classList.contains("closed");
  const shouldOpen = forceOpen !== null ? forceOpen : isClosed;

  if (shouldOpen) {
    sidebarDrawer.classList.remove("closed");
    btnToggleSidebar.classList.add("active");
  } else {
    sidebarDrawer.classList.add("closed");
    btnToggleSidebar.classList.remove("active");
  }
}

btnToggleSidebar.addEventListener("click", () => toggleSidebar());
btnCloseSidebar.addEventListener("click", () => toggleSidebar(false));

btnRecommend.addEventListener("click", triggerRecommend);
btnSave.addEventListener("click", saveChat);
btnClear.addEventListener("click", resetChat);

// Suggestion Chips Click
document.querySelectorAll(".suggestion-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const prompt = chip.getAttribute("data-prompt");
    if (prompt && !isStreaming) {
      userInputEl.value = prompt;
      userInputEl.dispatchEvent(new Event("input"));
      sendMessage();
    }
  });
});

// ── Markdown-lite Parser (Bebas Emoji) ────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)+/gs, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

// ── Tambahkan Bubble Pesan ────────────────────────────────────────────────
function appendMessage(role, content, streaming = false) {
  if (welcomeHeroEl && welcomeHeroEl.style.display !== "none") {
    welcomeHeroEl.style.display = "none";
  }

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  // Avatar dengan Lucide Icons (bukan emoji)
  const avatar = document.createElement("div");
  avatar.className = `message-avatar ${role}`;
  if (role === "elysia") {
    avatar.innerHTML = `<i data-lucide="sparkles"></i>`;
  } else {
    avatar.innerHTML = `<i data-lucide="user"></i>`;
  }

  const body = document.createElement("div");
  body.className = "message-body";

  const senderLabel = document.createElement("span");
  senderLabel.className = "message-sender";
  senderLabel.textContent = role === "elysia" ? "ELYSIA" : "Anda";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (streaming) {
    bubble.innerHTML = "";
  } else {
    bubble.innerHTML = `<p>${renderMarkdown(content)}</p>`;
  }

  body.appendChild(senderLabel);
  body.appendChild(bubble);

  row.appendChild(avatar);
  row.appendChild(body);

  messagesEl.appendChild(row);
  messageCount++;

  refreshIcons();
  scrollToBottom();

  return bubble;
}

// ── Kirim Pesan (Streaming SSE) ───────────────────────────────────────────
async function sendMessage() {
  const text = userInputEl.value.trim();
  if (!text || isStreaming) return;

  // Render bubble user
  appendMessage("user", text);

  // Reset input
  userInputEl.value = "";
  userInputEl.style.height = "auto";
  sendBtnEl.disabled = true;

  // Set streaming state
  isStreaming = true;
  typingEl.classList.add("active");
  scrollToBottom();

  let bubbleEl = null;
  let fullText = "";

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Buat bubble ELYSIA
    typingEl.classList.remove("active");
    bubbleEl = appendMessage("elysia", "", true);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // simpan sisa baris belum utuh

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw);

            // Simpan session_id jika baru dibuat
            if (data.session_id && !sessionId) {
              sessionId = data.session_id;
            }

            const textChunk = data.chunk !== undefined ? data.chunk : (data.content || "");
            if (textChunk) {
              fullText += textChunk;
              bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
              scrollToBottom();
            }

            if (data.done) {
              // Selesai streaming
            }

            if (data.error) {
              fullText += `\n\n[Terjadi kendala: ${data.error}]`;
              bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
            }
          } catch (e) {
            // Abaikan parsing JSON tak lengkap
          }
        }
      }
    }
  } catch (err) {
    typingEl.classList.remove("active");
    if (!bubbleEl) {
      bubbleEl = appendMessage("elysia", "", true);
    }
    fullText = `Mohon maaf, tidak dapat terhubung ke server backend ELYSIA (${err.message}). Pastikan server Flask aktif.`;
    bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
    showToast("Gagal berkomunikasi dengan server.", "error");
  } finally {
    isStreaming = false;
    sendBtnEl.disabled = !userInputEl.value.trim();
    typingEl.classList.remove("active");
    refreshIcons();
    scrollToBottom();
  }
}

// ── Trigger Rekomendasi Game ──────────────────────────────────────────────
async function triggerRecommend() {
  if (isStreaming) return;

  if (messageCount === 0) {
    showToast("Silakan beritahu preferensi game Anda di obrolan terlebih dahulu.", "info");
    return;
  }

  showToast("ELYSIA sedang menganalisis DNA & preferensi Anda...", "info");
  btnRecommend.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        top_n: 6,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (result.games && result.games.length > 0) {
      renderGameRecommendations(result.games);
      toggleSidebar(true); // Buka sidebar otomatis
      showToast(`Ditemukan ${result.games.length} rekomendasi game yang cocok.`, "success");
    } else {
      showToast("Tidak ada game yang cocok dengan kriteria saat ini.", "info");
    }
  } catch (err) {
    showToast(`Gagal memuat rekomendasi: ${err.message}`, "error");
  } finally {
    btnRecommend.disabled = false;
  }
}

// ── Render Daftar Rekomendasi Game ────────────────────────────────────────
function renderGameRecommendations(games) {
  // Hapus kartu lama kecuali empty placeholder
  const oldCards = gameCardsEl.querySelectorAll(".game-card");
  oldCards.forEach((c) => c.remove());

  if (!games || games.length === 0) {
    if (sidebarEmptyEl) sidebarEmptyEl.style.display = "flex";
    sidebarCountEl.textContent = "0";
    return;
  }

  if (sidebarEmptyEl) sidebarEmptyEl.style.display = "none";
  sidebarCountEl.textContent = games.length;

  games.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "game-card";

    // Format harga IDR
    let priceText = "Gratis";
    let originalPriceText = "";
    if (game.price_idr > 0) {
      priceText = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(game.price_idr);

      if (game.original_price_idr > game.price_idr) {
        originalPriceText = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(game.original_price_idr);
      }
    }

    // Genre list
    const genresList = (game.genres || "")
      .split("||")
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
      .slice(0, 3);

    const genresHtml = genresList
      .map((g) => `<span class="genre-tag">${g}</span>`)
      .join("");

    // Steam link
    const steamUrl = game.steam_appid
      ? `https://store.steampowered.com/app/${game.steam_appid}/`
      : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`;

    // Cover image fallback
    const coverUrl = game.cover_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80";

    // Nilai DNA (0.0 - 1.0)
    const dna = game.dna || { hardcore: 0.5, complex: 0.5, adrenaline: 0.5 };
    const hardcorePct = Math.round((dna.hardcore || 0.5) * 100);
    const complexPct = Math.round((dna.complex || 0.5) * 100);
    const adrenalinePct = Math.round((dna.adrenaline || 0.5) * 100);

    card.innerHTML = `
      <div class="game-card-banner">
        <img src="${coverUrl}" alt="${game.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'" />
        <div class="game-card-rank">
          <i data-lucide="award"></i>
          <span>#${index + 1} — Kecocokan ${game.match_score}%</span>
        </div>
      </div>

      <div class="game-card-body">
        <h3 class="game-card-title">${game.title}</h3>
        
        <div class="game-genres">
          ${genresHtml}
        </div>

        <div class="game-dna-box">
          <div class="dna-label-row">
            <span>Playstyle DNA</span>
            <span>${game.match_label || "Tinggi"}</span>
          </div>

          <div class="dna-bar-item">
            <span class="dna-name">Hardcore</span>
            <div class="dna-track"><div class="dna-fill" style="width: ${hardcorePct}%"></div></div>
            <span class="dna-val">${hardcorePct}%</span>
          </div>

          <div class="dna-bar-item">
            <span class="dna-name">Kompleksitas</span>
            <div class="dna-track"><div class="dna-fill" style="width: ${complexPct}%"></div></div>
            <span class="dna-val">${complexPct}%</span>
          </div>

          <div class="dna-bar-item">
            <span class="dna-name">Adrenalin</span>
            <div class="dna-track"><div class="dna-fill" style="width: ${adrenalinePct}%"></div></div>
            <span class="dna-val">${adrenalinePct}%</span>
          </div>
        </div>

        <div class="game-card-footer">
          <div class="game-pricing">
            ${originalPriceText ? `<span class="game-original-price">${originalPriceText}</span>` : ""}
            <span class="game-final-price ${game.price_idr === 0 ? "free" : ""}">${priceText}</span>
          </div>

          <a href="${steamUrl}" target="_blank" rel="noopener noreferrer" class="btn-steam">
            <span>Buka Steam</span>
            <i data-lucide="external-link"></i>
          </a>
        </div>
      </div>
    `;

    gameCardsEl.appendChild(card);
  });

  refreshIcons();
}

// ── Simpan Sesi Percakapan ────────────────────────────────────────────────
async function saveChat() {
  if (!sessionId) {
    showToast("Belum ada obrolan aktif untuk disimpan.", "info");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/session/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });

    const result = await response.json();
    if (response.ok) {
      showToast(`Riwayat sesi disimpan: ${result.filename || "sukses"}`, "success");
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    showToast(`Gagal menyimpan: ${err.message}`, "error");
  }
}

// ── Reset Percakapan (Sesi Baru) ──────────────────────────────────────────
async function resetChat() {
  if (isStreaming) return;

  if (sessionId) {
    try {
      await fetch(`${API_BASE}/session/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (e) {
      // Abaikan jika offline
    }
  }

  // Reset UI
  sessionId = null;
  messageCount = 0;
  messagesEl.innerHTML = "";
  if (welcomeHeroEl) welcomeHeroEl.style.display = "block";

  // Reset Game Cards
  const oldCards = gameCardsEl.querySelectorAll(".game-card");
  oldCards.forEach((c) => c.remove());
  if (sidebarEmptyEl) sidebarEmptyEl.style.display = "flex";
  sidebarCountEl.textContent = "0";

  showToast("Sesi obrolan baru telah dimulai.", "info");
  refreshIcons();
}

// ── Health Check Server pada Load Awal ────────────────────────────────────
async function checkServerHealth() {
  statusDotEl.className = "status-dot connecting";
  statusTextEl.textContent = "Menghubungkan...";

  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      statusDotEl.className = "status-dot";
      statusTextEl.textContent = `Online (${data.model || "Gemini"})`;
    } else {
      throw new Error("Respon server tidak normal");
    }
  } catch (e) {
    statusDotEl.className = "status-dot error";
    statusTextEl.textContent = "Server Offline";
  }
}

// ── Inisialisasi Saat Halaman Selesai Dimuat ──────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  refreshIcons();
  checkServerHealth();
});
