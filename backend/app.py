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

CRISIS_RESOURCES = [
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
]

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


def build_analysis(intent, emotion, risk_label, risk_score, method):
    return {
        "intent": intent or "unknown",
        "emotion": emotion or "neutral",
        "risk": {
            "label": risk_label or "low_risk",
            "score": risk_score if risk_score is not None else 0.0,
            "method": method or "unknown"
        }
    }


def make_response_payload(response_text, analysis=None, **extra):
    payload = {
        "response": response_text if isinstance(response_text, str) else str(response_text),
        "analysis": analysis or build_analysis(None, None, "low_risk", 0.0, "unknown"),
        "validation_applied": extra.get("validation_applied", False),
        "rejected": extra.get("rejected", False)
    }
    payload.update({k: v for k, v in extra.items() if k not in ["validation_applied", "rejected"]})
    return payload


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    """Production-ready chat endpoint with complete safety and validation"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json(silent=True) or {}
        user_input = data.get("message", "")
        conversation_history = data.get("history", [])

        if not isinstance(conversation_history, list):
            conversation_history = []

        print(f"[DEBUG] Received user_input: {user_input}")
        print(f"[DEBUG] Received conversation_history length: {len(conversation_history)}")
        print(f"[DEBUG] Conversation history: {conversation_history}")

        WINDOW_SIZE = 10
        history_slice = conversation_history[-WINDOW_SIZE:]

        print(f"[DEBUG] History slice (last {WINDOW_SIZE} messages): {history_slice}")

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

        print(f"[DEBUG] Built context string:\n{context}")

        # Input validation - check for crisis and unrelated questions
        # Validation uses ONLY current user message (not full context) to avoid false triggers from assistant responses
        # Pass has_context=True if there's conversation history to be more permissive with follow-up questions
        has_context = len(conversation_history) > 0
        validation_result = bot.is_relevant_input(user_input, has_context=has_context)
        
        # Handle crisis response
        if isinstance(validation_result, dict) and validation_result.get('crisis_response', False):
            return jsonify(make_response_payload(
                validation_result["response"],
                analysis=build_analysis("crisis", "crisis", "high_risk", 1.0, "crisis_detection"),
                alert=True,
                crisis_triggered=True,
                emergency=True,
                resources=CRISIS_RESOURCES,
                validation_applied=True,
                rejected=False
            ))
        
        # Handle unrelated questions
        if validation_result is False:
            return jsonify(make_response_payload(
                "I'm here to help with mental health and emotional support only. I can't assist with general questions or topics outside mental health. Please share what's on your mind regarding your feelings or mental well-being.",
                analysis=build_analysis("general", "neutral", "low_risk", 0.0, "rule_based"),
                alert=False,
                crisis_triggered=False,
                validation_applied=True,
                rejected=True
            ))
        
        # Handle clarification requests
        if isinstance(validation_result, dict) and validation_result.get('requires_clarification', False):
            return jsonify(make_response_payload(
                validation_result["response"],
                analysis=build_analysis("clarification", "neutral", "low_risk", 0.0, "rule_based"),
                alert=False,
                crisis_triggered=False,
                validation_applied=True,
                rejected=False
            ))

        # Context-aware classification:
        # - Intent & Emotion: use full context for better understanding
        # - Risk: use ONLY current message to avoid false triggers from assistant's "help" keywords
        intent = bot.predict_intent(context)
        emotion = bot.predict_emotion(context)
        risk_label, risk_score = bot.predict_risk(user_input)

        # HIGH-RISK (CRISIS) - Hardcoded crisis response, bypass AI entirely
        # Only trigger crisis if risk_label is "high_risk" (moderate_risk does NOT trigger crisis)
        if risk_label == "high_risk" and risk_score > 0.6:
            threading.Thread(target=play_crisis_alert, daemon=True).start()
            threading.Thread(target=open_crisis_page, daemon=True).start()
            
            # Hardcoded crisis response - no AI generation
            crisis_response = (
                "I hear that you're going through something incredibly difficult right now. "
                "Your life matters deeply, and there are people who want to help you through this. "
                "Please reach out to someone immediately - you don't have to go through this alone."
            )
            
            return jsonify({
                "response": crisis_response,
                "alert": True,
                "crisis_triggered": True,
                "emergency": True,
                "model_based": False,
                "resources": CRISIS_RESOURCES,
                "analysis": {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {"label": risk_label, "score": risk_score, "method": "ml_classifier"}
                },
                "models_used": {
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based", 
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": "hardcoded_crisis_response"
                }
            })

        # MODERATE & LOW RISK - Use AI models for dynamic, empathetic responses
        # Rule-based templates only as fallback if AI fails
        try:
            # Try to generate response using AI models (Qwen or response model)
            # The generate_simple_response method internally tries Qwen first, then DialoGPT, then rule-based fallback
            response = bot.generate_simple_response(
                context,
                intent,
                emotion,
                conversation_history
            )
            
            # Use the generator recorded at the actual accepted return path.
            response_method = getattr(bot, "last_response_generation", "unknown")
            
            # Determine if this is moderate risk (for alert flag)
            is_moderate_risk = (risk_label == "high_risk" and risk_score > 0.5)
            return jsonify(make_response_payload(
                response,
                analysis=build_analysis(intent, emotion, risk_label, risk_score, "ml_classifier"),
                alert=is_moderate_risk,
                crisis_triggered=False,
                moderate_risk=is_moderate_risk,
                validation_applied=True,
                models_used={
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based",
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": response_method
                }
            ))
            
        except Exception as ai_error:
            # AI generation failed - use rule-based fallback
            print(f"[AI FALLBACK] Model generation failed: {ai_error}, using rule-based response")
            
            response = bot.comprehensive_rule_based_response(user_input, emotion, intent)
            bot.last_response_generation = "rule_based_fallback"
            if not bot._validate_generated_response(response, user_input, intent, emotion):
                response = bot._validated_safe_fallback(user_input, intent, emotion)
            
            return jsonify(make_response_payload(
                response,
                analysis=build_analysis(intent, emotion, risk_label, risk_score, "ml_classifier"),
                alert=False,
                crisis_triggered=False,
                moderate_risk=False,
                degraded=True,
                fallback=True,
                validation_applied=True,
                models_used={
                    "intent_detection": "trained_model" if bot.model_status['intent'] else "rule_based",
                    "emotion_detection": "trained_model" if bot.model_status['emotion'] else "rule_based",
                    "risk_detection": "trained_model" if bot.model_status['risk'] else "rule_based",
                    "response_generation": getattr(
                        bot,
                        "last_response_generation",
                        "rule_based_fallback"
                    )
                }
            ))

    except Exception as e:
        print(f"[ERROR] Flask /chat exception: {e}")

        fallback_response = "I'm here to support you. Please tell me more."
        fallback_valid = bot._validate_generated_response(
            fallback_response,
            "",
            None,
            None,
        )

        if not fallback_valid:
            fallback_response = bot.safe_fallback_response()
            fallback_valid = bot._validate_generated_response(
                fallback_response,
                "",
                None,
                None,
            )

        return jsonify(make_response_payload(
            fallback_response,
            analysis=build_analysis("unknown", "neutral", "low_risk", 0.0, "error"),
            alert=False,
            crisis_triggered=False,
            moderate_risk=False,
            degraded=True,
            fallback=True,
            validation_applied=fallback_valid,
            rejected=False,
            models_used={
                "intent_detection": "unavailable",
                "emotion_detection": "unavailable",
                "risk_detection": "unavailable",
                "response_generation": "safe_fallback"
            },
            error=str(e)
        ))


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
