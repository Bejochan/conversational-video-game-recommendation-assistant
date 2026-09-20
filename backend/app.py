"""
app.py — Flask REST API server untuk ELYSIA
Menyediakan endpoint untuk percakapan (SSE streaming), rekomendasi game, dan manajemen sesi.
"""

import json
import uuid
import sys
import os

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

    if not session_id or session_id not in _sessions:
        return jsonify({"error": "Sesi tidak ditemukan."}), 404

    chat = _sessions[session_id]
    user_text = chat.get_user_messages_text()

    if not user_text.strip():
        return jsonify({"error": "Belum ada percakapan yang bisa dianalisis."}), 400

    try:
        pref = chat.extract_preferences(user_text)
        result = engine.get_recommendations(pref, top_n=top_n)
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
