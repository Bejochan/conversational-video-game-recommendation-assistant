"""
app.py — Flask REST API server untuk ELYSIA
Menyediakan endpoint untuk percakapan (SSE streaming), rekomendasi game, dan manajemen sesi.
"""

import json
import uuid
import sys
import os
from datetime import datetime

from flask import Flask, Response, jsonify, request, stream_with_context, send_from_directory
from flask_cors import CORS

# Pastikan backend bisa diimpor dari root proyek
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _PROJECT_ROOT)

from backend.config import HOST, PORT, DEBUG
from backend.chatbot import ELYSIAChat
from backend.recommendation_algorithm import engine

_FRONTEND_DIR = os.path.join(_PROJECT_ROOT, "frontend")

app = Flask(__name__, static_folder=_FRONTEND_DIR, static_url_path="")
CORS(app)  # Mengizinkan request dari frontend lokal / file:/// / Live Server

@app.route("/")
def index():
    """Menyajikan halaman utama frontend langsung dari server Flask."""
    return send_from_directory(_FRONTEND_DIR, "index.html")

# ── In-memory Session Store ──────────────────────────────────────────────────
# session_id (str) → ELYSIAChat instance
_sessions: dict[str, ELYSIAChat] = {}

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _get_session(session_id: str) -> ELYSIAChat:
    """Mengambil atau membuat sesi baru berdasarkan session_id."""
    if session_id not in _sessions:
        _sessions[session_id] = ELYSIAChat()
    return _sessions[session_id]


# ── Health Check ─────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "gemini-3.5-flash"})


