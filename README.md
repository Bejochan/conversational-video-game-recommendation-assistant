# ELYSIA — Emotionally-Adjusted Ludic Yield Spatial Integrated Assistant
### Conversational Video Game Recommendation Assistant berbasis Large Language Model (LLM) & Psychographic Playstyle DNA

ELYSIA adalah asisten virtual interaktif berbasis kecerdasan buatan yang memadukan kapabilitas pemahaman bahasa alami dari **Google Gemini API** (`gemini-3.5-flash`) dengan sistem rekomendasi multi-aspek (**Playstyle DNA 3D, Dynamic Mood Modifier, dan Filter Anggaran Steam IDR**) yang diadaptasi dari basis data kurasi 24.082 video game.

---

## Daftar Isi
1. [Konsep & Pendekatan Asisten](#konsep--pendekatan-asisten)
2. [Fitur Utama](#fitur-utama)
3. [Arsitektur & Alur Kerja Sistem](#arsitektur--alur-kerja-sistem)
4. [Struktur Repositori](#struktur-repositori)
5. [Panduan Menjalankan Program (Step-by-Step)](#panduan-menjalankan-program-step-by-step)
   - [A. Eksperimen di Notebook (Jupyter / VS Code)](#a-eksperimen-di-notebook-jupyter--vs-code)
   - [B. Menjalankan Chatbot Terminal (CLI)](#b-menjalankan-chatbot-terminal-cli)
   - [C. Menjalankan Web UI Interaktif (Fullstack Flask)](#c-menjalankan-web-ui-interaktif-fullstack-flask)
6. [Contoh Cuplikan Percakapan & Pengujian](#contoh-cuplikan-percakapan--pengujian)
7. [Penjelasan Modul Kode](#penjelasan-modul-kode)
8. [Catatan Pengembangan & Pembagian Jobdesk (Human vs AI)](#catatan-pengembangan--pembagian-jobdesk-human-vs-ai)
   - [A. Prinsip Kolaborasi](#a-prinsip-kolaborasi)
   - [B. Rincian Peran & Tanggung Jawab Pengembang (Human)](#b-rincian-peran--tanggung-jawab-pengembang-human)
   - [C. Rincian Peran & Kontribusi AI Assistant (AI)](#c-rincian-peran--kontribusi-ai-assistant-ai)
   - [D. Matriks Pembagian Tugas & Kontribusi](#d-matriks-pembagian-tugas--kontribusi)

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

## Fitur Utama

| Kategori | Fitur & Deskripsi |
| :--- | :--- |
| **LLM Core** | Integrasi dengan **Google Gemini API** (`gemini-3.5-flash`) untuk memahami konteks percakapan multi-turn, ekstraksi preferensi, dan penalaran rekomendasi. |
| **Persona & Tone Control** | Karakter asisten editorial yang elegan, suportif, berwawasan luas, dan bebas emoji (*zero-emoji constraint*). |
| **Dynamic Conversation State** | Manajemen riwayat obrolan berbasis sesi yang konsisten untuk memelihara konteks dialog jangka panjang. |
| **Real-time Streaming Response** | Respons kata-demi-kata secara bertahap (*streaming*) menggunakan SSE (Server-Sent Events) pada Web UI dan generator streaming pada CLI/Notebook. |
| **Interactive CLI & Notebook Echo** | Loop interaktif di terminal dan notebook yang mencetak input pengguna (`Anda : ...`) dan respon asisten (`ELYSIA : ...`) secara sinkron untuk mempermudah audit dan dokumentasi. |
| **Save & Load Session History** | Fitur penyimpanan dan pemuatan riwayat sesi obrolan ke format JSON terstruktur lengkap dengan timestamp. |
| **Hybrid Recommendation Engine** | Kombinasi Content-Based Filtering, kalkulasi jarak Euclidean 3D pada ruang Playstyle DNA, Jaccard Similarity genre, bobot rating Metacritic/RAWG, dan filter harga Steam IDR. |
| **Editorial Light Web Interface** | Antarmuka web modern bernuansa *warm parchment* yang terinspirasi dari estetika manga *Veil* karya Kotteri dan minimalisme Google Gemini, dilengkapi *slide-over history drawer* dan kartu game interaktif. |

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

Proyek ini dikembangkan dengan paradigma kolaboratif **AI-Assisted Software Engineering** dan **Pair Programming**. Seluruh arsitektur konseptual, formulasi domain keilmuan, arah estetika, dan verifikasi hasil dipimpin oleh **Pengembang (Human)**, sementara **AI Coding Assistant** bertindak sebagai akselerator implementasi teknis, generator sintaks kode, dan mitra *troubleshooting*.

### A. Prinsip Kolaborasi
1. **Human-Led Architecture & Intent**: Visi produk, metodologi rekomendasi psikografis (Playstyle DNA), perancangan karakter/persona ELYSIA, serta evaluasi etika dan kualitas respons sepenuhnya dirumuskan dan dikontrol oleh pengembang.
2. **AI-Accelerated Engineering**: AI dimanfaatkan untuk mempercepat penulisan kode berulang (*boilerplate*), menerjemahkan formula matematika ke operasi vektorisasi Pandas/NumPy, serta memformat antarmuka frontend secara presisi.
3. **Iterative Problem Solving**: Kendala teknis yang muncul sepanjang siklus pengembangan (seperti perubahan ketersediaan model API, kompatibilitas encoding karakter pada sistem operasi Windows, dan integrasi streaming) diselesaikan melalui dialog kritis dan iterasi penyesuaian antara pengembang dan AI.

---

### B. Rincian Peran & Tanggung Jawab Pengembang (Human)

1. **Konseptualisasi & Domain Modeling**:
   - Menggagas ide inti asisten cerdas ELYSIA sebagai solusi terhadap keterbatasan sistem pencarian game berbasis filter kata kunci tradisional.
   - Merumuskan kerangka kerja **3D Psychographic Playstyle DNA** (*Casual vs Hardcore*, *Simple vs Complex*, *Calming vs Adrenaline*) serta aturan modulasi dinamis *Dynamic Mood Modifier*.
2. **Pengumpulan & Kurasi Dataset**:
   - Memilih dan menata dataset 24.082 game dari RAWG dan Steam.
   - Memetakan struktur data mata uang Rupiah (IDR) asli dan atribut diskon Steam agar relevan dengan kebutuhan gamer di Indonesia.
3. **Prompt Engineering & Persona Design**:
   - Merancang persona ELYSIA: asisten kurator yang ramah, sopan, berwawasan mendalam, suportif, dan tidak menggunakan emoji (*strict zero-emoji policy*) guna mempertahankan impresi elegan.
   - Menetapkan batasan instruksi (*guardrails*) agar chatbot tetap fokus pada topik video game dan rekomendasi yang konstruktif.
   - Merancang skema output JSON terstruktur untuk mengekstrak entitas preferensi pengguna dari dialog bebas.
4. **Artistic Direction & Pengalaman Pengguna (UI/UX)**:
   - Menetapkan arah visual antarmuka bertema *editorial light* yang terinspirasi dari gaya ilustrasi manga *Veil* karya Kotteri dan minimalisme Google Gemini (warna kertas perkamen hangat `#FAF7F2`, tipografi serif editorial dipadu sans-serif modern).
   - Menentukan struktur tata letak web: *slide-over drawer* untuk riwayat obrolan, kartu game berukuran seragam dengan label diskon jelas, dan ruang baca yang nyaman.
5. **Validasi Kualitas & Pengujian Sistem**:
   - Melakukan pengujian langsung dialog multi-turn untuk memverifikasi kemampuan retensi konteks model LLM.
   - Menguji keandalan hasil rekomendasi terhadap berbagai skenario kasus nyata (misal: gamer berkepribadian introvert dengan anggaran terbatas di bawah Rp 200.000).
   - Memeriksa keakuratan data harga dan relevansi skor kecocokan game.

---

### C. Rincian Peran & Kontribusi AI Assistant (AI)

1. **Implementasi Sintaks & Integrasi SDK**:
   - Menulis kode integrasi resmi Google Generative AI SDK (`google-generativeai`) dengan mekanisme *streaming* respons (`stream=True`).
   - Menyusun kerangka backend berbasis Flask (`app.py`) lengkap dengan endpoint Server-Sent Events (SSE) untuk transmisi data *real-time* ke antarmuka web.
2. **Penerjemahan Formula Matematika ke Komputasi Vektor**:
   - Mengimplementasikan rumus jarak Euclidean 3D dan koefisien Jaccard Similarity dalam operasi vektorisasi Pandas dan NumPy agar kalkulasi terhadap puluhan ribu game dapat diselesaikan dalam hitungan milidetik.
3. **Penyusunan Kode Antarmuka (CSS & JavaScript)**:
   - Menerjemahkan panduan estetika dari pengembang ke dalam kode Vanilla CSS modern (CSS custom properties, flexbox/grid responsive, micro-interactions, modal dialog).
   - Mengimplementasikan logika JavaScript (`app.js`) untuk penanganan `ReadableStream`, rendering kartu game interaktif, dan parser Markdown bertingkat.
4. **Investigasi & Penyelesaian Kendala Teknis (Debugging)**:
   - **Migrasi Model**: Menyesuaikan konfigurasi model dari `gemini-2.5-flash` ke `gemini-3.5-flash` setelah API Google menghentikan dukungan versi sebelumnya untuk pengguna baru.
   - **Encoding Terminal Windows**: Mengatasi kendala `UnicodeEncodeError: charmap` pada konsol Windows PowerShell dengan membersihkan karakter non-ASCII dan menstandarkan format log ke tag berbasis ASCII (`[OK]`, `[Sistem]`, `[Perhatian]`).
   - **Echo Input pada Notebook**: Memodifikasi fungsi `jalankan_elysia_interactive()` di Jupyter Notebook agar mencetak input pengguna (`Anda : ...`) secara eksplisit ke output sel, sehingga riwayat percakapan tampil berpasangan dan lengkap untuk tangkapan layar pengujian.
   - **Environment Caching**: Memperbaiki pemuatan variabel lingkungan pada `backend/config.py` menggunakan `load_dotenv(..., override=True)` untuk mencegah pembacaan nilai usang dari sesi sistem.
5. **Penyusunan Dokumentasi Teknis**:
   - Membantu merapikan tata letak dokumentasi teknis pada `README.md`, menyusun tabel perbandingan, dan menstandarkan format transkrip pengujian.

---

### D. Matriks Pembagian Tugas & Kontribusi

| Aspek / Tahapan Proyek | Tanggung Jawab Human (Pengembang) | Kontribusi AI Assistant | Dominasi Kontribusi |
| :--- | :--- | :--- | :---: |
| **Ideasi & Konseptualisasi Produk** | Merumuskan konsep ELYSIA, Playstyle DNA 3D, dan Dynamic Mood Modifier | Memberikan referensi penamaan akronim dan eksplorasi fitur pelengkap | **Human (90%)** |
| **Penyediaan & Kurasi Data** | Mengumpulkan, menata dataset 24.082 game, memetakan harga Steam IDR | Membantu penulisan skrip pembersihan data dan pengisian nilai kosong | **Human (75%)** |
| **Formulasi Algoritma Rekomendasi** | Merancang logika pembobotan gabungan (DNA + Jaccard + Rating + Budget) | Mengimplementasikan formula ke dalam operasi vektor NumPy/Pandas yang efisien | **Kolaboratif (50/50)** |
| **Prompt Engineering & Persona** | Merancang kepribadian asisten, batasan instruksi (*zero-emoji*), skema JSON preferensi | Membantu pengujian konsistensi respons prompt dan penataan format template | **Human (70%)** |
| **Backend & Integrasi API** | Mengarahkan kebutuhan arsitektur modular (CLI, Notebook, dan Web REST API) | Menulis kode integrasi Gemini API SDK, Flask SSE Streaming, dan Session Management | **AI (70%)** |
| **Desain Antarmuka (UI/UX)** | Menentukan visi estetika editorial light (*warm parchment*), tata letak drawer dan kartu | Menulis implementasi Vanilla CSS dan logika DOM JavaScript sesuai panduan | **Kolaboratif (50/50)** |
| **Pengujian, Evaluasi & Debugging** | Menjalankan skenario pengujian, mengevaluasi mutu rekomendasi, melaporkan kendala | Menganalisis log error, migrasi versi model, mengatasi bug encoding & I/O notebook | **Kolaboratif (50/50)** |
| **Dokumentasi & Pelaporan** | Menyusun materi laporan, mereview substansi ilmiah, memvalidasi kejujuran akademik | Merapikan format Markdown, menyusun tabel matriks, dan menstrukturkan daftar isi | **Kolaboratif (50/50)** |