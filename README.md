# ELYSIA — Emotionally-adjusted Ludic Yield Spatial Integrated Assistant
### Conversational Video Game Recommendation Assistant berbasis Large Language Model (LLM) & Psychographic Playstyle DNA

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://elysia-video-game-recommendation.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-API-4E75F6?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)

> 🌐 **Live Web Application**: [https://elysia-video-game-recommendation.onrender.com/](https://elysia-video-game-recommendation.onrender.com/)

ELYSIA adalah asisten virtual interaktif berbasis kecerdasan buatan yang memadukan kapabilitas pemahaman bahasa alami dari **Google Gemini API** (arsitektur *multi-model cascade* dengan model primer `gemini-3.6-flash`) dengan sistem rekomendasi multi-aspek (**Playstyle DNA 3D, Dynamic Mood Modifier, dan Filter Anggaran Steam IDR**) yang diadaptasi dari basis data kurasi 24.082 video game.


---

## Daftar Isi
1. [Konsep & Pendekatan Asisten](#konsep--pendekatan-asisten)
2. [Spesifikasi Sistem & Fitur Pokok](#spesifikasi-sistem--fitur-pokok)
3. [Desain Antarmuka (UI/UX) & Interaktivitas Modern](#desain-antarmuka-uiux--interaktivitas-modern)
4. [Arsitektur & Alur Kerja Sistem](#arsitektur--alur-kerja-sistem)
5. [Deployment Cloud (Render Web Service)](#deployment-cloud-render-web-service)
6. [Struktur Repositori](#struktur-repositori)
7. [Panduan Menjalankan Program (Step-by-Step)](#panduan-menjalankan-program-step-by-step)
   - [A. Akses Aplikasi Langsung (Live Cloud Demo)](#a-akses-aplikasi-langsung-live-cloud-demo)
   - [B. Eksperimen di Notebook (Jupyter / VS Code)](#b-eksperimen-di-notebook-jupyter--vs-code)
   - [C. Menjalankan Chatbot Terminal (CLI)](#c-menjalankan-chatbot-terminal-cli)
   - [D. Menjalankan Web UI Interaktif Lokal (Fullstack Flask)](#d-menjalankan-web-ui-interaktif-lokal-fullstack-flask)
8. [Contoh Cuplikan Percakapan & Pengujian](#contoh-cuplikan-percakapan--pengujian)
9. [Penjelasan Modul Kode](#penjelasan-modul-kode)
10. [Catatan Pengembangan & Pembagian Jobdesk (Human vs AI)](#catatan-pengembangan--pembagian-jobdesk-human-vs-ai)
    - [A. Rincian Peran & Tanggung Jawab](#a-rincian-peran--tanggung-jawab)
    - [B. Matriks Pembagian Tugas & Rationale Persentase](#b-matriks-pembagian-tugas--rationale-persentase)

---

## Konsep & Pendekatan Asisten

Sistem pencarian video game konvensional umumnya mengandalkan pencocokan kata kunci atau filter genre yang kaku. Pendekatan ini sering kali gagal menangkap kebutuhan gamer yang bersifat situasional, emosional, dan kontekstual.

**ELYSIA** hadir sebagai asisten kurasi personal dengan pendekatan dialog natural dua arah:
* **Playstyle DNA (3 Dimensi Psikografis)**:
  - *Casual vs Hardcore* (0.0 - 1.0): Mengukur tingkat komitmen waktu, kedalaman mekanik, dan toleransi tantangan pemain.
  - *Simple vs Complex* (0.0 - 1.0): Mengukur kedalaman sistem permainan, strategi, dan kurva pembelajaran (*learning curve*).
  - *Calming vs Adrenaline* (0.0 - 1.0): Mengukur spektrum emosional gameplay dari relaksasi meditatif hingga ketegangan aksi berkecepatan tinggi.
* **Dynamic Mood Modifier**: Menyesuaikan bobot koordinat DNA secara instan mengikuti suasana hati pemain (*Relaxed, Competitive, Immersive, Focused*).
* **Integrasi Pasar Steam IDR Nyata**: Mempertimbangkan rentang anggaran belanja dalam Rupiah asli serta memperhitungkan promo diskon Steam aktif.
* **Two-Stage Retrieval & Pemahaman Konteks Semantik Granular**: Mengatasi keterbatasan genre makro (seperti kategori *Action* yang mencampur aduk game senjata api dan pedang). ELYSIA menerapkan kurasi dua tahap: Tahap 1 memfilter kandidat matematis (DNA + genre), dan Tahap 2 memanfaatkan LLM sebagai *Neural Re-Ranker* untuk memahami nuansa spesifik dan batasan negatif (*negative constraints*, misalnya: *"mau tembak-tembakan, tidak mau game pedang"*).
* **Gaya Komunikasi Editorial & Empatik**: Dirancang dengan persona yang santun, hangat, berpengetahuan mendalam tentang industri video game, serta mematuhi kebijakan *zero-emoji* guna mempertahankan nuansa editorial yang elegan dan profesional.


---

## Spesifikasi Sistem & Fitur Pokok

ELYSIA dirancang dengan arsitektur modular yang menggabungkan penalaran kognitif Large Language Model dengan komputasi deterministik sistem rekomendasi. Seluruh arsitektur dibangun untuk memenuhi standar keandalan tinggi, interaktivitas multi-lingkungan, dan penanganan galat yang tangguh:

| Komponen & Fitur Pokok | Spesifikasi & Implementasi Arsitektural |
| :--- | :--- |
| **Cloud LLM API & Multi-Model Cascade** | Menggunakan antarmuka resmi **Google Gemini API** (berbasis cloud, bukan model lokal) dengan model primer **`gemini-3.6-flash`**. Dilengkapi mekanisme *failover cascade* otomatis ke model cadangan (`gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-flash-latest`) untuk menjamin ketersediaan layanan yang tinggi (*high availability*). |
| **Persona & Rekayasa System Prompt** | Mengimplementasikan `SYSTEM_PROMPT` khusus yang membentuk karakter asisten kurasi game yang santun, suportif, berwawasan mendalam seputar industri video game, serta tunduk pada batasan *zero-emoji policy* untuk menjaga nada bicara editorial yang elegan. |
| **State Management & Conversation History** | Mengelola memori percakapan multi-turn secara persisten antar giliran dialog (*in-session memory*). Chatbot secara konsisten mengingat preferensi, mood, dan kriteria yang telah disampaikan pengguna pada pesan-pesan sebelumnya. |
| **Resiliensi & Error Handling Bertingkat** | Sistem dilengkapi proteksi pengecualian (*exception handling*) menyeluruh agar program tidak pernah crash saat menghadapi kendala jaringan atau limitasi kuota (HTTP 429). Jika seluruh model LLM mencapai batas kuota, sistem secara elegan mengaktifkan **Mode Heuristik Terfokus** berbasis ekstraksi kata kunci regex tanpa menghentikan proses rekomendasi. |
| **Sistem Perintah Kontrol Khusus** | Menyediakan serangkaian instruksi kendali terintegrasi baik pada antarmuka teks maupun web:<br>• `exit` : Mengakhiri sesi interaksi secara bersih.<br>• `clear` / `reset` : Mengosongkan riwayat dialog untuk memulai sesi konsultasi baru.<br>• `save` : Mengekspor transkrip percakapan ke berkas JSON terstruktur.<br>• `recommend` : Memicu analisis preferensi dan kalkulasi kurasi game. |
| **Dukungan Multi-Environment** | Sistem dapat dioperasikan secara fleksibel di tiga lingkungan eksekusi berbeda:<br>1. **Terminal / Console CLI** (`backend/chatbot.py`): Eksekusi cepat berbasis command-line.<br>2. **Interactive Jupyter Notebook** (`notebooks/chatbot_notebook.ipynb`): Lingkungan riset, pengujian step-by-step, dan pencatatan riwayat dialog sinkron.<br>3. **Fullstack Modern Web Application** (`frontend/` + Flask backend): Pengalaman antarmuka visual penuh dengan drawer riwayat dan visualisasi Playstyle DNA. |
| **Pipeline Real-Time Streaming** | Menyajikan teks tanggapan secara bertahap kata demi kata (*word-by-word streaming*) untuk interaktivitas real-time, menggunakan Python generator pada lingkungan terminal/notebook dan protokol *Server-Sent Events (SSE)* pada antarmuka web. |
| **Ekstraksi Preferensi Terstruktur** | Memanfaatkan *structured prompting* dengan keluaran JSON deterministik untuk memetakan bahasa alami pengguna ke dalam parameter matematis: entitas mood, genre, batasan dana IDR, serta estimasi koordinat 3D Playstyle DNA. |
| **Manajemen Persistensi Sesi (Save & Load)** | Menyediakan kemampuan ekspor riwayat sesi ke berkas JSON berstempel waktu (*timestamped history*) dan pemuatan kembali (*load session*) secara langsung dari antarmuka pengguna. |
| **Hybrid Recommendation Engine & Visualisasi** | Algoritma kurasi multi-aspek yang memadukan jarak Euclidean 3D DNA, Jaccard Similarity genre, rating Metacritic/RAWG, dan kepatuhan anggaran dana IDR dari basis data 24.082 game, divisualisasikan melalui **SVG 3D Playstyle DNA Radar Chart**. |
| **Two-Stage Retrieval & LLM Re-Ranking** | Mengatasi limitasi genre makro melalui arsitektur 2 tahap: Tahap 1 menyaring 25 kandidat game teratas secara matematis (DNA + Genre + Rating + Harga), kemudian Tahap 2 memanfaatkan LLM Gemini sebagai *Neural Re-Ranker* untuk memvalidasi preferensi detail dan mengeksekusi batasan negatif (misal: membedakan senjata api vs pedang) sebelum menyajikan Top 6 hasil akhir. |


---

## Desain Antarmuka (UI/UX) & Interaktivitas Modern

Antarmuka ELYSIA dirancang secara khusus untuk memberikan pengalaman percakapan yang imersif, tenang, dan bernuansa editorial premium. Menggabungkan prinsip estetika editorial dengan teknologi web modern tanpa dependensi *framework* yang berat (*Pure Vanilla Stack*).

### 1. Filosofi Estetika & Palet Warna
* **Warm Editorial Parchment**: Terinspirasi dari gaya visual editorial manga *Veil* karya Kotteri serta kesederhanaan interaksi modern Google Gemini.
* **Palet Warna Kurasi**:
  - `Background Parchment`: `#FAF7F2` dan `#FFFFFF` (memberikan kenyamanan visual saat membaca narasi panjang).
  - `Text & Ink Accent`: `#1E1B18` (midnight ink) dan `#5A524C` (charcoal muted).
  - `Brand & Dynamic Accent`: `#C97A63` (terracotta blush) dan `#7E9A94` (sage mist).
* **Tipografi Kontras**: Memadukan font serif editorial (*Playfair Display*) untuk judul dan aksen dengan sans-serif modern (*Plus Jakarta Sans*) untuk keterbacaan teks dialog chat.

### 2. Stack Teknologi UI/UX
* **HTML5 Semantik**: Struktur layout yang terstandarisasi, aksesibel, dengan pemisahan area obrolan, drawer navigasi riwayat sesi, dan modal konfirmasi interaktif.
* **Vanilla CSS3 Modern**:
  - Pemanfaatan CSS Variables / Design Tokens terpusat untuk konsistensi margin, warna, dan radius.
  - Efek *glassmorphism* (`backdrop-filter: blur()`) pada topbar dan panel kontrol.
  - Animasi mikro halus (*fade-in slide-up*, hover elevation, pulsating dot indicator saat ELYSIA berpikir).
  - Layout *fully responsive* yang adaptif di layar smartphone maupun desktop lebar.
* **Vanilla JavaScript (ES6+)**:
  - **Real-Time SSE Streaming Reader**: Mengonsumsi `text/event-stream` melalui `ReadableStream` bawaan peramban, menyajikan respons dialog kata demi kata secara instan tanpa lag.
  - **Custom Markdown & Code Parser**: Menerjemahkan format bold, list, dan link secara real-time dari chunk teks streaming.
  - **Fitur Salin Teks (Copy to Clipboard)**: Tombol salin satu sentuhan pada setiap gelembung pesan pengguna dan asisten, dilengkapi dengan *toast notification* non-intrusif.
  - **Fitur Tulis Ulang (Regenerate / Rewrite)**: Kemampuan meminta ELYSIA menyusun ulang jawaban alternatif secara otomatis jika pengguna menginginkan sudut pandang kurasi yang berbeda.
  - **Visualisasi Dinamis 3D Playstyle DNA (SVG Radar Chart)**: Menghitung koordinat poligon SVG di sisi klien secara matematis untuk menampilkan radar profil game (*Hardcore*, *Complexity*, *Adrenaline*).
  - **Slide-Over History Drawer**: Panel riwayat percakapan yang elegan untuk menyimpan, memuat kembali, atau menghapus arsip percakapan tanpa meninggalkan sesi saat ini.

---

## Arsitektur & Alur Kerja Sistem

```text
       [ Pengguna ]
            | (Pesan Bahasa Alami: Mood, Gaya Bermain, Batas Budget IDR)
            v
    [ ELYSIA Chatbot Core ]
            |
            +--> [ Session History & System Prompt Persona ]
            |
            v
    [ Google Gemini API (gemini-3.6-flash) ]
            | (Analisis Konteks, Respon Dialog Alami &
            |  Ekstraksi Entitas JSON: Mood, DNA, Genre, Max Budget)
            v
  [ Tahap 1: Hybrid Recommendation Engine ]
            | (Pencocokan Euclidean 3D DNA + Jaccard Genre + Bobot Rating & Diskon)
            v
      [ Dataset games.csv ] (24.082 Game dengan Data Harga Steam IDR)
            |
            |--> [ Pool Kandidat 25 Game Teratas ]
            v
  [ Tahap 2: LLM Neural Re-Ranker ]
            | (Validasi Semantik Granular: Senjata Api vs Pedang, Pantangan Negatif)
            v
  [ Top 6 Hasil Terkurasi & Kartu Game Interaktif ]
            | (Streaming Penjelasan Naratif + Daftar Rekomendasi Game + Badge Diskon IDR)
            v
       [ Pengguna ]
```

### Alur Kerja Two-Stage Retrieval & Re-Ranking:
1. **Tahap 1 — Candidate Generation (Penyaringan Cepat & Skalabilitas)**:
   Sistem memproses basis data 24.082 game menggunakan komputasi vektorisasi NumPy/Pandas dalam waktu < 50 milidetik. Filter mempertimbangkan jarak Euclidean 3D DNA, Jaccard Similarity genre, normalisasi rating, dan kepatuhan anggaran Steam IDR untuk menghasilkan *pool* **25 game kandidat teratas**.
2. **Tahap 2 — Neural Re-Ranking (Pemahaman Konteks Semantik & Negative Constraints)**:
   Daftar 25 kandidat tersebut dievaluasi kembali oleh Large Language Model (**Google Gemini**) yang bertindak sebagai *Neural Re-Ranker*. Model meneliti nuansa percakapan pengguna secara mendalam (misal: preferensi tema, sub-mekanik seperti senjata api/tembakan, atau larangan negatif seperti *"gamau game pedang"*, *"jangan horor/zombie"*), lalu memilih **Top 6 game paling presisi** yang bebas dari kontradiksi preferensi pengguna.

---

## Deployment Cloud (Render Web Service)

ELYSIA telah di-*deploy* secara penuh dan dapat diakses publik tanpa perlu menjalankan *server* lokal melalui platform cloud **Render** sebagai **Web Service**.

> 🌐 **Tautan Layanan Cloud**: [https://elysia-video-game-recommendation.onrender.com/](https://elysia-video-game-recommendation.onrender.com/)

### Spesifikasi Arsitektur Cloud
| Parameter | Konfigurasi & Implementasi |
| :--- | :--- |
| **Penyedia Platform** | [Render.com](https://render.com/) (Fully-managed Cloud Application Platform) |
| **Tipe Layanan** | **Web Service** (Menyajikan RESTful API Flask, SSE streaming, dan UI statis) |
| **Lokasi Server (Region)** | **Singapore** (Meminimalkan latensi jaringan bagi pengguna di Indonesia) |
| **Runtime Environment** | **Python 3** (Linux container) |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python backend/app.py` |
| **Host & Port Binding** | Otomatis mengenali host `0.0.0.0` dan memetakan variabel lingkungan `$PORT` dinamis Render |
| **Manajemen Rahasia** | `GEMINI_API_KEY` disimpan terenkripsi pada *Render Environment Secrets*, aman dari eksposur publik |
| **Continuous Deployment** | Sinkronisasi otomatis (*Auto-Deploy*) dari branch `main` GitHub setiap kali ada rilis baru |
| **Manajemen Sumber Daya** | Fitur hemat daya *automatic spin-down* setelah 15 menit tanpa aktivitas pengguna |

---

## Struktur Repositori

```text
conversational-video-game-recommendation-assistant/
├── backend/                              # Modul Backend & Algoritma Rekomendasi
│   ├── app.py                            # Flask API server, SSE streaming & static file server
│   ├── chatbot.py                        # Modul integrasi Gemini API, loop CLI & manajemen history
│   ├── config.py                         # Konfigurasi model, parameter LLM & pemuatan .env
│   └── recommendation_algorithm.py       # Engine 3D Playstyle DNA, mood modifier & kalkulasi skor
│
├── frontend/                             # Antarmuka Pengguna Berbasis Web
│   ├── app.js                            # Logika interaksi klien, streaming SSE, markdown & modal
│   ├── index.html                        # Struktur semantik antarmuka chat & drawer riwayat
│   └── style.css                         # Desain tema editorial light (warm parchment & sans-serif)
│
├── notebooks/                            # Eksperimen & Validasi
│   └── chatbot_notebook.ipynb            # Notebook interaktif, uji coba prompt & eksekusi dialog
│
├── data/                                 # Sumber Data
│   └── games.csv                         # Basis data 24.082 game (RAWG metadata + Steam IDR)
│
├── screenshots/                          # Bukti Pengujian & Dokumentasi Visual
│   ├── Chat Notebook.md                  # Transkrip utuh dialog multi-turn pada pengujian notebook
│   ├── Hasil Percobaan Notebook.png      # Tangkapan layar bukti eksekusi notebook
│   └── Chatbot Website.md                # Dokumentasi visual & screenshot antarmuka web live
│
├── .env.example                          # Template konfigurasi variabel lingkungan
├── .gitignore                            # Berkas pengecualian Git
├── requirements.txt                      # Daftar dependensi pustaka Python
└── README.md                             # Dokumentasi utama proyek
```

---

## Panduan Menjalankan Program (Step-by-Step)

### Prasyarat Awal
- **Python 3.10+** telah terpasang pada komputer Anda.
- **Google Gemini API Key** yang masih aktif (dapat diperoleh melalui [Google AI Studio](https://aistudio.google.com/)).

---

### A. Akses Aplikasi Langsung (Live Cloud Demo)

Cara termudah dan tercepat untuk mencoba ELYSIA adalah langsung melalui peramban web tanpa perlu instalasi lingkungan Python lokal:

1. Buka tautan: [https://elysia-video-game-recommendation.onrender.com/](https://elysia-video-game-recommendation.onrender.com/)
2. Mulai obrolan dengan mengetik preferensi atau suasana hati (*mood*) bermain game Anda.
3. Gunakan tombol **Rekomendasikan Game** atau ketik kata kunci rekomendasi untuk memicu kurasi cerdas.

> *Catatan: Jika server sedang dalam kondisi tidur karena periode inaktivitas, proses pemuatan pertama memerlukan waktu sekitar 30–50 detik (cold start).*

---

### B. Eksperimen di Notebook (Jupyter / VS Code)

1. Buka berkas [notebooks/chatbot_notebook.ipynb](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/notebooks/chatbot_notebook.ipynb).
2. Pastikan kernel Python aktif mengarah ke lingkungan kerja virtual Anda.
3. Jalankan sel secara berurutan:
   - Inisialisasi pustaka dan pemuatan API Key dari berkas `.env`.
   - Inisialisasi model `gemini-3.5-flash` dengan konfigurasi System Prompt persona ELYSIA.
   - Uji coba respons streaming bertahap.
   - Pemuatan dataset dan pra-kalkulasi 3D Playstyle DNA.
   - Menjalankan fungsi interaktif `jalankan_elysia_interactive()` di mana input pengguna dan jawaban ELYSIA akan langsung tercetak berdampingan di output sel.

---

### C. Menjalankan Chatbot Terminal (CLI)

1. **Clone repositori:**
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

3. **Pasang dependensi pustaka:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Konfigurasi API Key:**
   Salin berkas template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka berkas `.env` dan masukkan API Key Anda:
   ```env
   GEMINI_API_KEY=AIzaSy_masukkan_api_key_anda_di_sini
   ```

5. **Jalankan program CLI:**
   ```bash
   python backend/chatbot.py
   ```
   *Perintah khusus di terminal:*
   - `exit`: Keluar dari sesi percakapan.
   - `clear`: Mengosongkan memori percakapan saat ini.
   - `save`: Menyimpan transkrip percakapan ke berkas JSON.
   - `recommend`: Menganalisis obrolan dan memberikan kartu rekomendasi game langsung.

---

### D. Menjalankan Web UI Interaktif Lokal (Fullstack Flask)

1. Pastikan dependensi sudah terpasang dan `.env` sudah terisi dengan benar.
2. Jalankan server aplikasi:
   ```bash
   python backend/app.py
   ```
3. Akses antarmuka web melalui peramban pada alamat:
   ```text
   http://127.0.0.1:5000
   ```
   Server Flask secara otomatis menyajikan API backend beserta aset statis frontend (`index.html`, `style.css`, `app.js`) tanpa perlu menjalankan server web tambahan secara terpisah.

---

## Contoh Cuplikan Percakapan & Pengujian

Berikut adalah cuplikan transkrip nyata dari sesi pengujian multi-turn interaktif menggunakan [notebooks/chatbot_notebook.ipynb](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/notebooks/chatbot_notebook.ipynb):

```text
=================================================================
       ELYSIA - Video Game Recommendation Assistant
=================================================================

Anda   : Konbanwa Elysia, aku lagi pengen main game yang menantang adrenalin 
         tapi ada karakter-karakter yang lucu

ELYSIA : Selamat malam. Senang sekali bisa menyapamu di malam hari ini. 

         Kombinasi yang kamu cari sangat menarik. Memacu adrenalin namun 
         tetap ingin ditemani oleh karakter-karakter yang menggemaskan adalah 
         perpaduan kontras yang seru sekali untuk dimainkan.

         Elysia punya beberapa bayangan game yang mungkin cocok dengan seleramu. 
         Misalnya, apakah kamu tertarik dengan game seperti Cult of the Lamb? 
         Di sana kamu akan berperan sebagai anak domba lucu yang memimpin sekte, 
         namun bertarung di dalam dungeon dengan gameplay roguelike yang intens. 
         Atau kamu lebih suka game seperti Cuphead?

         Sebelum kita menyelam lebih dalam, boleh Elysia tahu apakah kamu lebih 
         menyukai petualangan solo atau multiplayer? Serta berapa rentang budget 
         yang sedang kamu siapkan di Steam saat ini?

Anda   : Game solo aja karena aku introvert dan budgetku under 200k karena lagi bokek

ELYSIA : Pilihan yang sangat dimengerti. Terkadang, menghabiskan waktu sendiri 
         dengan game solo berkualitas adalah cara terbaik mengisi energi. 

         Dengan budget di bawah 200 ribu Rupiah, kamu punya opsi luar biasa di Steam:
         1. Cuphead (Sekitar Rp 115.000)
         2. Hollow Knight (Sekitar Rp 125.000)
         3. Enter the Gungeon (Sekitar Rp 115.000)

Anda   : recommend

[Sistem] Menganalisis preferensi dari riwayat percakapan...
ELYSIA : Halo kembali. Elysia sudah menyiapkan daftar rekomendasi game yang sudah 
         disaring khusus untukmu dengan budget di bawah 200 ribu Rupiah:

         1. SUPERHOT VR (Tingkat Kecocokan: 84.2%)
            * Harga: Rp 63.999 (Sedang diskon 60%)
            * Genre: Action, Shooter, Simulation, Indie
         2. Blood (Tingkat Kecocokan: 84.1%)
            * Harga: Free to Play (Gratis)
            * Genre: Action, Shooter, Simulation, Indie
         3. AirMech Wastelands (Tingkat Kecocokan: 83.1%)
            * Harga: Rp 95.999
            * Genre: Action, RPG, Strategy, Indie
         4. The Chronicles Of Myrtana: Archolos (Tingkat Kecocokan: 83.0%)
            * Harga: Free to Play (Gratis)
            * Genre: Action, RPG, Indie
         5. The Last Spell (Tingkat Kecocokan: 83.0%)
            * Harga: Rp 62.099 (Sedang diskon 70%)
            * Genre: Action, RPG, Strategy, Indie

Anda   : exit

ELYSIA : Terima kasih sudah mengobrol! Sampai jumpa di petualangan gaming berikutnya!
```

> Dokumentasi pengujian lengkap dapat dilihat pada [screenshots/Chat Notebook.md](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/screenshots/Chat%20Notebook.md) (lingkungan notebook), [screenshots/Hasil Percobaan Notebook.png](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/screenshots/Hasil%20Percobaan%20Notebook.png), dan dokumentasi visual antarmuka web interaktif pada [screenshots/Chatbot Website.md](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/screenshots/Chatbot%20Website.md).


---

## Penjelasan Modul Kode

1. **`backend/config.py`**:
   - Mengelola pemuatan variabel lingkungan secara aman melalui `python-dotenv` dengan parameter `override=True`.
   - Mengatur parameter model LLM primer (`gemini-3.6-flash`) beserta daftar *fallback cascade* (`gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-flash-latest`).
   - Mengonfigurasi parameter *network binding* yang dinamis (`HOST = 0.0.0.0` dan membaca variabel lingkungan `$PORT`) sehingga aplikasi siap dijalankan baik di localhost maupun di platform cloud Render.

2. **`backend/recommendation_algorithm.py`**:
   - Memuat dataset 24.082 baris data game.
   - Melakukan pra-kalkulasi vektor Playstyle DNA 3D (`dna_hardcore`, `dna_complex`, `dna_adrenaline`).
   - Menyediakan fungsi `apply_mood_modifier()` untuk penyesuaian dinamis bobot DNA.
   - Menghitung skor kemiripan gabungan (jarak Euclidean DNA 3D, Jaccard Similarity genre, normalisasi rating Metacritic/RAWG, dan pemfilteran budget Steam IDR).

3. **`backend/chatbot.py`**:
   - Menginisialisasi `GenerativeModel` Google Gemini dengan System Prompt persona ELYSIA.
   - Mengatur riwayat percakapan (*conversation history*) multi-turn berbasis sesi.
   - Mengimplementasikan antarmuka interaktif CLI dengan penanganan pengecualian dan fungsi ekspor riwayat chat ke JSON.
   - Mengimplementasikan fungsi **Two-Stage Re-Ranking** (`rerank_recommendations()` & `RERANK_PROMPT`): memanfaatkan pemahaman semantik Gemini untuk memeriksa preferensi detail pengguna dan mengeliminasi judul yang bertentangan dengan batasan negatif sebelum kartu game disajikan.

4. **`backend/app.py`**:
   - Server backend berbasis Flask yang menyediakan endpoint RESTful:
     - `POST /api/chat`: Endpoint streaming percakapan menggunakan format Server-Sent Events (SSE).
     - `POST /api/recommend`: Endpoint kurasi cerdas berbasis pipa *Two-Stage Retrieval* (mengambil *candidate pool* 25 game dari engine matematis lalu mengeksekusi LLM Re-Ranking untuk menghasilkan Top 6 game paling presisi).
     - `GET /api/session/history` & `POST /api/session/load`: Pengelolaan sesi obrolan.
   - Melayani penyajian berkas statis frontend secara langsung baik di lokal maupun di cloud container.

5. **`frontend/` (`index.html`, `style.css`, `app.js`)**:
   - **Pure Vanilla Web Stack**: Dibangun murni dengan HTML5 Semantik, Modern CSS3, dan Vanilla JavaScript ES6+ tanpa dependensi framework besar.
   - **Desain Editorial Warm Parchment**: Mengusung tema visual yang menenangkan (`#FAF7F2` parchment dan aksen terakota `#C97A63`) dengan tipografi serif-sans kontras.
   - **Interaktivitas & Streaming Real-Time**: Penanganan pembacaan chunk teks Server-Sent Events (SSE) menggunakan `ReadableStream` dan parser Markdown internal.
   - **Fitur Salin & Tulis Ulang Pesan**: Setiap bubble chat dilengkapi tombol aksi praktis untuk menyalin teks ke clipboard (dengan indikator toast) serta tombol tulis ulang (*regenerate*) untuk mendapatkan respons baru dari ELYSIA.
   - **Visualisasi Dinamis SVG Radar Chart**: Merender grafik radar 3D Playstyle DNA secara instan pada setiap kartu rekomendasi game.
   - **Drawer Riwayat Sesi**: Panel samping (*slide-over drawer*) yang mulus untuk beralih, memuat, atau mereset sesi percakapan.

---

## Catatan Pengembangan & Pembagian Jobdesk (Human vs AI)

Proyek ini dikembangkan secara kolaboratif menggunakan pendekatan **AI-Assisted Pair Programming**. Dalam proses ini, **Pengguna / Mahasiswa (Human)** bertindak sebagai pengarah kebutuhan (*director*), kurator dataset, penentu preferensi desain, dan penguji sistem (*human-in-the-loop*), sedangkan **AI Assistant** bertindak sebagai akselerator teknis yang menyusun sintaks kode, mengimplementasikan logika komputasi, dan mendiagnosis kendala teknis.

Pembagian kontribusi di bawah ini disusun secara objektif dan realistis untuk mencerminkan porsi kerja nyata selama pengembangan proyek.

---

### A. Rincian Peran & Tanggung Jawab

#### 1. Ideasi & Konseptualisasi Produk
* **Kontribusi Human**: Menentukan tema tugas (asisten rekomendasi video game), mengusulkan pendekatan berbasis psikografis/kondisi pemain (bukan sekadar filter genre kaku), serta menetapkan batasan tema (estetika editorial, kebijakan *zero-emoji*).
* **Kontribusi AI**: Membantu merumuskan nama akronim **ELYSIA** (*Emotionally-Adjusted Ludic Yield Spatial Integrated Assistant*), mengelaborasi konsep Playstyle DNA ke dalam 3 dimensi terukur (*Casual vs Hardcore*, *Simple vs Complex*, *Calming vs Adrenaline*), serta mendefinisikan skema modifikasi mood.

#### 2. Penyediaan & Kurasi Data
* **Kontribusi Human**: Memilih dataset `games.csv` (24.082 game) yang relevan, menentukan atribut penting yang wajib ada (metadata RAWG, harga pasar Steam IDR, persentase diskon, dan rating).
* **Kontribusi AI**: Membantu penulisan skrip pembersihan data (*data cleaning*), penanganan nilai yang hilang (*missing values*), normalisasi tipe data harga, dan pengujian integritas struktur data dengan Pandas.

#### 3. Formulasi & Implementasi Algoritma Rekomendasi
* **Kontribusi Human**: Menentukan kriteria logika bisnis rekomendasi (kedekatan DNA, genre, rating, dan budget), mengidentifikasi limitasi semantik pada genre makro (seperti game tembak-tembakan vs pedang yang sama-sama bergenre Action), serta mengarahkan penerapan pendekatan *Two-Stage Retrieval*.
* **Kontribusi AI**: Merumuskan kalkulasi matematis (jarak Euclidean 3D DNA dan Jaccard Similarity genre), menyusun formula komputasi vektorisasi NumPy/Pandas (< 100 ms), serta mengimplementasikan pipa *Two-Stage Neural Re-Ranking* menggunakan LLM Gemini untuk memvalidasi preferensi detail dan batasan negatif pengguna.


#### 4. Prompt Engineering & Persona Design
* **Kontribusi Human**: Menetapkan identitas persona ELYSIA (santun, berwawasan luas, empatik, bernada tenang, dan larangan mutlak penggunaan emoji), serta menentukan skenario interaksi pengguna yang akan diuji.
* **Kontribusi AI**: Menyusun naskah *System Prompt* secara komprehensif, merancang aturan batasan (*guardrails*) agar model tetap berada dalam konteks gaming, serta menyusun skema JSON terstruktur untuk mengekstraksi entitas preferensi pengguna.

#### 5. Pengembangan Backend & Integrasi API
* **Kontribusi Human**: Menentukan kebutuhan antarmuka (tersedia versi terminal CLI, notebook interaktif, dan server web lokal), menyediakan API Key Google Gemini, dan menjalankan server secara lokal.
* **Kontribusi AI**: Menulis seluruh kode backend (`backend/app.py`, `backend/chatbot.py`, `backend/config.py`), mengintegrasikan Google Generative AI SDK, mengimplementasikan transmisi *real-time streaming* berbasis Server-Sent Events (SSE), serta merancang mekanisme penyimpanan dan pemuatan riwayat sesi (JSON history).

#### 6. Desain & Pengembangan Antarmuka Web (UI/UX)
* **Kontribusi Human**: Menentukan referensi visual spesifik (gaya editorial bernuansa *warm parchment* `#FAF7F2` yang terinspirasi dari manga *Veil* karya Kotteri dipadukan dengan kesederhanaan Google Gemini, tipografi serif-sans kontras, kartu game seragam, dan drawer riwayat percakapan).
* **Kontribusi AI**: Menerjemahkan visi visual tersebut ke dalam kode Vanilla CSS lengkap (`frontend/style.css`), struktur HTML semantik (`frontend/index.html`), serta logika JavaScript klien (`frontend/app.js`) untuk menangani pembacaan stream SSE dan parser Markdown khusus.

#### 7. Pengujian, Evaluasi, & Debugging
* **Kontribusi Human**: Menjalankan pengujian langsung di lingkungan lokal (Windows PowerShell & VS Code Notebook), melakukan dialog multi-turn, serta menemukan kendala nyata di lapangan (seperti error encoding terminal Windows, model deprecated, dan input notebook yang tidak muncul di output).
* **Kontribusi AI**: Menganalisis pesan error, mendiagnosis penyebab masalah (keterbatasan fungsi `input()` di Jupyter, perbedaan penanganan karakter non-ASCII di Windows `cp1252`, dan perubahan ketersediaan versi model Gemini API), serta menyediakan perbaikan kode secara terarah.

#### 8. Penyusunan Dokumentasi
* **Kontribusi Human**: Menentukan struktur pelaporan, menyediakan transkrip chat nyata dan tangkapan layar pengujian, serta memastikan isi dokumentasi jujur dan sesuai dengan hasil eksperimen.
* **Kontribusi AI**: Menyusun draf teks dokumentasi teknis, menata struktur Markdown, membuat diagram alur ASCII, dan merapikan tabel perbandingan.

#### 9. Deployment Cloud & Konfigurasi Hosting (Render)
* **Kontribusi Human**: Menyediakan akun platform hosting Render, menghubungkan repositori GitHub, mengonfigurasi variabel lingkungan rahasia (`GEMINI_API_KEY`), memicu proses *continuous deployment*, dan memvalidasi akses publik dari berbagai perangkat.
* **Kontribusi AI**: Mengadaptasi arsitektur jaringan aplikasi agar kompatibel dengan lingkungan cloud container (*network binding* `0.0.0.0` dan pemetaan port dinamis `$PORT`), mendiagnosis serta menyelesaikan kendala *port scan timeout*, dan menyusun dokumentasi arsitektur cloud.

---

### B. Matriks Pembagian Tugas & Rationale Persentase

Tabel berikut merangkum proporsi keterlibatan beserta alasan objektif di balik pembagian tersebut:

| Aspek Proyek | Porsi Human | Porsi AI | Alasan Penentuan Persentase |
| :--- | :---: | :---: | :--- |
| **Ideasi & Konseptualisasi** | 45% | 55% | Ide dasar dan batasan topik datang dari pengguna, namun elaborasi nama akronim, perumusan dimensi Playstyle DNA secara terstruktur, dan pematangan konsep banyak dieksplorasi bersama AI. |
| **Penyediaan & Kurasi Data** | 60% | 40% | Pengguna menentukan dan menyediakan dataset game yang digunakan serta menetapkan variabel pentingnya, sedangkan AI membantu penulisan skrip pembersihan dan transformasi data. |
| **Algoritma Rekomendasi** | 35% | 65% | Pengguna mengidentifikasi kelemahan semantik genre makro dan menetapkan logika bisnis rekomendasi dua tahap, sedangkan formulasi komputasi DNA, vektorisasi Pandas, dan implementasi LLM Neural Re-Ranking dikerjakan oleh AI. |

| **Prompt Engineering & Persona** | 40% | 60% | Karakteristik nada bicara dan batasan ketat (*zero-emoji*) ditentukan oleh pengguna, sementara perancangan teks prompt terstruktur dan skema JSON ekstraksi disusun oleh AI. |
| **Backend & Integrasi API** | 25% | 75% | Pengguna mengarahkan arsitektur dan kebutuhan endpoint, namun penulisan sintaks kode Flask, integrasi SDK Gemini, SSE streaming, dan penanganan exception sepenuhnya diimplementasikan oleh AI. |
| **Desain Antarmuka Web (UI/UX)** | 30% | 70% | Arahan estetika (*warm parchment*, gaya editorial manga *Veil*) dan layout berasal dari pengguna, sedangkan seluruh penulisan kode CSS modern, HTML, dan JavaScript interaktif dikerjakan oleh AI. |
| **Deployment Cloud (Render)** | 40% | 60% | Pengguna menyiapkan akun hosting, menghubungkan repositori, dan mengelola API key rahasia, sementara AI merekayasa kode network binding, mendiagnosis kegagalan port binding container, dan menyusun spesifikasi cloud. |
| **Pengujian & Troubleshooting** | 45% | 55% | Pengujian dilakukan langsung oleh pengguna pada lingkungan lokal dan pengguna yang mendeteksi anomali/bug, sementara diagnosis teknis dan penulisan solusi perbaikan dilakukan oleh AI. |
| **Penyusunan Dokumentasi** | 40% | 60% | Pengguna mengarahkan substansi, data pengujian, dan transparansi laporan, sedangkan penyusunan redaksi kalimat, tata letak tabel, dan formatting dokumen dibantu oleh AI. |