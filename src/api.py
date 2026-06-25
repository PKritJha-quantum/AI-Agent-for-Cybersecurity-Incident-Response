from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# =====================================================================
# Server startup
# =====================================================================

@app.route("/", methods=["GET"])
def home():
    """Basic health check route to confirm the server is running."""
    return jsonify({
        "status": "success",
        "message": "AI Agent for Cybersecurity Incident Response - Server is running",
        "timestamp": datetime.utcnow().isoformat()
    }), 200


@app.route("/api/status", methods=["GET"])
def status():
    """Returns the current operational status of the server."""
    return jsonify({
        "status": "online",
        "service": "incident-response-agent",
        "version": "1.0.0"
    }), 200


@app.route("/api/incident", methods=["POST"])
def receive_incident():
    """Accepts a JSON incident payload and echoes it back."""
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


# =====================================================================
# API
# =====================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Slide Requirement 1: Dedicated app health checkpoint."""
    return jsonify({
        "status": "healthy",
        "database": "connected"
    }), 200


@app.route('/api/users', methods=['GET'])
def get_users():
    """Slide Requirement 2: Fetch logged-in team profiles with real names."""
    return jsonify({
        "users": [
            {"id": 1, "username": "Priyakriti Jha", "role": "incident responder"},
            {"id": 2, "username": "Neha Rane", "role": "incident responder"},
            {"id": 3, "username": "Minakshi Jha", "role": "incident responder"},
            {"id": 4, "username": "Shobhakumari Singh", "role": "incident responder"},
            {"id": 5, "username": "Anushka Waghaye", "role": "incident responder"},
            {"id": 6, "username": "Advika Meshram", "role": "incident responder"}
        ]
    }), 200


@app.route('/api/history', methods=['GET'])
def get_history():
    """Slide Requirement 3: Retrieve previous incident chat histories."""
    return jsonify({
        "history": [
            {"session_id": "sys_001", "last_prompt": "Analyze firewall log"}
        ]
    }), 200


@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Slide Requirement 4: Process input prompts from the frontend."""
    data = request.get_json() or {}
    user_prompt = data.get("prompt", "")
    
    if not user_prompt:
        return jsonify({"error": "Prompt data field is required"}), 400
      
    return jsonify({
        "prompt_received": user_prompt,
        "response": f"AI Response generated for query: '{user_prompt}'",
        "status": "success"
    }), 200


@app.route('/api/feedback', methods=['POST'])
def handle_feedback():
    """Slide Requirement 5: Store ratings from analysts."""
    data = request.get_json() or {}
    rating = data.get("rating")
    
    if rating is None:
        return jsonify({"error": "Rating score is required"}), 400
        
    return jsonify({
        "message": "Feedback successfully logged",
        "rating_received": rating
    }), 201


# =====================================================================
# Error Safegaurd
# =====================================================================

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


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
