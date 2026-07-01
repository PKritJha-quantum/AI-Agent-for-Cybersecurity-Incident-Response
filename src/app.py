# app.py
# Member 1 – Backend Developer (Server Setup)
# Core Flask server that powers the AI Agent for Cybersecurity Incident Response

from flask import Flask, jsonify, request
from datetime import datetime

# --- Member 3's chat history integration ---
from history.history_routes import history_bp

app = Flask(__name__)
app.register_blueprint(history_bp)  # adds GET/DELETE /api/history


# -----------------------------
# Health Check / Root Route
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    """Basic health check route to confirm the server is running."""
    return jsonify({
        "status": "success",
        "message": "AI Agent for Cybersecurity Incident Response - Server is running",
        "timestamp": datetime.utcnow().isoformat()
    }), 200


# -----------------------------
# Status Route
# -----------------------------
@app.route("/api/status", methods=["GET"])
def status():
    """Returns the current operational status of the server."""
    return jsonify({
        "status": "online",
        "service": "incident-response-agent",
        "version": "1.0.0"
    }), 200


# -----------------------------
# Sample Incident Echo Route
# -----------------------------
@app.route("/api/incident", methods=["POST"])
def receive_incident():
    """
    Accepts a JSON incident payload and echoes it back.
    This is a placeholder route — later it will connect to:
      - security_config.json (trusted IPs / thresholds)
      - incident_classifier.py (classification logic)
      - response_engine.py (automated response)
    Example request body:
    {
        "id": "INC-001",
        "description": "Ransomware detected on server",
        "source_ip": "192.168.1.50"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "status": "error",
            "message": "Invalid or missing JSON body"
        }), 400

    response = {
        "status": "received",
        "incident": data,
        "received_at": datetime.utcnow().isoformat()
    }
    return jsonify(response), 201


# -----------------------------
# NOTE FOR MEMBER 2:
# When you build the /api/chat route, add this import at the top:
#     from history.chat_history import save_exchange
# Then call save_exchange(message, ai_reply) right before your
# return statement, like this:
#
# @app.route("/api/chat", methods=["POST"])
# def chat():
#     data = request.get_json(silent=True)
#     message = data.get("message", "")
#     ai_reply = get_ai_response(message)      # your AI logic
#     save_exchange(message, ai_reply)         # <-- saves to history
#     return jsonify({"reply": ai_reply}), 200
# -----------------------------


# -----------------------------
# Error Handlers
# -----------------------------
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "status": "error",
        "message": "Route not found"
    }), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


# -----------------------------
# Run the Server Locally
# -----------------------------
if __name__ == "__main__":
    # debug=True enables auto-reload and detailed error pages during development
    app.run(host="0.0.0.0", port=5000, debug=True)