# ── Chat (SSE Streaming) ──────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    """
    Menerima pesan pengguna dan mengembalikan respons ELYSIA
    sebagai Server-Sent Events (SSE) stream teks.

    Body JSON: { "session_id": str, "message": str }
    """
    data = request.get_json(force=True)
    session_id = data.get("session_id") or str(uuid.uuid4())
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "Pesan tidak boleh kosong."}), 400

    chat = _get_session(session_id)

    def generate():
        # Kirim session_id dulu sebagai event pertama agar frontend menyimpannya
        yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id, 'chunk': ''})}\n\n"
        for chunk in chat.send_message_stream(message):
            yield f"data: {json.dumps({'type': 'text', 'content': chunk, 'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'done': True})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Recommend ────────────────────────────────────────────────────────────────

@app.route("/api/recommend", methods=["POST"])
def recommend():
    """
    Mengekstrak preferensi dari riwayat percakapan pengguna,
    lalu mengembalikan daftar rekomendasi game terbaik.

    Body JSON: { "session_id": str }
    """
    data = request.get_json(force=True)
    session_id = data.get("session_id")
    top_n = int(data.get("top_n", 6))

    if not session_id:
        session_id = str(uuid.uuid4())

    chat = _get_session(session_id)
    user_text = chat.get_user_messages_text()

    try:
        if not user_text.strip():
            # Jika user menekan tombol rekomendasi sebelum memulai obrolan
            pref = {
                "mood": None,
                "pref_genres": [],
                "max_budget": None,
                "dna_estimate": {"hardcore": 0.5, "complex": 0.5, "adrenaline": 0.5},
                "is_heuristic_fallback": True,
            }
            result = engine.get_recommendations(pref, top_n=top_n)
            result["is_fallback"] = True
            result["fallback_notice"] = {
                "title": "Kurasi Pilihan Populer",
                "message": (
                    "Belum ada preferensi obrolan yang tercatat, sehingga ELYSIA menyajikan koleksi "
                    "video game terpopuler dan terfavorit dengan Playstyle DNA seimbang sebagai inspirasi awal Anda."
                ),
            }
            return jsonify(result)

        pref = chat.extract_preferences(user_text)
        result = engine.get_recommendations(pref, top_n=top_n)

        if pref.get("is_heuristic_fallback"):
            result["is_fallback"] = True
            result["fallback_notice"] = {
                "title": "Kurasi Mode Terfokus",
                "message": (
                    "Karena kapasitas analisis percakapan interaktif sedang mengambil jeda singkat, "
                    "ELYSIA menyintesis rekomendasi ini langsung dari intisari kata kunci preferensi Anda. "
                    "Silakan jelajahi kurasi judul di bawah ini atau tekan tombol Rekomendasi Ulang kapan saja."
                ),
            }
        else:
            result["is_fallback"] = False

        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Reset Session ─────────────────────────────────────────────────────────────

@app.route("/api/session/reset", methods=["POST"])
def reset_session():
    """
    Mereset riwayat percakapan pada sesi yang diberikan.

    Body JSON: { "session_id": str }
    """
    data = request.get_json(force=True)
    session_id = data.get("session_id")

    if session_id and session_id in _sessions:
        _sessions[session_id].reset()

    return jsonify({"status": "reset", "session_id": session_id})


# ── Save Session History ──────────────────────────────────────────────────────

@app.route("/api/session/save", methods=["POST"])
def save_session():
    """
    Menyimpan riwayat percakapan ke file JSON di root proyek.

    Body JSON: { "session_id": str }
    """
    data = request.get_json(force=True)
    session_id = data.get("session_id")

    if not session_id or session_id not in _sessions:
        return jsonify({"error": "Sesi tidak ditemukan."}), 404

    try:
        filepath = _sessions[session_id].save_history(directory=_PROJECT_ROOT)
        filename = os.path.basename(filepath)
        return jsonify({"status": "saved", "filename": filename})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── List & Load Session History ───────────────────────────────────────────────

@app.route("/api/session/history", methods=["GET"])
def list_session_history():
    """
    Mengembalikan daftar riwayat sesi yang tersimpan di root proyek.
    """
    try:
        import glob
        pattern = os.path.join(_PROJECT_ROOT, "riwayat_elysia_*.json")
        files = glob.glob(pattern)
        files.sort(key=os.path.getmtime, reverse=True)

        history_list = []
        for fp in files:
            fname = os.path.basename(fp)
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    logs = json.load(f)
                
                # Cari pesan user pertama untuk judul/preview
                first_user_msg = next(
                    (m["content"] for m in logs if m.get("role") == "user"),
                    "Percakapan tanpa judul"
                )
                preview = (first_user_msg[:60] + "...") if len(first_user_msg) > 60 else first_user_msg
                mtime = os.path.getmtime(fp)
                dt_str = datetime.fromtimestamp(mtime).strftime("%d %b %Y, %H:%M")

                history_list.append({
                    "filename": fname,
                    "preview": preview,
                    "date": dt_str,
                    "message_count": len(logs),
                })
            except Exception:
                continue

        return jsonify({"history": history_list})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/session/load", methods=["POST"])
def load_session_history():
    """
    Memuat riwayat sesi dari file JSON dan mengembalikannya ke frontend.
    Body JSON: { "filename": str }
    """
    data = request.get_json(force=True)
    filename = data.get("filename", "")

    # Security check: pastikan hanya nama file riwayat_elysia_*.json
    if not filename or not filename.startswith("riwayat_elysia_") or not filename.endswith(".json"):
        return jsonify({"error": "Nama file riwayat tidak valid."}), 400

    filepath = os.path.join(_PROJECT_ROOT, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Berkas riwayat tidak ditemukan."}), 404

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            logs = json.load(f)

        new_session_id = str(uuid.uuid4())
        chat = ELYSIAChat()
        # Restore log
        chat._log = logs
        _sessions[new_session_id] = chat

        return jsonify({
            "session_id": new_session_id,
            "filename": filename,
            "messages": logs,
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Available Genres ──────────────────────────────────────────────────────────

@app.route("/api/genres", methods=["GET"])
def get_genres():
    """Mengembalikan daftar genre unik dari dataset (opsional, untuk filter UI)."""
    return jsonify(engine.get_available_genres())


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("[*] ELYSIA Backend Server starting...")
    print(f"    Running at: http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True)
