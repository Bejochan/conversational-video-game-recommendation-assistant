# ELYSIA — Emotionally-adjusted Ludic Yield Spatial Integrated Assistant
### Conversational Video Game Recommendation Assistant berbasis Large Language Model (LLM) & Psychographic Playstyle DNA

ELYSIA adalah asisten virtual interaktif berbasis kecerdasan buatan yang memadukan kapabilitas pemahaman bahasa alami dari **Google Gemini API** (arsitektur *multi-model cascade* dengan model primer `gemini-3.6-flash`) dengan sistem rekomendasi multi-aspek (**Playstyle DNA 3D, Dynamic Mood Modifier, dan Filter Anggaran Steam IDR**) yang diadaptasi dari basis data kurasi 24.082 video game.

---

## Daftar Isi
1. [Konsep & Pendekatan Asisten](#konsep--pendekatan-asisten)
2. [Spesifikasi Sistem & Fitur Pokok](#spesifikasi-sistem--fitur-pokok)
3. [Arsitektur & Alur Kerja Sistem](#arsitektur--alur-kerja-sistem)
4. [Struktur Repositori](#struktur-repositori)
5. [Panduan Menjalankan Program (Step-by-Step)](#panduan-menjalankan-program-step-by-step)
   - [A. Eksperimen di Notebook (Jupyter / VS Code)](#a-eksperimen-di-notebook-jupyter--vs-code)
   - [B. Menjalankan Chatbot Terminal (CLI)](#b-menjalankan-chatbot-terminal-cli)
   - [C. Menjalankan Web UI Interaktif (Fullstack Flask)](#c-menjalankan-web-ui-interaktif-fullstack-flask)
6. [Contoh Cuplikan Percakapan & Pengujian](#contoh-cuplikan-percakapan--pengujian)
7. [Penjelasan Modul Kode](#penjelasan-modul-kode)
8. [Catatan Pengembangan & Pembagian Jobdesk (Human vs AI)](#catatan-pengembangan--pembagian-jobdesk-human-vs-ai)
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
    [ Google Gemini API (gemini-3.5-flash) ]
            | (Analisis Konteks, Respon Dialog Alami &
            |  Ekstraksi Entitas JSON: Mood, DNA, Genre, Max Budget)
            v
  [ Hybrid Recommendation Engine ]
            | (Pencocokan Euclidean 3D DNA + Jaccard Genre + Bobot Rating & Diskon)
            v
      [ Dataset games.csv ] (24.082 Game dengan Data Harga Steam IDR)
            |
            v
  [ Respons Terkurasi & Kartu Game Interaktif ]
            | (Streaming Penjelasan Naratif + Daftar Rekomendasi Game + Badge Diskon IDR)
            v
       [ Pengguna ]
```

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
│   └── Hasil Percobaan Notebook.png      # Tangkapan layar bukti eksekusi notebook
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

### A. Eksperimen di Notebook (Jupyter / VS Code)

1. Buka berkas [notebooks/chatbot_notebook.ipynb](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/notebooks/chatbot_notebook.ipynb).
2. Pastikan kernel Python aktif mengarah ke lingkungan kerja virtual Anda.
3. Jalankan sel secara berurutan:
   - Inisialisasi pustaka dan pemuatan API Key dari berkas `.env`.
   - Inisialisasi model `gemini-3.5-flash` dengan konfigurasi System Prompt persona ELYSIA.
   - Uji coba respons streaming bertahap.
   - Pemuatan dataset dan pra-kalkulasi 3D Playstyle DNA.
   - Menjalankan fungsi interaktif `jalankan_elysia_interactive()` di mana input pengguna dan jawaban ELYSIA akan langsung tercetak berdampingan di output sel.

---

### B. Menjalankan Chatbot Terminal (CLI)

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

### C. Menjalankan Web UI Interaktif (Fullstack Flask)

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

> Dokumentasi transkrip lengkap dapat dilihat pada [screenshots/Chat Notebook.md](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/screenshots/Chat%20Notebook.md) dan tangkapan layar eksekusi pada [screenshots/Hasil Percobaan Notebook.png](file:///d:/Career/Semester%205/Model%20Bahasa%20Besar%20dan%20Agen%20Kecerdasan%20Buatan/ELYSIA/screenshots/Hasil%20Percobaan%20Notebook.png).

---

## Penjelasan Modul Kode

1. **`backend/config.py`**:
   - Mengelola pemuatan variabel lingkungan secara aman melalui `python-dotenv` dengan parameter `override=True`.
   - Mengatur parameter dasar LLM (`gemini-3.5-flash`), `temperature = 0.7`, serta validasi ketersediaan berkas dataset.

2. **`backend/recommendation_algorithm.py`**:
   - Memuat dataset 24.082 baris data game.
   - Melakukan pra-kalkulasi vektor Playstyle DNA 3D (`dna_hardcore`, `dna_complex`, `dna_adrenaline`).
   - Menyediakan fungsi `apply_mood_modifier()` untuk penyesuaian dinamis bobot DNA.
   - Menghitung skor kemiripan gabungan (jarak Euclidean DNA 3D, Jaccard Similarity genre, normalisasi rating Metacritic/RAWG, dan pemfilteran budget Steam IDR).

3. **`backend/chatbot.py`**:
   - Menginisialisasi `GenerativeModel` Google Gemini dengan System Prompt persona ELYSIA.
   - Mengatur riwayat percakapan (*conversation history*) multi-turn berbasis sesi.
   - Mengimplementasikan antarmuka interaktif CLI dengan penanganan pengecualian dan fungsi ekspor riwayat chat ke JSON.

4. **`backend/app.py`**:
   - Server backend berbasis Flask yang menyediakan endpoint RESTful:
     - `POST /api/chat`: Endpoint streaming percakapan menggunakan format Server-Sent Events (SSE).
     - `POST /api/recommend`: Endpoint kalkulasi rekomendasi game terstruktur.
     - `GET /api/session/history` & `POST /api/session/load`: Pengelolaan sesi obrolan.
   - Melayani penyajian berkas statis frontend secara langsung pada port 5000.

5. **`frontend/` (`index.html`, `style.css`, `app.js`)**:
   - Desain antarmuka bertema *editorial light aesthetic* bernuansa *warm parchment* dengan tipografi bersih.
   - Penanganan respons streaming teks menggunakan `ReadableStream` dan parser Markdown khusus.
   - Drawer geser (*slide-over drawer*) untuk manajemen riwayat sesi chat masa lalu tanpa merusak tampilan header utama.

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
* **Kontribusi Human**: Menentukan logika bisnis yang diinginkan (rekomendasi harus mempertimbangkan kedekatan DNA, kemiripan genre, rating kualitas, dan kesesuaian anggaran), serta mengevaluasi apakah hasil rekomendasi terasa masuk akal bagi gamer.
* **Kontribusi AI**: Merumuskan kalkulasi matematis (jarak Euclidean 3D pada ruang DNA dan Jaccard Similarity pada genre), menyusun formula skor gabungan terbobot (*weighted composite score*), serta mengoptimasi performa komputasi menggunakan vektorisasi NumPy/Pandas agar pencarian 24.082 game berlangsung instan (< 100 ms).

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

---

### B. Matriks Pembagian Tugas & Rationale Persentase

Tabel berikut merangkum proporsi keterlibatan beserta alasan objektif di balik pembagian tersebut:

| Aspek Proyek | Porsi Human | Porsi AI | Alasan Penentuan Persentase |
| :--- | :---: | :---: | :--- |
| **Ideasi & Konseptualisasi** | 45% | 55% | Ide dasar dan batasan topik datang dari pengguna, namun elaborasi nama akronim, perumusan dimensi Playstyle DNA secara terstruktur, dan pematangan konsep banyak dieksplorasi bersama AI. |
| **Penyediaan & Kurasi Data** | 60% | 40% | Pengguna menentukan dan menyediakan dataset game yang digunakan serta menetapkan variabel pentingnya, sedangkan AI membantu penulisan skrip pembersihan dan transformasi data. |
| **Algoritma Rekomendasi** | 35% | 65% | Pengguna menetapkan kriteria dan logika bisnis rekomendasi, sedangkan formulasi matematis (Euclidean 3D, Jaccard) dan implementasi komputasi vektorisasi efisien dikerjakan oleh AI. |
| **Prompt Engineering & Persona** | 40% | 60% | Karakteristik nada bicara dan batasan ketat (*zero-emoji*) ditentukan oleh pengguna, sementara perancangan teks prompt terstruktur dan skema JSON ekstraksi disusun oleh AI. |
| **Backend & Integrasi API** | 25% | 75% | Pengguna mengarahkan arsitektur dan kebutuhan endpoint, namun penulisan sintaks kode Flask, integrasi SDK Gemini, SSE streaming, dan penanganan exception sepenuhnya diimplementasikan oleh AI. |
| **Desain Antarmuka Web (UI/UX)** | 30% | 70% | Arahan estetika (*warm parchment*, gaya editorial manga *Veil*) dan layout berasal dari pengguna, sedangkan seluruh penulisan kode CSS modern, HTML, dan JavaScript interaktif dikerjakan oleh AI. |
| **Pengujian & Troubleshooting** | 45% | 55% | Pengujian dilakukan langsung oleh pengguna pada lingkungan lokal dan pengguna yang mendeteksi anomali/bug, sementara diagnosis teknis dan penulisan solusi perbaikan dilakukan oleh AI. |
| **Penyusunan Dokumentasi** | 40% | 60% | Pengguna mengarahkan substansi, data pengujian, dan transparansi laporan, sedangkan penyusunan redaksi kalimat, tata letak tabel, dan formatting dokumen dibantu oleh AI. |