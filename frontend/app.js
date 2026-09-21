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
let currentRecommendations = [];

// ── Referensi Elemen DOM ──────────────────────────────────────────────────
const messagesEl           = document.getElementById("messages");
const welcomeHeroEl        = document.getElementById("welcome-hero");
const userInputEl          = document.getElementById("user-input");
const sendBtnEl            = document.getElementById("send-btn");
const typingEl             = document.getElementById("typing-indicator");
const chatScrollEl         = document.getElementById("chat-scroll");
const toastEl              = document.getElementById("toast");
const toastTextEl          = document.getElementById("toast-text");
const toastIconEl          = document.getElementById("toast-icon");
const statusDotEl          = document.getElementById("status-dot");
const statusTextEl         = document.getElementById("status-text");

const btnRecommend         = document.getElementById("btn-recommend");
const btnSave              = document.getElementById("btn-save");
const btnClear             = document.getElementById("btn-clear");
const btnHistory           = document.getElementById("btn-history");

const btnToggleSidebar     = document.getElementById("btn-toggle-sidebar");
const btnFloatingSidebar   = document.getElementById("btn-floating-sidebar");
const btnCloseSidebar      = document.getElementById("btn-close-sidebar");
const sidebarDrawer        = document.getElementById("sidebar-drawer");
const sidebarCountEl       = document.getElementById("sidebar-count");
const floatingBadgeEl      = document.getElementById("floating-badge");
const gameCardsEl          = document.getElementById("game-cards");
const sidebarEmptyEl       = document.getElementById("sidebar-empty");

const historyModal         = document.getElementById("history-modal");
const btnCloseHistory      = document.getElementById("btn-close-history");
const historyListEl        = document.getElementById("history-list");

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

// ── Pengendali Buka/Tutup Sidebar (Selalu Tersedia) ────────────────────────
function toggleSidebar(forceOpen = null) {
  const isClosed = sidebarDrawer.classList.contains("closed");
  const shouldOpen = forceOpen !== null ? forceOpen : isClosed;

  if (shouldOpen) {
    sidebarDrawer.classList.remove("closed");
    btnToggleSidebar.classList.add("active");
    if (btnFloatingSidebar) btnFloatingSidebar.classList.add("sidebar-open");
  } else {
    sidebarDrawer.classList.add("closed");
    btnToggleSidebar.classList.remove("active");
    if (btnFloatingSidebar) btnFloatingSidebar.classList.remove("sidebar-open");
  }
}

btnToggleSidebar.addEventListener("click", () => toggleSidebar());
if (btnFloatingSidebar) btnFloatingSidebar.addEventListener("click", () => toggleSidebar());
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

// ── Markdown-lite Parser (Bebas Emoji, Sempurna untuk List & Paragraf) ──
function renderMarkdown(text) {
  if (!text) return "";

  // 1. Safety escape HTML
  let raw = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Inline styles (Bold, italic, headings, hr)
  raw = raw
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>");

  // 3. Process blocks line by line so lists and paragraphs are cleanly formed
  const lines = raw.split("\n");
  const blocks = [];
  let currentList = [];

  function flushList() {
    if (currentList.length > 0) {
      blocks.push(`<ul>${currentList.join("")}</ul>`);
      currentList = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "[ACTION_RECOMMEND_BUTTON]") {
      flushList();
      blocks.push(`
        <div class="chat-fallback-action-card">
          <div class="fallback-action-header">
            <i data-lucide="compass" class="fallback-action-icon"></i>
            <span class="fallback-action-badge">Mode Kurasi Terfokus</span>
          </div>
          <p class="fallback-action-desc">Sistem ELYSIA siap menyajikan kurasi rekomendasi video game terbaik berdasarkan intisari kata kunci yang telah Anda diskusikan.</p>
          <button type="button" class="btn-chat-action-recommend" onclick="triggerRecommend()">
            <i data-lucide="sparkles"></i>
            <span>Dapatkan Rekomendasi Game Sekarang</span>
          </button>
        </div>
      `);
      continue;
    }

    // Check for list item (- item, * item, • item, or 1. item)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    const numMatch = line.match(/^\d+[\.)]\s+(.+)$/);

    if (bulletMatch || numMatch) {
      const content = bulletMatch ? bulletMatch[1] : numMatch[1];
      currentList.push(`<li>${content}</li>`);
    } else {
      if (line === "") {
        // If blank line, peek ahead to see if next line continues the list
        let nextIsList = false;
        for (let j = i + 1; j < lines.length; j++) {
          const peek = lines[j].trim();
          if (peek) {
            if (peek.match(/^[-*•]\s+/) || peek.match(/^\d+[\.)]\s+/)) {
              nextIsList = true;
            }
            break;
          }
        }
        if (!nextIsList) {
          flushList();
        }
      } else {
        flushList();
        blocks.push(`<p>${line}</p>`);
      }
    }
  }
  flushList();

  return blocks.join("");
}

