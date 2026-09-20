"""
config.py — Konfigurasi terpusat untuk ELYSIA
Memuat variabel lingkungan dan konstanta yang digunakan di seluruh modul backend.
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# ── Muat .env dari root proyek ──────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BASE_DIR)
_ENV_PATH = os.path.join(_PROJECT_ROOT, ".env")

if os.path.exists(_ENV_PATH):
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()

# ── API Key & Inisialisasi Gemini ────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError(
        "❌ GEMINI_API_KEY tidak ditemukan. "
        "Pastikan file .env sudah berisi GEMINI_API_KEY=your_key_here"
    )

genai.configure(api_key=GEMINI_API_KEY)

# ── Model ────────────────────────────────────────────────────────────────────
MODEL_NAME = "gemini-2.5-flash"

# GenerationConfig untuk chat utama (kreatif & komunikatif)
CHAT_GENERATION_CONFIG = genai.GenerationConfig(
    temperature=0.7,
    top_p=0.9,
    max_output_tokens=2048,
)

# GenerationConfig untuk ekstraksi preferensi (deterministik & terstruktur)
EXTRACTION_GENERATION_CONFIG = genai.GenerationConfig(
    temperature=0.1,
    response_mime_type="application/json",
)

# ── Dataset ──────────────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(_PROJECT_ROOT, "data", "games.csv")

# ── Server ───────────────────────────────────────────────────────────────────
HOST = "127.0.0.1"
PORT = 5000
DEBUG = True
