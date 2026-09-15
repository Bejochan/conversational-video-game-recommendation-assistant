# ELYSIA — Emotionally-Adjusted Ludic Yield Spatial Integrated Assistant
### Conversational Video Game Recommendation Assistant berbasis Large Language Model (LLM) & Psychographic Playstyle DNA

Proyek ini mengintegrasikan kecerdasan bahasa alami (**Google Gemini API**) dengan sistem rekomendasi multi-aspek (**Playstyle DNA, Dynamic Mood Modifier, dan Filter Budget Steam Rupiah/IDR**) yang diadaptasi dari dataset 24.082 game.

---

## 📌 Daftar Isi
1. [Konsep & Tema Chatbot](#-konsep--tema-chatbot)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur & Alur Sistem](#-arsitektur--alur-sistem)
4. [Struktur Repositori](#-struktur-repositori)
5. [Panduan Menjalankan Program (Step-by-Step)](#-panduan-menjalankan-program-step-by-step)
   - [A. Eksperimen di Notebook (Jupyter / Google Colab)](#a-eksperimen-di-notebook-jupyter--google-colab)
   - [B. Menjalankan Chatbot Terminal (CLI)](#b-menjalankan-chatbot-terminal-cli)
   - [C. Menjalankan Web UI Interaktif (Frontend)](#c-menjalankan-web-ui-interaktif-frontend)
6. [Contoh Cuplikan Percakapan](#-contoh-cuplikan-percakapan)
7. [Penjelasan Struktur Kode](#-penjelasan-struktur-kode)
8. [Catatan Pengembangan & Penggunaan AI](#-catatan-pengembangan--penggunaan-ai)

---

## 🎮 Konsep & Tema Chatbot

**ELYSIA** bertindak sebagai asisten virtual cerdas yang membantu gamer menemukan video game yang paling relevan melalui dialog natural dua arah.

Tidak seperti sistem pencarian konvensional yang kaku dan hanya mengandalkan kata kunci genre, ELYSIA memahami konteks emosional dan psikografis bermain pengguna:
* **Playstyle DNA (3 Dimensi)**:
  - *Casual vs Hardcore* (0.0 – 1.0): preferensi kompleksitas mekanik dan dedikasi waktu bermain.
  - *Simple vs Complex* (0.0 – 1.0): kedalaman sistem permainan dan strategi.
  - *Calming vs Adrenaline* (0.0 – 1.0): preferensi atmosfer santai vs ketegangan/kecepatan aksi.
* **Dynamic Mood Modifier**: Menyesuaikan bobot DNA secara instan sesuai suasana hati pengguna saat ini (*Relaxed, Competitive, Immersive, Focused*).
* **Real Steam IDR Marketplace**: Mempertimbangkan rentang anggaran belanja dalam Rupiah (IDR) asli serta menampilkan informasi diskon Steam aktif.

---

## ⭐ Fitur Utama

ELYSIA menawarkan serangkaian kapabilitas cerdas untuk memberikan pengalaman kurasi game yang interaktif dan personal:

| Kategori | Fitur & Deskripsi |
| :--- | :--- |
| **LLM Core** | Integrasi dengan **Google Gemini API** (`gemini-1.5-flash` / `gemini-2.5-flash`) untuk pemahaman bahasa alami dan penalaran preferensi pengguna. |
| **System Prompt & Persona** | Persona asisten gamer yang ramah, berwawasan luas seputar industri game, adaptif, dan komunikatif. |
| **Conversation History** | Manajemen state riwayat percakapan dinamis multi-turn berbasis sesi yang konsisten. |
| **Streaming Response** | Penampilan respons secara *real-time* kata-demi-kata (*streaming*), baik di terminal maupun Web UI. |
| **Save & Load Session History** | Kemampuan ekspor dan impor riwayat sesi obrolan ke format berkas JSON terstruktur. |
| **Error Handling & Resilience** | Mekanisme proteksi terhadap kendala jaringan, limit kuota API, dan respon tidak terduga agar program tetap andal. |
| **Perintah Khusus Terminal** | Navigasi interaktif via CLI: `exit` (keluar), `clear`/`reset` (reset konteks sesi), `save` (simpan riwayat), dan `recommend` (kalkulasi rekomendasi langsung). |
| **Modern Web Interface** | Antarmuka pengguna interaktif bergaya Modern Glassmorphism yang responsif, terpisah secara modular antara frontend dan backend. |
| **Hybrid Recommendation Engine** | Integrasi Content-Based Filtering + 3D Euclidean Distance Playstyle DNA + Score Rating (Metacritic & RAWG) + Price Value & Diskon Steam IDR. |

---

## 🔄 Arsitektur & Alur Sistem

```text
       [ Pengguna ]
            │ (Pesan Bahasa Alami: Mood, Budget, Preferensi)
            ▼
    [ ELYSIA Chatbot Core ]
            │
            ├─► [ Conversation History & System Prompt ]
            │
            ▼
    [ Google Gemini API ]
            │ (Analisis Bahasa & Ekstraksi Entitas Parameter:
            │  Mood, Playstyle DNA, Genre, Max Budget IDR)
            ▼
  [ Recommendation Algorithm ]
            │ (Pencocokan Euclidean 3D DNA + Jaccard Genre + Bobot Rating & Diskon)
            ▼
     [ Dataset games.csv ] (24.082 Game dengan Data Harga Steam IDR)
            │
            ▼
 [ Respons Rekomendasi Terpersonalisasi ]
            │ (Streaming Teks + Kartu Game + Badge Diskon IDR + Visualisasi DNA)
            ▼
       [ Pengguna ]
```

---

## 📁 Struktur Repositori

```text
conversational-video-game-recommendation-assistant/
├── backend/                              # Backend Python & Logika Chatbot
│   ├── config.py                         # Konfigurasi aplikasi & load .env
│   ├── chatbot.py                        # Modul integrasi Gemini API, loop CLI & history
│   └── recommendation_algorithm.py       # Engine Playstyle DNA, mood adjustment & scoring
│
├── frontend/                             # User Interface Berbasis Web
│   ├── index.html                        # Halaman utama antarmuka chat (Glassmorphism)
│   └── app.js                            # Logika interaksi frontend & streaming visual
│
├── notebooks/                            # Eksperimen & Prototyping
│   └── chatbot_notebook.ipynb            # Notebook eksplorasi Gemini API, prompt & ekstraksi
│
├── data/                                 # Sumber Data Game
│   └── games.csv                         # Dataset 24.082 video game (RAWG + Steam IDR)
│
├── screenshots/                          # Cuplikan Bukti Implementasi & Pengujian
│
├── .env.example                          # Contoh template konfigurasi environment
├── .gitignore                            # Mengabaikan .env, virtual env, dan file cache
├── requirements.txt                      # Dependensi pustaka Python
└── README.md                             # Dokumentasi utama proyek
```

---

## 🚀 Panduan Menjalankan Program (Step-by-Step)

### Prasyarat Awal
- **Python 3.10+** terpasang pada sistem.
- **Google Gemini API Key** (Dapatkan secara gratis di [Google AI Studio](https://aistudio.google.com/)).

---

### A. Eksperimen di Notebook (Jupyter / Google Colab)

1. Buka berkas notebook di direktori:
   ```text
   notebooks/chatbot_notebook.ipynb
   ```
2. Jalankan cell secara berurutan:
   - **Instalasi pustaka** (`google-generativeai`, `python-dotenv`, `pandas`, dll.).
   - **Konfigurasi API Key**: Menggunakan Colab Secrets atau berkas `.env` lokal.
   - **Uji Coba System Prompt & Streaming**: Mengecek respon bertahap model Gemini.
   - **Simulasi Ekstraksi Parameter & Rekomendasi Game**.

---

### B. Menjalankan Chatbot Terminal (CLI)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/Bejochan/conversational-video-game-recommendation-assistant.git
   cd conversational-video-game-recommendation-assistant
   ```

2. **Buat dan aktifkan Virtual Environment:**
   - **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependensi:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Konfigurasi API Key:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan API Key Anda:
   ```env
   GEMINI_API_KEY=AIzaSy_masukkan_api_key_kamu_di_sini
   ```

5. **Jalankan Chatbot CLI:**
   ```bash
   python backend/chatbot.py
   ```

---

### C. Menjalankan Web UI Interaktif (Frontend)

1. Jalankan backend service (Flask):
   ```bash
   python backend/app.py
   ```
   *(Server akan berjalan di `http://127.0.0.1:5000`)*
2. Buka `frontend/index.html` langsung di browser atau menggunakan ekstensi VS Code *Live Server*.

---

## 💬 Contoh Cuplikan Percakapan

---

## 🧩 Penjelasan Struktur Kode

1. **`backend/config.py`**:
   - Memuat variabel lingkungan (`.env`) secara aman menggunakan `python-dotenv`.
   - Mengatur parameter dasar LLM seperti pemilihan model (`gemini-1.5-flash`), `temperature` (default 0.7), dan path dataset `data/games.csv`.
2. **`backend/recommendation_algorithm.py`**:
   - Memuat dan membersihkan dataset `games.csv` (24.082 baris).
   - Menghitung koordinat vektor 3D Playstyle DNA setiap game (`dna_hardcore`, `dna_complex`, `dna_adrenaline`).
   - Fungsi `apply_mood_modifier()` untuk penyesuaian dinamis DNA berdasarkan mood pengguna.
   - Algoritma pencocokan multi-aspek (Euclidean distance DNA, Jaccard similarity genre, rating Metacritic/RAWG, dan batas budget Steam IDR).
3. **`backend/chatbot.py`**:
   - Inisialisasi Google Gemini GenerativeModel dengan `SYSTEM_PROMPT` persona ELYSIA.
   - Pengelolaan memori sesi (*conversation history* berbasis list of dict role `user` dan `model`).
   - Penanganan *streaming response* generator (`response.resolve()` / `send_message_stream`).
   - Loop CLI interaktif dengan *exception handling* dan perintah khusus (`exit`, `clear`, `save`).
4. **`frontend/` (`index.html` & `app.js`)**:
   - UI modern responsif dengan gaya Glassmorphism.
   - Komponen bubble chat untuk pengguna dan ELYSIA dengan efek *typing/streaming indicator*.
   - Kartu display rekomendasi game interaktif (cover art, pill genre, badge harga & diskon Steam).

---

## 🤖 Catatan Pengembangan & Penggunaan AI

Proyek ini dikembangkan dengan pendekatan kolaboratif berbasis *AI-assisted software engineering*:

* **Arsitektur & Logika Inti (Human-Led Design)**:
  - Konseptualisasi, penamaan, dan formulasi persona asisten **ELYSIA**.
  - Formulasi metrik Playstyle DNA 3 Dimensi (*Casual vs Hardcore*, *Simple vs Complex*, *Calming vs Adrenaline*) serta logika dinamis *Mood Modifier*.
  - Perancangan arsitektur integrasi sistem rekomendasi hybrid dengan conversational LLM agent.
  - Pengumpulan, kurasi, dan penyesuaian dataset 24.082 game (metadata RAWG dan integrasi harga Steam IDR).
  - Perancangan System Prompt, batasan instruksi, persona bahasa, dan skenario dialog.

* **Dukungan AI Assistant**:
  - Penyusunan boilerplate integrasi SDK Google Gemini API dan generator streaming respons.
  - Penataan struktur *exception handling* dan fungsi utilitas session state.
  - Pemolesan styling Glassmorphism CSS pada antarmuka frontend.
  - Optimasi dan perapian formatting dokumentasi repositori.