// ── Toolbar Aksi Pesan (Salin Chat & Tulis Ulang / Rewrite) ─────────────────
function createMessageActions(role, getPlainTextFn, rowEl, bubbleEl) {
  const actionsEl = document.createElement("div");
  actionsEl.className = "message-actions";

  // 1. Tombol Salin Chat
  const btnCopy = document.createElement("button");
  btnCopy.type = "button";
  btnCopy.className = "btn-msg-action btn-copy";
  btnCopy.title = "Salin teks percakapan";
  btnCopy.innerHTML = `<i data-lucide="copy"></i><span>Salin</span>`;
  btnCopy.addEventListener("click", async () => {
    try {
      const textToCopy = (getPlainTextFn() || "").trim();
      if (!textToCopy) return;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      btnCopy.classList.add("copied");
      btnCopy.innerHTML = `<i data-lucide="check"></i><span>Tersalin</span>`;
      refreshIcons();
      showToast("Pesan berhasil disalin ke papan klip.", "success");

      setTimeout(() => {
        btnCopy.classList.remove("copied");
        btnCopy.innerHTML = `<i data-lucide="copy"></i><span>Salin</span>`;
        refreshIcons();
      }, 2000);
    } catch (e) {
      showToast("Gagal menyalin pesan.", "error");
    }
  });
  actionsEl.appendChild(btnCopy);

  // 2. Jika pesan ELYSIA: Tambahkan opsi Tulis Ulang (Regenerate)
  if (role === "elysia") {
    const btnRewrite = document.createElement("button");
    btnRewrite.type = "button";
    btnRewrite.className = "btn-msg-action btn-rewrite";
    btnRewrite.title = "Tulis ulang jawaban ELYSIA";
    btnRewrite.innerHTML = `<i data-lucide="rotate-cw"></i><span>Tulis Ulang</span>`;
    btnRewrite.addEventListener("click", () => {
      rewriteMessage(rowEl, bubbleEl);
    });
    actionsEl.appendChild(btnRewrite);
  }

  // 3. Jika pesan Pengguna: Tambahkan opsi Edit / Tulis Ulang Prompt
  if (role === "user") {
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn-msg-action btn-edit";
    btnEdit.title = "Muat pesan ke input untuk diedit dan dikirim ulang";
    btnEdit.innerHTML = `<i data-lucide="pencil"></i><span>Edit</span>`;
    btnEdit.addEventListener("click", () => {
      const promptText = (getPlainTextFn() || "").trim();
      userInputEl.value = promptText;
      userInputEl.dispatchEvent(new Event("input"));
      userInputEl.focus();
      scrollToBottom();
      showToast("Pesan dimuat ke kolom input. Silakan edit dan kirim ulang.", "info");
    });
    actionsEl.appendChild(btnEdit);
  }

  return actionsEl;
}

