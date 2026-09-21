"""
chatbot.py — Modul inti ELYSIA: persona, conversation history, streaming, dan ekstraksi preferensi.
"""

import json
import os
from datetime import datetime
from typing import Generator

import google.generativeai as genai
from backend.config import (
    CANDIDATE_MODELS,
    CHAT_GENERATION_CONFIG,
    EXTRACTION_GENERATION_CONFIG,
)

# ── System Prompt Persona ELYSIA ─────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah ELYSIA (Emotionally-adjusted Ludic Yield Spatial Integrated Assistant), asisten rekomendasi video game yang cerdas, ramah, dan sangat memahami dunia gaming.

Persona & Gaya Bicara:
1. Gunakan Bahasa Indonesia yang santai, hangat, dan antusias — seperti teman sesama gamer yang seru diajak ngobrol.
2. Kamu sangat paham nuansa gaming: genre, gameplay loop, art style, level kompleksitas, ekosistem Steam, dan harga game di Indonesia (IDR).
3. Saat pengguna pertama kali menyapa, sambut mereka dengan ramah dan tanyakan:
   - Apa mood bermain mereka saat ini (santai, kompetitif, imersif, atau fokus)?
   - Genre atau tipe game apa yang lagi mereka inginkan?
   - Berapa batasan anggaran dana mereka dalam Rupiah (IDR)?
4. JANGAN langsung memberikan daftar rekomendasi tanpa tahu preferensi pengguna — ajak ngobrol dan gali dulu informasinya secara natural.
5. Saat pengguna sudah memberikan cukup informasi (mood + genre/tipe game + anggaran dana), beritahu mereka bahwa kamu akan mencarikan rekomendasi sekarang dan minta mereka klik tombol kurasi rekomendasi.
6. Respons kamu harus ringkas, elegan, dan fokus. Hindari paragraf yang terlalu panjang.
7. JANGAN gunakan emoji apapun dalam teks tanggapanmu. Jaga nada bicara tetap anggun, hangat, dan profesional.
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

Contoh input: "Capek banget abis ujian, pengen yang santai dan adem. Batasan dana 100rb aja."
Contoh output: {"mood":"relaxed","pref_genres":["casual","adventure","indie"],"max_budget":100000,"dna_estimate":{"hardcore":0.15,"complex":0.2,"adrenaline":0.1}}
"""

# ── Re-Ranking Prompt (Two-Stage Retrieval - Pendekatan B) ───────────────────
RERANK_PROMPT = """Tugasmu adalah bertindak sebagai ELYSIA Neural Re-Ranker.
Kamu diberikan konteks percakapan pengguna dan daftar kandidat game dari basis data.
Pilih maksimal {top_n} game yang PALING TEPAT memenuhi detail spesifik dan batasan pengguna.

ATURAN RE-RANKING:
1. Perhatikan detail semantik spesifik:
   - Preferensi positif (misal: gameplay tembak-tembakan/senjata api, eksplorasi santai, taktis, dsb.)
   - Batasan/pantangan negatif eksplisit (misal: "gamau pedang-pedangan", "bukan game melee", "jangan horor/zombie", dsb.)
