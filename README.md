# Conversational Video Game Recommendation Assistant

**ELYSIA — Emotionally-Adjusted Ludic Yield Spatial Integrated Assistant**

Chatbot berbasis **Large Language Model (LLM)** yang digunakan untuk memberikan rekomendasi video game melalui percakapan dengan pengguna.

Pengguna dapat menyampaikan preferensi game melalui bahasa natural, seperti genre, budget, mood, dan gaya bermain. Informasi tersebut kemudian digunakan untuk menghasilkan rekomendasi game yang sesuai.

## Fitur

* 💬 **Conversational Chatbot** — Interaksi dengan pengguna menggunakan bahasa natural
* 🤖 **Gemini API** — Integrasi dengan Google Gemini sebagai LLM
* 🧠 **Conversation History** — Mempertahankan konteks percakapan dalam satu sesi
* 🎮 **Game Recommendation** — Memberikan rekomendasi berdasarkan preferensi pengguna
* 🎯 **Playstyle Preference** — Mempertimbangkan gaya bermain pengguna
* 💰 **Budget Preference** — Mempertimbangkan budget yang diberikan pengguna
* ⚡ **Streaming Response** — Menampilkan respons secara bertahap
* 💾 **Chat History** — Menyimpan riwayat percakapan

## Struktur Repository

```text
conversational-video-game-recommendation-assistant/
├── backend/                              # Backend Python & logika chatbot
│   ├── chatbot.py                        # Integrasi Gemini API & conversation history
│   ├── recommendation_algorithm.py       # Logika rekomendasi video game
│   ├── config.py                         # Konfigurasi aplikasi & environment variable
│
│
├── frontend/                             # User Interface berbasis Streamlit
│   └── app.py                            # Logika Interaksi Frontend
│   └── index.html                        # Halaman utama chatbot
│
├── notebook/                             # Jupyter Notebooks untuk eksperimen awal
│   └── chatbot_notebook.ipynb            # Eksperimen chatbot & Gemini API
│
├── data/                                 # Dataset video game
│   └── games.csv                         # Dataset yang digunakan sistem
│
├── screenshots/                          # Screenshot bukti hasil implementasi
│
├── .env.example                          # Template variabel lingkungan
├── requirements.txt                      # Dependensi library Python
├── .gitignore                            # Filter cache, virtual environment & secret
└── README.md                             # Dokumentasi utama repository
```

## Teknologi

* **Python**
* **Google Gemini API**
* **Jupyter Notebook**
* **Pandas**
* **python-dotenv**

## Alur Sistem

```text
User
  ↓
Input Preferensi
  ↓
ELYSIA
  ↓
Gemini API
  ↓
Ekstraksi Informasi
  ↓
Recommendation Engine
  ↓
Game Recommendation
```

## Eksperimen Notebook

Pengembangan dimulai dari notebook untuk melakukan eksperimen terhadap chatbot sebelum diimplementasikan ke dalam aplikasi.

Eksperimen meliputi:

```text
Gemini API
     ↓
System Prompt
     ↓
Conversation History
     ↓
Chatbot Response
     ↓
Preference Extraction
     ↓
Game Recommendation
```

Notebook:

```text
notebook/chatbook_notebook.ipynb
```

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/Bejochan/conversational-video-game-recommendation-assistant.git
cd conversational-video-game-recommendation-assistant
```

### 2. Membuat Virtual Environment

```bash
python -m venv .venv
```

Aktifkan virtual environment.

**Windows:**

```powershell
.venv\Scripts\activate
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## Konfigurasi Gemini API

Buat file `.env` berdasarkan `.env.example`.

```env
GEMINI_API_KEY=your_api_key_here
```

## Screenshot

~ Menyusul

## Notes

Pengembangan proyek dilakukan secara bertahap:

```text
Notebook
   ↓
Eksperimen Gemini API
   ↓
Backend
   ↓
Recommendation Engine
   ↓
Frontend
```

Notebook digunakan sebagai tahap eksperimen awal sebelum implementasi chatbot ke dalam aplikasi web.