// ── Fungsi Tulis Ulang (Regenerate) Respons ELYSIA ─────────────────────────
async function rewriteMessage(rowEl, bubbleEl) {
  if (isStreaming) {
    showToast("Mohon tunggu hingga respons saat ini selesai.", "info");
    return;
  }

  if (!sessionId) {
    showToast("Belum ada riwayat sesi untuk ditulis ulang.", "info");
    return;
  }

  // Sembunyikan toolbar aksi saat proses berlangsung
  const actionsEl = rowEl.querySelector(".message-actions");
  if (actionsEl) actionsEl.remove();

  isStreaming = true;
  typingEl.classList.add("active");
  bubbleEl.innerHTML = `<p><em>Sedang menulis ulang tanggapan...</em></p>`;
  scrollToBottom();

  let fullText = "";

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        regenerate: true,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${response.status}`);
    }

    typingEl.classList.remove("active");
    bubbleEl.innerHTML = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw);
            const textChunk = data.chunk !== undefined ? data.chunk : (data.content || "");
            if (textChunk) {
              fullText += textChunk;
              bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
              scrollToBottom();
            }

            if (data.error) {
              fullText += `\n\n[Terjadi kendala: ${data.error}]`;
              bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
            }
          } catch (e) {
            // Abaikan JSON parsial
          }
        }
      }
    }

    showToast("Tanggapan berhasil ditulis ulang.", "success");
  } catch (err) {
    typingEl.classList.remove("active");
    fullText = `Mohon maaf, terjadi kendala saat menulis ulang tanggapan (${err.message}).`;
    bubbleEl.innerHTML = `<p>${renderMarkdown(fullText)}</p>`;
    showToast(`Gagal menulis ulang: ${err.message}`, "error");
  } finally {
    isStreaming = false;
    sendBtnEl.disabled = !userInputEl.value.trim();
    typingEl.classList.remove("active");

    // Pasang kembali toolbar aksi
    const bodyEl = rowEl.querySelector(".message-body");
    if (bodyEl && !bodyEl.querySelector(".message-actions")) {
      const newActions = createMessageActions("elysia", () => bubbleEl.innerText || fullText, rowEl, bubbleEl);
      bodyEl.appendChild(newActions);
    }
    refreshIcons();
    scrollToBottom();
  }
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

  // Jika bukan streaming (misal: pesan user atau pesan riwayat lama), langsung pasang tombol aksi
  if (!streaming) {
    const actions = createMessageActions(role, () => bubble.innerText || content, row, bubble);
    body.appendChild(actions);
  }

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

    // Pasang toolbar aksi pada pesan ELYSIA setelah streaming selesai
    if (bubbleEl) {
      const row = bubbleEl.closest(".message-row");
      const body = bubbleEl.closest(".message-body");
      if (body && !body.querySelector(".message-actions")) {
        const actions = createMessageActions("elysia", () => bubbleEl.innerText || fullText, row, bubbleEl);
        body.appendChild(actions);
      }
    }

    refreshIcons();
    scrollToBottom();
  }
}

// ── Trigger Rekomendasi Game ──────────────────────────────────────────────
async function triggerRecommend() {
  if (isStreaming) return;

  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 12);
  }

  showToast("ELYSIA sedang menganalisis preferensi & DNA gaya bermain Anda...", "info");
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
      currentRecommendations = result.games;
      
      const userDna = result.adjusted_dna || null;
      const mood = result.mood_applied || null;
      const fallbackNotice = result.is_fallback ? result.fallback_notice : null;

      // 1. Render di sidebar drawer
      renderSidebarRecommendations(result.games, userDna, mood, fallbackNotice);
      
      // 2. Render kartu langsung di dalam aliran chat agar tidak terpotong!
      renderInChatRecommendations(result.games, userDna, mood, fallbackNotice);

      // 3. Buka sidebar otomatis
      toggleSidebar(true);
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

// ── Playstyle DNA Radar Chart SVG Generator ──────────────────────────────
function createPlaystyleRadarSvg(dna, size = 160, isMini = false) {
  const hardcore = Math.max(0.12, Math.min(1.0, dna.hardcore || 0.5));
  const complex = Math.max(0.12, Math.min(1.0, dna.complex || 0.5));
  const adrenaline = Math.max(0.12, Math.min(1.0, dna.adrenaline || 0.5));

  const cx = size / 2;
  const cy = size / 2;
  const maxR = isMini ? size * 0.42 : size * 0.36;

  // 3 sudut sumbu (radian):
  // Sumbu 1: Hardcore (Atas: -PI/2)
  // Sumbu 2: Kompleksitas (Kanan-Bawah: PI/6)
  // Sumbu 3: Adrenalin (Kiri-Bawah: 5*PI/6)
  const angleH = -Math.PI / 2;
  const angleC = Math.PI / 6;
  const angleA = (5 * Math.PI) / 6;

  // Koordinat titik data
  const xH = (cx + maxR * hardcore * Math.cos(angleH)).toFixed(1);
  const yH = (cy + maxR * hardcore * Math.sin(angleH)).toFixed(1);

  const xC = (cx + maxR * complex * Math.cos(angleC)).toFixed(1);
  const yC = (cy + maxR * complex * Math.sin(angleC)).toFixed(1);

  const xA = (cx + maxR * adrenaline * Math.cos(angleA)).toFixed(1);
  const yA = (cy + maxR * adrenaline * Math.sin(angleA)).toFixed(1);

  // Garis kisi latar belakang segitiga
  let gridHtml = "";
  const levels = isMini ? [1.0, 0.5] : [1.0, 0.66, 0.33];
  levels.forEach((lvl) => {
    const gxH = (cx + maxR * lvl * Math.cos(angleH)).toFixed(1);
    const gyH = (cy + maxR * lvl * Math.sin(angleH)).toFixed(1);
    const gxC = (cx + maxR * lvl * Math.cos(angleC)).toFixed(1);
    const gyC = (cy + maxR * lvl * Math.sin(angleC)).toFixed(1);
    const gxA = (cx + maxR * lvl * Math.cos(angleA)).toFixed(1);
    const gyA = (cy + maxR * lvl * Math.sin(angleA)).toFixed(1);
    gridHtml += `<polygon points="${gxH},${gyH} ${gxC},${gyC} ${gxA},${gyA}" fill="none" stroke="rgba(197, 139, 36, ${lvl === 1.0 ? 0.35 : 0.16})" stroke-width="${lvl === 1.0 ? (isMini ? 1 : 1.2) : 0.8}" stroke-dasharray="${lvl === 1.0 ? 'none' : '3,3'}" />`;
  });

  // Garis Sumbu
  const axH = (cx + maxR * Math.cos(angleH)).toFixed(1);
  const ayH = (cy + maxR * Math.sin(angleH)).toFixed(1);
  const axC = (cx + maxR * Math.cos(angleC)).toFixed(1);
  const ayC = (cy + maxR * Math.sin(angleC)).toFixed(1);
  const axA = (cx + maxR * Math.cos(angleA)).toFixed(1);
  const ayA = (cy + maxR * Math.sin(angleA)).toFixed(1);

  const axisLines = `
    <line x1="${cx}" y1="${cy}" x2="${axH}" y2="${ayH}" stroke="rgba(197, 139, 36, 0.22)" stroke-width="${isMini ? 0.8 : 1}" />
    <line x1="${cx}" y1="${cy}" x2="${axC}" y2="${ayC}" stroke="rgba(197, 139, 36, 0.22)" stroke-width="${isMini ? 0.8 : 1}" />
    <line x1="${cx}" y1="${cy}" x2="${axA}" y2="${ayA}" stroke="rgba(197, 139, 36, 0.22)" stroke-width="${isMini ? 0.8 : 1}" />
  `;

  // Label Sumbu (khusus radar ukuran penuh)
  let labelsHtml = "";
  if (!isMini) {
    labelsHtml = `
      <text x="${axH}" y="${Number(ayH) - 8}" text-anchor="middle" fill="#201B17" font-size="10.5" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Hardcore (${Math.round(hardcore * 100)}%)</text>
      <text x="${Number(axC) + 6}" y="${Number(ayC) + 12}" text-anchor="start" fill="#201B17" font-size="10.5" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Kompleks (${Math.round(complex * 100)}%)</text>
      <text x="${Number(axA) - 6}" y="${Number(ayA) + 12}" text-anchor="end" fill="#201B17" font-size="10.5" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Adrenalin (${Math.round(adrenaline * 100)}%)</text>
    `;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radar-svg ${isMini ? 'mini' : ''}">
      ${gridHtml}
      ${axisLines}
      <!-- Poligon Playstyle DNA -->
      <polygon points="${xH},${yH} ${xC},${yC} ${xA},${yA}" fill="rgba(197, 139, 36, 0.26)" stroke="#C58B24" stroke-width="${isMini ? 1.6 : 2.2}" stroke-linejoin="round" />
      <!-- Titik Vertex -->
      <circle cx="${xH}" cy="${yH}" r="${isMini ? 2 : 3.5}" fill="#C58B24" stroke="#FFFFFF" stroke-width="${isMini ? 0.8 : 1.2}" />
      <circle cx="${xC}" cy="${yC}" r="${isMini ? 2 : 3.5}" fill="#C58B24" stroke="#FFFFFF" stroke-width="${isMini ? 0.8 : 1.2}" />
      <circle cx="${xA}" cy="${yA}" r="${isMini ? 2 : 3.5}" fill="#C58B24" stroke="#FFFFFF" stroke-width="${isMini ? 0.8 : 1.2}" />
      ${labelsHtml}
    </svg>
  `;
}

