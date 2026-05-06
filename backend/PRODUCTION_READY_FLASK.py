#!/usr/bin/env python3
"""
PRODUCTION READY FLASK SERVER - Final Implementation
All phases complete with proper safety and validation
Using Browser Web Speech API for STT (no backend speech recognition needed)
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from fixed_model_loader import FixedMentalHealthBot
import os
import logging
import winsound
import threading
import time

app = Flask(__name__)

# Configure logging to reduce console output but show server startup
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.WARNING)  # Show warnings and server startup

# Enable CORS for frontend
CORS(app, 
     origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

def play_crisis_alert():
    """Play continuous sound alert for crisis detection"""
    try:
        # Play continuous alert sound (Windows)
        for i in range(10):  # Play 10 times
            winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
            time.sleep(0.3)
        print("CRISIS CONTINUOUS SOUND ALERT PLAYED")
    except Exception as e:
        print(f"Sound alert failed: {e}")

def open_crisis_page():
    """Open crisis interface page in new tab"""
    try:
        import webbrowser
        webbrowser.open('http://localhost:5001/crisis-interface', new=2)  # new=2 opens in new tab
        print("CRISIS HTML PAGE OPENED IN NEW TAB")
    except Exception as e:
        print(f"Failed to open crisis page: {e}")

print("PRODUCTION READY MENTAL HEALTH BOT...")
bot = FixedMentalHealthBot()   # loads models properly

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    """Production-ready chat endpoint with complete safety and validation"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        user_input = data.get("message", "")
        conversation_history = data.get("history", [])

        WINDOW_SIZE = 6  # last 3 user + 3 assistant messages
        history_slice = conversation_history[-WINDOW_SIZE:]

        context = ""

        for msg in history_slice:
            role = (msg.get("role", "user") or "user").lower()
            content = msg.get("content", msg.get("text", "")).strip()

            if not content:
                continue

            if role == "user":
                context += f"User: {content}\n"
            else:
                context += f"Assistant: {content}\n"

        context += f"User: {user_input}\nAssistant:"

        # Input validation - check for crisis and unrelated questions
        validation_result = bot.is_relevant_input(user_input)
        
        # Handle crisis response
        if isinstance(validation_result, dict) and validation_result.get('crisis_response', False):
            return jsonify({
                "response": validation_result["response"],
                "alert": True,
                "crisis_triggered": True,
                "emergency": True,
                "validation_applied": True,
                "rejected": False,
                "analysis": {
                    "intent": "crisis",
                    "emotion": "crisis",
                    "risk": {"label": "high_risk", "score": 1.0, "method": "crisis_detection"}
                }
            })
        
        # Handle unrelated questions
        if validation_result is False:
            return jsonify({
                "response": "I'm here to help with mental health and emotional support only. I can't assist with general questions or topics outside mental health. Please share what's on your mind regarding your feelings or mental well-being.",
                "alert": False,
                "crisis_triggered": False,
                "validation_applied": True,
                "rejected": True,
                "analysis": {
                    "intent": "general",
                    "emotion": "neutral",
                    "risk": {"label": "low_risk", "score": 0.0, "method": "rule_based"}
                }
            })
        
        # Handle clarification requests
        if isinstance(validation_result, dict) and validation_result.get('requires_clarification', False):
            return jsonify({
                "response": validation_result["response"],
                "alert": False,
                "crisis_triggered": False,
                "validation_applied": True,
                "rejected": False,
                "analysis": {
                    "intent": "clarification",
                    "emotion": "neutral",
                    "risk": {"label": "low_risk", "score": 0.0, "method": "rule_based"}
                }
            })

        intent = bot.predict_intent(user_input)
        emotion = bot.predict_emotion(user_input)
        risk_label, risk_score = bot.predict_risk(user_input)

        if risk_label == "high_risk" and risk_score > 0.6:
            threading.Thread(target=play_crisis_alert, daemon=True).start()
            
            threading.Thread(target=open_crisis_page, daemon=True).start()
            
            response = bot.generate_simple_response(
                context,
                intent,
                emotion,
                conversation_history
            )
            
            return jsonify({
                "response": response,
                "alert": True,
                "crisis_triggered": True,
                "emergency": True,
                "model_based": True,
                "resources": [
                    {
                        "name": "Kiran Mental Health Helpline",
                        "phone": "1800-599-0019",
                        "available": "24/7",
                        "type": "mental_health"
                    },
                    {
                        "name": "AASRA (Suicide Prevention)",
                        "phone": "9820466726",
                        "available": "24/7",
                        "type": "crisis"
                    },
                    {
                        "name": "Emergency Services",
                        "phone": "911",
                        "available": "24/7",
                        "type": "emergency"
                    },
                    {
                        "name": "National Suicide Prevention Lifeline",
                        "phone": "988",
                        "available": "24/7",
                        "type": "crisis"
                    }
                ],
                "analysis": {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {"label": risk_label, "score": risk_score, "method": "ml_classifier"}
                },
                "models_used": {
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based", 
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": "trained_model"
                }
            })

        # MODERATE RISK CHECK - ENHANCED MONITORING
        elif risk_label == "high_risk" and risk_score > 0.5:
            # Use rule-based response (no LLM) for safety
            response = bot.generate_simple_response(
                context,
                intent,
                emotion,
                conversation_history
            )
            
            return jsonify({
                "response": response,
                "alert": True,
                "crisis_triggered": False,  # Not full crisis, but alert needed
                "moderate_risk": True,
                "validation_applied": True,
                "analysis": {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {"label": risk_label, "score": risk_score, "method": "ml_classifier"}
                },
                "models_used": {
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based", 
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": "rule_based"
                }
            })
        
        # LOW RISK - RULE-BASED RESPONSE (NO LLM)
        else:
            response = bot.generate_simple_response(
                context,
                intent,
                emotion,
                conversation_history
            )
            
            return jsonify({
                "response": response,
                "alert": False,
                "crisis_triggered": False,
                "validation_applied": True,
                "analysis": {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {"label": risk_label, "score": risk_score, "method": "ml_classifier"}
                },
                "models_used": {
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based", 
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": "rule_based"
                }
            })

    except Exception as e:
        return jsonify({
            "response": "I'm here to support you. Please tell me more.",
            "error": str(e),
            "alert": False,
            "crisis_triggered": False
        })


@app.route("/crisis-interface", methods=["GET"])
def crisis_interface():
    """Serve crisis interface page"""
    return render_template('crisis_interface.html')

@app.route("/health", methods=["GET"])
def health():
    """Health check with production status"""
    return jsonify({
        "status": "production_ready",
        "models_loaded": bot.get_model_status(),
        "server": "production_ready_flask.py",
        "speech_to_text": "Web Speech API (browser-based)",
        "phases_completed": [
            "model_loading", "ai_pipeline", "conversation_context", 
            "response_generation", "crisis_system", "text_to_speech", "response_validation"
        ],
        "safety_features": [
            "immediate_crisis_response",
            "moderate_risk_monitoring", 
            "strict_validation",
            "llm_safety_constraints",
            "crisis_resource_provision"
        ]
    })

if __name__ == "__main__":
    print("\n" + "="*50)
    print("STARTING FLASK SERVER...")
    print("="*50)
    print(f"Server will be available at:")
    print(f"  - http://localhost:5001")
    print(f"  - http://127.0.0.1:5001")
    print(f"  - http://0.0.0.0:5001")
    print("="*50 + "\n")
    
    app.run(host="0.0.0.0", port=5001, debug=False)
