from flask import flask, request, jsonify
app = Flask (__name__)

@app.route('/api/health', methods=['GET']
           def health_check():
             return jsonify({
               "status":"healthy"
               "database":"connected"
             }), 200

@app.route('/api/users', methods=['GET'])
def get_users():
  return jsonify({
    "users":[
      {"id":1, "username":"Priyakriti Jha", "role":"incident responder"}
      {"id":2, "username":"Neha Rane", "role":"incident responder"}
      {"id":3, "username":"Minakshi Jha", "role":"incident responder"}
      {"id":4, "username":"Shobhakumari Singh", "role":"incident responder"}
      {"id":5, "username":"Anushka Waghaye", "role":"incident responder"}
      {"id":6, "username":"Advika Meshram", "role":"incident responder"}]
  }), 200
@app.route('/api/history', methods=['GET'])
def get_history():
  return jsonify({
    "history":[
      {"session_id":"sys_001", "last_prompt":"Analyze firewall log"}]
  }), 200

@app.route('/api/chat', methods=['POST'])
def handle_chat():
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
    data = request.get_json() or {}
    rating = data.get("rating")
    
    if rating is None:
        return jsonify({"error": "Rating score is required"}), 400
        
    return jsonify({
        "message": "Feedback successfully logged",
        "rating_received": rating
    }), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)