// ── HTML Kartu Rangkuman DNA Radar ────────────────────────────────────────
function createRadarSummaryCardHtml(dna, mood) {
  const moodLabel = mood && mood !== "none" ? `Mood: ${mood}` : "Profil Gaya Bermain";
  const hardcorePct = Math.round((dna.hardcore || 0.5) * 100);
  const complexPct = Math.round((dna.complex || 0.5) * 100);
  const adrenalinePct = Math.round((dna.adrenaline || 0.5) * 100);

  return `
    <div class="dna-radar-summary-card">
      <div class="dna-radar-header">
        <div class="dna-radar-title-group">
          <i data-lucide="compass"></i>
          <span class="dna-radar-title">Profil Playstyle DNA Teridentifikasi</span>
        </div>
        <span class="dna-mood-badge">${moodLabel}</span>
      </div>

      <div class="dna-radar-body">
        <div class="dna-radar-canvas-wrap">
          ${createPlaystyleRadarSvg(dna, 170, false)}
        </div>

        <div class="dna-radar-metrics">
          <div class="dna-metric-row">
            <span class="dna-metric-name">Casual ↔ Hardcore</span>
            <span class="dna-metric-val">${hardcorePct}%</span>
          </div>
          <div class="dna-track"><div class="dna-fill" style="width: ${hardcorePct}%"></div></div>

          <div class="dna-metric-row">
            <span class="dna-metric-name">Simple ↔ Kompleks</span>
            <span class="dna-metric-val">${complexPct}%</span>
          </div>
          <div class="dna-track"><div class="dna-fill" style="width: ${complexPct}%"></div></div>

          <div class="dna-metric-row">
            <span class="dna-metric-name">Calm ↔ Adrenalin</span>
            <span class="dna-metric-val">${adrenalinePct}%</span>
          </div>
          <div class="dna-track"><div class="dna-fill" style="width: ${adrenalinePct}%"></div></div>
        </div>
      </div>
    </div>
  `;
}

