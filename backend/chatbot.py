"""
chatbot.py — Modul inti ELYSIA: persona, conversation history, streaming, dan ekstraksi preferensi.
"""

import json
import os
from datetime import datetime
from typing import Generator

import google.generativeai as genai
from backend.config import (
    MODEL_NAME,
    CHAT_GENERATION_CONFIG,
    EXTRACTION_GENERATION_CONFIG,
)

# ── System Prompt Persona ELYSIA ─────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah ELYSIA (Emotionally-Adjusted Ludic Yield Spatial Integrated Assistant), asisten rekomendasi video game yang cerdas, ramah, dan sangat memahami dunia gaming.

Persona & Gaya Bicara:
1. Gunakan Bahasa Indonesia yang santai, hangat, dan antusias — seperti teman sesama gamer yang seru diajak ngobrol.
2. Kamu sangat paham nuansa gaming: genre, gameplay loop, art style, level kompleksitas, ekosistem Steam, dan harga game di Indonesia (IDR).
3. Saat pengguna pertama kali menyapa, sambut mereka dengan ramah dan tanyakan:
   - Apa mood bermain mereka saat ini (santai, kompetitif, imersif, atau fokus)?
   - Genre atau tipe game apa yang lagi mereka inginkan?
   - Berapa rentang budget mereka dalam Rupiah (IDR)?
4. JANGAN langsung memberikan daftar rekomendasi tanpa tahu preferensi pengguna — ajak ngobrol dan gali dulu informasinya secara natural.
5. Saat pengguna sudah memberikan cukup informasi (mood + genre/tipe game + budget), beritahu mereka bahwa kamu akan mencarikan rekomendasi sekarang dan minta mereka klik tombol 'Recommend' atau ketik 'recommend'.
6. Respons kamu harus ringkas dan fokus. Hindari paragraf yang terlalu panjang.
7. Sesekali gunakan emoji gaming yang relevan untuk membuat percakapan terasa lebih hidup 🎮✨.
"""

# ── Extraction Prompt ────────────────────────────────────────────────────────
EXTRACTION_PROMPT = """Tugasmu adalah menganalisis pesan-pesan pengguna dan mengekstrak preferensi gaming mereka ke dalam format JSON murni (tanpa markdown, tanpa kode blok, tanpa backticks).

Skema JSON keluaran:
{
  "mood": "relaxed" | "competitive" | "immersive" | "focused" | null,
  "pref_genres": ["genre1", "genre2"],
  "max_budget": <integer IDR atau null>,
  "dna_estimate": {
    "hardcore": <float 0.0–1.0>,
    "complex": <float 0.0–1.0>,
    "adrenaline": <float 0.0–1.0>
  }
}

Panduan pengisian:
- mood: deteksi dari kata-kata emosional/suasana (santai→relaxed, kompetitif/tryhard→competitive, eksplorasi mendalam/cerita→immersive, taktis/fokus→focused).
- pref_genres: list genre dalam Bahasa Inggris lowercase (action, rpg, strategy, casual, puzzle, adventure, shooter, simulation, indie, dll).
- max_budget: konversi nominal ke integer IDR (contoh: "100rb" → 100000, "50 ribu" → 50000). null jika tidak disebutkan.
- dna_estimate.hardcore: 0.0 untuk sangat casual/santai, 1.0 untuk sangat hardcore/tryhard.
- dna_estimate.complex: 0.0 untuk mekanik simpel, 1.0 untuk sistem game yang mendalam/kompleks.
- dna_estimate.adrenaline: 0.0 untuk sangat damai/calming, 1.0 untuk penuh aksi/adrenalin tinggi.

Contoh input: "Capek banget abis ujian, pengen yang santai dan adem. Budget 100rb aja."
Contoh output: {"mood":"relaxed","pref_genres":["casual","adventure","indie"],"max_budget":100000,"dna_estimate":{"hardcore":0.15,"complex":0.2,"adrenaline":0.1}}
"""


class ELYSIAChat:
    """
    Satu instance per sesi pengguna.
    Mengelola riwayat percakapan dengan Gemini dan menyediakan
    metode untuk streaming response dan ekstraksi preferensi.
    """

    def __init__(self):
        # Model untuk percakapan utama
        self._chat_model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=SYSTEM_PROMPT,
            generation_config=CHAT_GENERATION_CONFIG,
        )
        # Model terpisah untuk ekstraksi JSON (temperature rendah, output JSON)
        self._extractor_model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=EXTRACTION_PROMPT,
            generation_config=EXTRACTION_GENERATION_CONFIG,
        )
        self._session = self._chat_model.start_chat(history=[])
        self._log: list[dict] = []   # log percakapan lengkap (untuk save/load)

    # ── Send Message ─────────────────────────────────────────────────────────

    def send_message(self, text: str) -> str:
        """
        Mengirim pesan dan mengembalikan respons lengkap (non-streaming).
        Digunakan sebagai fallback atau untuk pengujian.
        """
        try:
            resp = self._session.send_message(text)
            answer = resp.text
            self._log.append({"role": "user", "content": text})
            self._log.append({"role": "model", "content": answer})
            return answer
        except Exception as exc:
            raise RuntimeError(f"Gagal menghubungi Gemini API: {exc}") from exc

    def send_message_stream(self, text: str) -> Generator[str, None, None]:
        """
        Generator yang mengalirkan teks respons chunk-per-chunk.
        Digunakan oleh Flask endpoint SSE /api/chat/stream.
        """
        self._log.append({"role": "user", "content": text})
        full_answer = ""
        try:
            stream = self._session.send_message(text, stream=True)
            for chunk in stream:
                if chunk.text:
                    full_answer += chunk.text
                    yield chunk.text
            self._log.append({"role": "model", "content": full_answer})
        except Exception as exc:
            yield f"\n⚠️ Terjadi kendala saat menghubungi API: {exc}"

    # ── Preference Extraction ─────────────────────────────────────────────────

    def extract_preferences(self, conversation_text: str) -> dict:
        """
        Mengirim ringkasan percakapan ke extractor model dan
        mengembalikan dict preferensi terstruktur.
        """
        try:
            res = self._extractor_model.generate_content(
                f"Ekstrak preferensi gaming dari percakapan ini:\n\n{conversation_text}"
            )
            return json.loads(res.text)
        except (json.JSONDecodeError, Exception):
            # Fallback netral jika ekstraksi gagal
            return {
                "mood": None,
                "pref_genres": [],
                "max_budget": None,
                "dna_estimate": {"hardcore": 0.5, "complex": 0.5, "adrenaline": 0.5},
            }

    def get_user_messages_text(self) -> str:
        """Menggabungkan semua pesan pengguna sebagai teks untuk ekstraksi."""
        return " ".join(
            m["content"] for m in self._log if m["role"] == "user"
        )

    # ── History ──────────────────────────────────────────────────────────────

    def reset(self):
        """Mereset sesi percakapan ke kondisi awal."""
        self._session = self._chat_model.start_chat(history=[])
        self._log.clear()

    def save_history(self, directory: str = ".") -> str:
        """Menyimpan riwayat percakapan ke file JSON. Mengembalikan path file."""
        filename = f"riwayat_elysia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(directory, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self._log, f, ensure_ascii=False, indent=2)
        return filepath

    def get_log(self) -> list[dict]:
        return list(self._log)
