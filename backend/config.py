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
    load_dotenv(dotenv_path=_ENV_PATH, override=True)
else:
    load_dotenv(override=True)

# ── API Key & Inisialisasi Gemini ────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError(
        "❌ GEMINI_API_KEY tidak ditemukan. "
        "Pastikan file .env sudah berisi GEMINI_API_KEY=your_key_here"
    )

genai.configure(api_key=GEMINI_API_KEY)

# ── Model & Multi-Model Fallback ─────────────────────────────────────────────
# Urutan prioritas model dengan kecanggihan terdekat dari gemini-3.5-flash:
CANDIDATE_MODELS = [
    "gemini-3.6-flash",      # Model dengan kecanggihan & arsitektur terdekat ke 3.5-flash
    "gemini-3.7-flash",      # Cadangan tingkat 1 (generasi 3.7)
    "gemini-3.8-flash",      # Cadangan tingkat 2 (generasi 3.8)
    "gemini-3.5-flash-lite", # Cadangan tingkat 3 (versi ringan & hemat kuota)
    "gemini-3.5-flash",      # Model awal (digunakan kembali jika kuota harian pulih)
    "gemini-flash-latest",   # Cadangan alias stabil
]

MODEL_NAME = CANDIDATE_MODELS[0]

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
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() in ("true", "1")

