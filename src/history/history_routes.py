"""
history_routes.py
Flask Blueprint so the frontend (Member 1) can fetch/clear chat history.

Register this in your main Flask app, e.g.:

    from history_routes import history_bp
    app.register_blueprint(history_bp)
"""

from flask import Blueprint, jsonify
from chat_history import get_history, clear_history

history_bp = Blueprint("history", __name__)


@history_bp.route("/api/history", methods=["GET"])
def api_get_history():
    """Return the full conversation log as JSON."""
    try:
        history = get_history()
        return jsonify({"history": history})
    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({"error": "Failed to fetch chat history"}), 500


@history_bp.route("/api/history", methods=["DELETE"])
def api_clear_history():
    """Clear the chat history (handy for demo resets)."""
    try:
        clear_history()
        return jsonify({"message": "Chat history cleared"})
    except Exception as e:
        print(f"Error clearing history: {e}")
        return jsonify({"error": "Failed to clear chat history"}), 500