// ── Helper: Dapatkan Poster Game Berkualitas Tinggi ───────────────────────
function getGamePosterUrl(game) {
  // 1. Gambar cover RAWG dari dataset (terbukti 100% valid untuk semua game di dataset)
  if (
    game.cover_url &&
    game.cover_url.startsWith("http") &&
    !game.cover_url.includes("unsplash")
  ) {
    return game.cover_url;
  }
  // 2. Poster header Steam
  if (game.steam_appid) {
    return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.steam_appid}/header.jpg`;
  }
  return "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80";
}

// ── Template HTML Kartu Game (Lengkap dengan Mini Radar DNA) ──────────────
function createGameCardHtml(game, index) {
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

  // Genre pills
  const genresList = (game.genres || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3);

  const genresHtml = genresList
    .map((g) => `<span class="game-genre-pill">${g}</span>`)
    .join("");

  // Steam link
  const steamUrl = game.steam_appid
    ? `https://store.steampowered.com/app/${game.steam_appid}/`
    : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`;

  const posterUrl = getGamePosterUrl(game);

  // Nilai DNA Playstyle (0.0 - 1.0)
  const dna = game.dna || { hardcore: 0.5, complex: 0.5, adrenaline: 0.5 };
  const hardcorePct = Math.round((dna.hardcore || 0.5) * 100);
  const complexPct = Math.round((dna.complex || 0.5) * 100);
  const adrenalinePct = Math.round((dna.adrenaline || 0.5) * 100);

  return `
    <div class="game-card">
      <div class="game-card-banner">
        <img 
          src="${posterUrl}" 
          alt="${game.title}" 
          loading="lazy" 
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80';"
        />
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

          <div class="game-dna-flex">
            <div class="game-dna-radar-mini" title="Radar Playstyle DNA Game">
              ${createPlaystyleRadarSvg(dna, 58, true)}
            </div>

            <div class="game-dna-bars-col">
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
    </div>
  `;
}

// ── Banner Mode Terfokus / Fallback UX ────────────────────────────────────
function createFallbackBannerHtml(notice) {
  if (!notice) return "";
  const title = notice.title || "Kurasi Mode Terfokus";
  const message = notice.message || "";
  return `
    <div class="fallback-mode-banner">
      <div class="fallback-banner-header">
        <i data-lucide="sparkles" class="fallback-banner-icon"></i>
        <span class="fallback-banner-title">${title}</span>
      </div>
      <p class="fallback-banner-text">${message}</p>
    </div>
  `;
}

// ── Render Rekomendasi di Sidebar Drawer ──────────────────────────────────
function renderSidebarRecommendations(games, userDna, mood, fallbackNotice = null) {
  const oldCards = gameCardsEl.querySelectorAll(".game-card, .dna-radar-summary-card, .fallback-mode-banner");
  oldCards.forEach((c) => c.remove());

  if (!games || games.length === 0) {
    if (sidebarEmptyEl) sidebarEmptyEl.style.display = "flex";
    sidebarCountEl.textContent = "0";
    if (floatingBadgeEl) floatingBadgeEl.textContent = "0";
    return;
  }

  if (sidebarEmptyEl) sidebarEmptyEl.style.display = "none";
  sidebarCountEl.textContent = games.length;
  if (floatingBadgeEl) floatingBadgeEl.textContent = games.length;

  // Jika ada notifikasi fallback / mode terfokus
  if (fallbackNotice) {
    const tempNotice = document.createElement("div");
    tempNotice.innerHTML = createFallbackBannerHtml(fallbackNotice);
    gameCardsEl.appendChild(tempNotice.firstElementChild);
  }

  // Jika tersedia profil Playstyle DNA pengguna, render kartu Radar Chart di drawer
  if (userDna) {
    const tempRadar = document.createElement("div");
    tempRadar.innerHTML = createRadarSummaryCardHtml(userDna, mood);
    gameCardsEl.appendChild(tempRadar.firstElementChild);
  }

  games.forEach((game, index) => {
    const temp = document.createElement("div");
    temp.innerHTML = createGameCardHtml(game, index);
    gameCardsEl.appendChild(temp.firstElementChild);
  });

  refreshIcons();
}

// ── Render Rekomendasi Langsung di Aliran Bubble Chat (Anti-Terpotong) ────
function renderInChatRecommendations(games, userDna, mood, fallbackNotice = null) {
  const introText = fallbackNotice
    ? "Berikut adalah kurasi video game terbaik yang disintesis ELYSIA untuk Anda:"
    : "Berdasarkan analisis Playstyle DNA dan preferensi obrolan Anda, berikut adalah profil gaya bermain dan video game terbaik yang saya pilihkan untuk Anda:";
  const bubble = appendMessage("elysia", introText);

  // Banner mode terfokus jika dalam fallback mode
  if (fallbackNotice) {
    const tempNotice = document.createElement("div");
    tempNotice.innerHTML = createFallbackBannerHtml(fallbackNotice);
    bubble.appendChild(tempNotice.firstElementChild);
  }

  // Jika tersedia profil Playstyle DNA pengguna, tampilkan kartu Radar Chart di dalam bubble chat
  if (userDna) {
    const tempRadar = document.createElement("div");
    tempRadar.innerHTML = createRadarSummaryCardHtml(userDna, mood);
    bubble.appendChild(tempRadar.firstElementChild);
  }

  const deckWrapper = document.createElement("div");
  deckWrapper.className = "chat-deck-container";

  const grid = document.createElement("div");
  grid.className = "chat-deck-grid";

  games.forEach((game, index) => {
    const temp = document.createElement("div");
    temp.innerHTML = createGameCardHtml(game, index);
    grid.appendChild(temp.firstElementChild);
  });

  deckWrapper.appendChild(grid);
  bubble.appendChild(deckWrapper);

  refreshIcons();
  scrollToBottom();
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
      showToast(`Riwayat tersimpan: ${result.filename || "sukses"}`, "success");
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    showToast(`Gagal menyimpan: ${err.message}`, "error");
  }
}

// ── Riwayat Obrolan (History Modal) ───────────────────────────────────────
async function openHistoryModal() {
  historyModal.classList.add("active");
  historyListEl.innerHTML = `
    <div class="history-empty">
      <i data-lucide="loader-2" class="spin"></i>
      <p>Memuat daftar riwayat obrolan...</p>
    </div>
  `;
  refreshIcons();

  try {
    const response = await fetch(`${API_BASE}/session/history`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal memuat riwayat");
    }

    const items = data.history || [];
    if (items.length === 0) {
      historyListEl.innerHTML = `
        <div class="history-empty">
          <i data-lucide="inbox"></i>
          <p>Belum ada riwayat percakapan tersimpan.<br>Klik tombol "Simpan" di bagian atas untuk menyimpan obrolan.</p>
        </div>
      `;
      refreshIcons();
      return;
    }

    historyListEl.innerHTML = "";
    items.forEach((item) => {
      const el = document.createElement("div");
      el.className = "history-item";
      el.innerHTML = `
        <div class="history-item-top">
          <span>${item.date}</span>
          <span class="history-item-badge">${item.message_count} pesan</span>
        </div>
        <div class="history-item-preview">${item.preview}</div>
      `;

      el.addEventListener("click", () => loadHistorySession(item.filename));
      historyListEl.appendChild(el);
    });

    refreshIcons();
  } catch (err) {
    historyListEl.innerHTML = `
      <div class="history-empty">
        <i data-lucide="alert-circle"></i>
        <p>Terjadi kendala saat mengambil riwayat: ${err.message}</p>
      </div>
    `;
    refreshIcons();
  }
}

function closeHistoryModal() {
  historyModal.classList.remove("active");
}

async function loadHistorySession(filename) {
  closeHistoryModal();
  showToast("Memuat riwayat obrolan...", "info");

  try {
    const response = await fetch(`${API_BASE}/session/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal memuat sesi");
    }

    // Reset UI dan pasang session baru
    sessionId = data.session_id;
    messagesEl.innerHTML = "";
    if (welcomeHeroEl) welcomeHeroEl.style.display = "none";
    messageCount = 0;

    // Render ulang pesan dari log
    const msgs = data.messages || [];
    msgs.forEach((m) => {
      appendMessage(m.role === "model" ? "elysia" : "user", m.content);
    });

    showToast("Riwayat obrolan berhasil dimuat kembali.", "success");
    scrollToBottom();
  } catch (err) {
    showToast(`Gagal membuka riwayat: ${err.message}`, "error");
  }
}

btnHistory.addEventListener("click", openHistoryModal);
btnCloseHistory.addEventListener("click", closeHistoryModal);
historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) closeHistoryModal();
});

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
  currentRecommendations = [];
  messagesEl.innerHTML = "";
  if (welcomeHeroEl) welcomeHeroEl.style.display = "block";

  // Reset Game Cards
  const oldCards = gameCardsEl.querySelectorAll(".game-card");
  oldCards.forEach((c) => c.remove());
  if (sidebarEmptyEl) sidebarEmptyEl.style.display = "flex";
  sidebarCountEl.textContent = "0";
  if (floatingBadgeEl) floatingBadgeEl.textContent = "0";

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