2. ELIMINASI game yang melanggar pantangan atau tidak sesuai fokus gameplay yang diminta pengguna.
3. Urutkan dari yang paling relevan.
4. Format output WAJIB HANYA berupa JSON murni:
{{
  "selected_ids": [<id_int_1>, <id_int_2>, ...],
  "curator_notes": {{
    "<id>": "Alasan singkat mengapa game ini sesuai dengan konteks spesifik pengguna"
  }}
}}
"""



class ELYSIAChat:
    """
    Satu instance per sesi pengguna.
    Mendukung Multi-Model Fallback (Opsi 1) dan Ekstraksi Heuristik (Opsi 3)
    secara otomatis jika model LLM menemui batas kuota (HTTP 429).
    """

    def __init__(self):
        self._model_idx = 0
        self._log: list[dict] = []
        self._init_models(CANDIDATE_MODELS[self._model_idx])
        self._rebuild_session()

    def _init_models(self, model_name: str):
        self.active_model_name = model_name
        self._chat_model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config=CHAT_GENERATION_CONFIG,
        )
        self._extractor_model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=EXTRACTION_PROMPT,
            generation_config=EXTRACTION_GENERATION_CONFIG,
        )

    def _rebuild_session(self):
        """Membangun ulang sesi chat Gemini dengan mempertahankan log obrolan sebelumnya."""
        history = []
        for item in self._log:
            role = item.get("role")
            content = item.get("content", "")
            if role in ("user", "model") and content:
                history.append({"role": role, "parts": [content]})
        self._session = self._chat_model.start_chat(history=history)

    # ── Send Message ─────────────────────────────────────────────────────────

    def send_message(self, text: str) -> str:
        """Versi non-streaming dengan multi-model fallback."""
        chunks = list(self.send_message_stream(text))
        return "".join(chunks)

    def send_message_stream(self, text: str) -> Generator[str, None, None]:
        """
        Mengalirkan respons teks secara streaming.
        Bila model aktif menemui kuota 429 atau kendala, otomatis berpindah
        ke model dengan kecanggihan terdekat berikutnya (Multi-Model Fallback).
        Jika semua model habis, mengalirkan respons persona natural dan tombol kurasi.
        """
        self._log.append({"role": "user", "content": text})
        full_answer = ""
        last_error = None

        # Coba mulai dari model saat ini hingga seluruh model kandidat
        start_idx = self._model_idx
        num_models = len(CANDIDATE_MODELS)

        for attempt in range(num_models):
            idx = (start_idx + attempt) % num_models
            candidate = CANDIDATE_MODELS[idx]

            try:
                if self.active_model_name != candidate:
                    print(f"[*] ELYSIA failover: Mengalihkan chat ke model '{candidate}'...")
                    self._init_models(candidate)
                    self._rebuild_session()
                    self._model_idx = idx

                stream = self._session.send_message(text, stream=True)
                for chunk in stream:
                    if chunk.text:
                        full_answer += chunk.text
                        yield chunk.text

                # Berhasil menyelesaikan streaming
                self._log.append({"role": "model", "content": full_answer})
                return

            except Exception as exc:
                last_error = exc
                err_str = str(exc)
                is_quota_error = "429" in err_str or "quota" in err_str.lower() or "resourceexhausted" in err_str.lower()
                print(f"[!] Kendala pada model '{candidate}': {err_str[:120]}")

                # Jika sudah sempat mengirimkan sebagian teks ke user, hentikan agar teks tidak tumpang tindih
                if full_answer:
                    self._log.append({"role": "model", "content": full_answer})
                    return

                # Lanjut mencoba model berikutnya
                continue

        # Jika seluruh model di CANDIDATE_MODELS gagal atau kuota habis:
        fallback_narrative = (
            "Mohon maaf, saat ini daya analisis percakapan dinamis saya sedang mengambil jeda sejenak "
            "untuk menyeimbangkan kuota lalu lintas layanan. Namun jangan khawatir, catatan pembicaraan "
            "dan preferensi gaming Anda tetap tersimpan rapi.\n\n"
            "Anda dapat langsung menekan tombol di bawah ini agar saya menyajikan kurasi rekomendasi "
            "video game terbaik berdasarkan kata kunci preferensi yang telah Anda sampaikan:\n\n"
            "[ACTION_RECOMMEND_BUTTON]"
        )
        self._log.append({"role": "model", "content": fallback_narrative})
        yield fallback_narrative

    # ── Preference Extraction ─────────────────────────────────────────────────

    def extract_preferences(self, conversation_text: str) -> dict:
        """
        Mengekstrak preferensi gaming pengguna.
        Mencoba extractor model LLM dengan multi-model cascade.
        Bila seluruh model LLM terkendala/kuota habis, beralih ke ekstraksi heuristik (Opsi 3).
        """
        start_idx = self._model_idx
        num_models = len(CANDIDATE_MODELS)

        for attempt in range(num_models):
            idx = (start_idx + attempt) % num_models
            candidate = CANDIDATE_MODELS[idx]

            try:
                if self.active_model_name != candidate:
                    self._init_models(candidate)
                    self._model_idx = idx

                res = self._extractor_model.generate_content(
                    f"Ekstrak preferensi gaming dari percakapan ini:\n\n{conversation_text}"
                )
                text = res.text.strip()
                # Bersihkan pembungkus markdown ```json bila ada
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                data = json.loads(text)
                data["is_heuristic_fallback"] = False
                return data
            except Exception as exc:
                print(f"[!] Gagal ekstraksi pada model '{candidate}': {str(exc)[:100]}")
                continue

        # Fallback Heuristik Cerdas (Opsi 3)
        print("[*] Menjalankan ekstraksi heuristik berbasis kata kunci (Fallback Mode)...")
        return self._heuristic_extract_preferences(conversation_text)

    def rerank_recommendations(
        self, candidates: list[dict], user_text: str, top_n: int = 6
    ) -> list[dict]:
        """
        Two-Stage Retrieval (Pendekatan B):
        Menggunakan LLM Gemini untuk memvalidasi dan mengurutkan ulang (re-rank) kandidat game
        berdasarkan pemahaman semantik mendalam terhadap konteks detail percakapan pengguna
        (misal: preferensi senjata api vs pedang, pantangan zombie, dsb).
        """
        if not candidates or len(candidates) <= top_n or not user_text.strip():
            return candidates[:top_n]

        cand_summary = []
        for c in candidates:
            cand_summary.append(
                f"- ID {c['id']}: '{c['title']}' | Genre: {c['genres']} | Skor Awal: {c.get('match_score', 0)}%"
            )
        cand_text = "\n".join(cand_summary)

        prompt = (
            f"KONTEKS PERCAKAPAN PENGGUNA:\n\"\"\"{user_text}\"\"\"\n\n"
            f"DAFTAR KANDIDAT GAME DARI DATABASE:\n{cand_text}\n\n"
            f"Pilih maksimal {top_n} game yang paling tepat. Keluarkan JSON murni."
        )

        for candidate in CANDIDATE_MODELS[self._model_idx :]:
            try:
                model = genai.GenerativeModel(
                    model_name=candidate,
                    system_instruction=RERANK_PROMPT.format(top_n=top_n),
                    generation_config=EXTRACTION_GENERATION_CONFIG,
                )
                resp = model.generate_content(prompt)
                raw_text = resp.text.strip()

                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                    raw_text = raw_text.strip()

                parsed = json.loads(raw_text)
                selected_ids = parsed.get("selected_ids", [])
                curator_notes = parsed.get("curator_notes", {})

                if selected_ids and isinstance(selected_ids, list):
                    cand_map = {c["id"]: c for c in candidates}
                    reranked = []
                    for gid in selected_ids:
                        gid_int = int(gid) if str(gid).isdigit() else None
                        if gid_int in cand_map and cand_map[gid_int] not in reranked:
                            item = cand_map[gid_int]
                            note = curator_notes.get(str(gid)) or curator_notes.get(gid_int)
                            if note:
                                item["curator_note"] = note
                            reranked.append(item)

                    # Jika hasil rerank belum mencapai top_n, lengkapi dari sisa kandidat awal
                    for c in candidates:
                        if len(reranked) >= top_n:
                            break
                        if c not in reranked:
                            reranked.append(c)

                    print(f"[*] Two-Stage Re-Ranking berhasil memfilter {len(reranked)} game terbaik.")
                    return reranked[:top_n]
            except Exception as exc:
                print(f"[!] Gagal Re-Ranking pada model '{candidate}': {str(exc)[:100]}")
                continue

        print("[*] Re-Ranking fallback: Mengembalikan urutan peringkat awal.")
        return candidates[:top_n]

    def _heuristic_extract_preferences(self, text: str) -> dict:
        """
        Ekstraksi berbasis aturan/heuristik kata kunci ketika seluruh LLM tidak dapat diakses.
        Mendeteksi mood, genre, batasan dana, dan mengestimasi Playstyle DNA secara akurat.
        """
        t = text.lower()

        # 1. Mood Detection
        mood = None
        if any(w in t for w in ["santai", "relax", "chill", "adem", "tenang", "healing", "santuy", "capek", "istirahat", "rebahan"]):
            mood = "relaxed"
        elif any(w in t for w in ["kompetitif", "tryhard", "ranked", "pvp", "serius", "esport", "asah skill", "menang"]):
            mood = "competitive"
        elif any(w in t for w in ["imersif", "cerita", "story", "dunia", "lore", "larut", "petualangan", "narasi", "plot"]):
            mood = "immersive"
        elif any(w in t for w in ["fokus", "taktis", "strategi", "mikir", "teka-teki", "puzzle", "cermat", "manajemen"]):
            mood = "focused"

        # 2. Genre Detection (Mendukung istilah Indonesia & Gaming umum)
        genres = []
        genre_rules = [
            ("rpg", ["rpg", "role-playing", "role playing", "jrpg"]),
            ("action", ["action", "aksi", "tarung", "fighting", "hack and slash"]),
            ("adventure", ["adventure", "petualangan", "eksplorasi"]),
            ("strategy", ["strategy", "strategi", "taktis", "rts", "turn-based"]),
            ("shooter", ["shooter", "tembak", "fps", "tps", "bedil"]),
            ("casual", ["casual", "kasual", "cozy", "santai"]),
            ("puzzle", ["puzzle", "teka-teki", "tebak"]),
            ("simulation", ["simulation", "simulasi", "simulator", "manajemen", "tycoon"]),
            ("indie", ["indie"]),
            ("racing", ["racing", "balap", "balapan", "mobil"]),
            ("sports", ["sports", "olahraga", "sepak bola", "bola"]),
            ("horror", ["horror", "horor", "seram", "takut"]),
            ("survival", ["survival", "bertahan hidup"]),
            ("open world", ["open world", "dunia terbuka"]),
        ]
        for canonical, keywords in genre_rules:
            if any(k in t for k in keywords):
                genres.append(canonical)

        # 3. Budget Detection (IDR)
        max_budget = None
        import re

        if any(w in t for w in ["gratis", "free", "cuma-cuma", "tanpa biaya", "0 rupiah"]):
            max_budget = 0
        else:
            # Pola: 100rb, 100k, 100 ribu, 150.000, 200000, rp 50.000
            m = re.search(r'(?:budget|dana|anggaran|seharga|dibawah|maksimal|max)?\s*(?:rp\.?|idr)?\s*(\d+[\.,]?\d*)\s*(k|rb|ribu|juta)?', t)
            if m:
                num_str = m.group(1).replace('.', '').replace(',', '')
                unit = (m.group(2) or "").lower()
                try:
                    val = int(num_str)
                    if unit in ("k", "rb", "ribu"):
                        val *= 1000
                    elif unit == "juta":
                        val *= 1000000
                    if 0 <= val <= 20000000:
                        max_budget = val
                except ValueError:
                    pass

        # 4. Playstyle DNA Estimation
        hardcore = 0.5
        complex_val = 0.5
        adrenaline = 0.5

        if mood == "relaxed":
            hardcore -= 0.25
            complex_val -= 0.20
            adrenaline -= 0.30
        elif mood == "competitive":
            hardcore += 0.30
            complex_val += 0.15
            adrenaline += 0.30
        elif mood == "immersive":
            hardcore += 0.10
            complex_val += 0.25
            adrenaline -= 0.10
        elif mood == "focused":
            hardcore += 0.15
            complex_val += 0.25
            adrenaline -= 0.10

        if "casual" in genres:
            hardcore -= 0.15
            complex_val -= 0.15
        if "strategy" in genres or "simulation" in genres:
            complex_val += 0.20
        if "action" in genres or "shooter" in genres:
            adrenaline += 0.20
        if "puzzle" in genres:
            complex_val += 0.15
            adrenaline -= 0.15

        return {
            "mood": mood,
            "pref_genres": genres,
            "max_budget": max_budget,
            "dna_estimate": {
                "hardcore": round(float(min(max(hardcore, 0.1), 0.9)), 2),
                "complex": round(float(min(max(complex_val, 0.1), 0.9)), 2),
                "adrenaline": round(float(min(max(adrenaline, 0.1), 0.9)), 2),
            },
            "is_heuristic_fallback": True,
        }

    def get_user_messages_text(self) -> str:
        """Menggabungkan semua pesan pengguna sebagai teks untuk ekstraksi."""
        return " ".join(
            m["content"] for m in self._log if m["role"] == "user"
        )

    # ── History ──────────────────────────────────────────────────────────────

    def reset(self):
        """Mereset sesi percakapan ke kondisi awal."""
        self._model_idx = 0
        self._init_models(CANDIDATE_MODELS[0])
        self._log.clear()
        self._rebuild_session()

    def save_history(self, directory: str = ".") -> str:
        """Menyimpan riwayat percakapan ke file JSON. Mengembalikan path file."""
        filename = f"riwayat_elysia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(directory, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self._log, f, ensure_ascii=False, indent=2)
        return filepath

    def get_log(self) -> list[dict]:
        return list(self._log)

    def pop_last_turn(self) -> str | None:
        """
        Menghapus respons terakhir model (dan mengambil teks pertanyaan pengguna)
        agar dapat dilakukan regenerasi / rewrite respons tanpa merusak konteks.
        Mengembalikan teks input pengguna terakhir.
        """
        if not self._log:
            return None

        # Jika entri terakhir adalah respons model, hapus
        if self._log and self._log[-1].get("role") == "model":
            self._log.pop()

        # Ambil pertanyaan pengguna terakhir
        last_user_prompt = None
        if self._log and self._log[-1].get("role") == "user":
            last_user_prompt = self._log.pop().get("content")

        # Bangun ulang session Gemini tanpa entri yang di-pop
        self._rebuild_session()
        return last_user_prompt