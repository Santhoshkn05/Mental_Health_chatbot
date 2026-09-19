#!/usr/bin/env python3
import os
import re
import sys
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    AutoModelForSeq2SeqLM,
    AutoModelForCausalLM,
)

# Import extracted utilities and config
from ai.config.keywords import HELP_INDICATORS, MENTAL_HEALTH_KEYWORDS, CRISIS_KEYWORDS, INVALID_TOPICS, JOB_RELATED_KEYWORDS
from ai.config.responses import EMPATHY_RESPONSES, FOLLOW_UP_QUESTIONS, EMPATHY_INDICATORS
from ai.utils.text_utils import override_intent, normalize_emotion, clean_response
from ai.models.model_loader import MODEL_PATHS, get_device
from ai.validation.response_validator import (
    is_response_good as response_is_good,
    validate_response as validate_response_contract,
)

# Import crisis detection system
try:
    from crisis_detection_system import crisis_system, trigger_crisis_response, stop_crisis_alarm, get_crisis_resources
    CRISIS_SYSTEM_AVAILABLE = True
except ImportError:
    CRISIS_SYSTEM_AVAILABLE = False
    print("[WARNING] Crisis detection system not available - basic crisis response only")

class FixedMentalHealthBot:
    def __init__(self, model_name="esconv-dialo-final"):
        """
        Initialize Enhanced Mental Health Bot with all models loaded.

        Args:
            model_name (str): Name of the response model to use
        """
        print("[INIT] FIXED MODEL LOADER - Clean Version")

        # Set device
        self.device = get_device()
        print(f"[DEVICE] Using device: {self.device}")

        # Model paths
        self.model_paths = MODEL_PATHS
        self.current_model = model_name

        # Initialize all models
        self.intent_model = None
        self.emotion_model = None
        self.risk_model = None
        self.resp_model = None
        self.resp_tokenizer = None
        self.qwen_model = None
        self.qwen_tokenizer = None

        self.model_status = {
            "intent": False,
            "emotion": False,
            "risk": False,
            "response": False,
            "qwen": False,
        }

        self._load_intent_model()
        self._load_emotion_model()
        self._load_risk_model()
        self._load_response_model()
        self._load_qwen()

    def _load_intent_model(self):
        try:
            print("\n[LOAD] Loading Intent Model...")
            self.intent_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS["intent"])
            self.intent_model = AutoModelForSequenceClassification.from_pretrained(
                MODEL_PATHS["intent"]
            ).to(self.device)
            self.intent_model.eval()
            self.model_status["intent"] = True
            print("Intent model loaded successfully")

            if hasattr(self.intent_model.config, 'id2label'):
                print(f"[INTENT] Model labels from config: {self.intent_model.config.id2label}")
            else:
                print("[INTENT] WARNING: Model config has no id2label — using hardcoded fallback labels")

            test_output = self.predict_intent("hello")
            print(f"[INTENT] Test prediction: {test_output}")

        except Exception as e:
            print(f"Intent model failed: {e}")
            self.model_status["intent"] = False

    def _load_emotion_model(self):
        try:
            print("\nLoading Emotion Model...")
            self.emotion_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS["emotion"])
            self.emotion_model = AutoModelForSequenceClassification.from_pretrained(
                MODEL_PATHS["emotion"]
            ).to(self.device)
            self.emotion_model.eval()
            self.model_status["emotion"] = True
            print("Emotion model loaded successfully")

            test_output = self.predict_emotion("I feel happy")
            print(f"Test prediction: {test_output}")

        except Exception as e:
            print(f"Emotion model failed: {e}")
            self.model_status["emotion"] = False

    def _load_risk_model(self):
        try:
            print("\nLoading Risk Model...")
            self.risk_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS["risk"])
            self.risk_model = AutoModelForSequenceClassification.from_pretrained(
                MODEL_PATHS["risk"]
            ).to(self.device)
            self.risk_model.eval()
            self.model_status["risk"] = True
            print("Risk model loaded successfully")

            test_output = self.predict_risk("I feel sad")
            print(f"Test prediction: {test_output}")

        except Exception as e:
            print(f" Risk model failed: {e}")
            self.model_status["risk"] = False

    def _load_response_model(self):
        """
        Load response model with fallback logic.
        Tries: esconv-dialo-final -> counselchat -> empathetic -> dailydialog
        """
        response_models = ["esconv-dialo-final", "counselchat", "empathetic", "dailydialog"]
        loaded = False

        for model_name in response_models:
            if loaded:
                break

            try:
                model_path = MODEL_PATHS.get(model_name)
                if not model_path or not os.path.exists(model_path):
                    print(f"Skipping {model_name}: path not found")
                    continue

                print(f"\nLoading {model_name} from: {model_path}")

                try:
                    print(f"[DEBUG] Attempting tokenizer load...")
                    # Try GPT2 tokenizer first (most reliable)
                    self.resp_tokenizer = AutoTokenizer.from_pretrained("gpt2")
                    print(f"GPT2 tokenizer loaded successfully")

                    # Set padding token
                    if self.resp_tokenizer.pad_token is None:
                        self.resp_tokenizer.pad_token = self.resp_tokenizer.eos_token

                except Exception as tokenizer_error:
                    print(f"All tokenizer attempts failed: {tokenizer_error}")
                    self.resp_tokenizer = None
                    continue

                try:
                    if self.resp_tokenizer is not None:
                        print(f"Loading model: {model_path}")

                        # Try to load the actual model
                        self.resp_model = AutoModelForCausalLM.from_pretrained(
                            model_path
                        ).to(self.device)
                        print(f"[OK] Response model loaded successfully: {model_name}")

                    else:
                        print(f"[ERROR] Cannot load model - tokenizer is None")
                        self.resp_model = None
                        continue

                except Exception as model_error:
                    print(f"[WARN] Model load failed: {model_error}")
                    # Fallback to GPT2 model if tokenizer is available
                    if self.resp_tokenizer is not None:
                        try:
                            print(f"[DEBUG] Attempting GPT2 model fallback...")
                            self.resp_model = AutoModelForCausalLM.from_pretrained("gpt2").to(self.device)
                            print(f"[OK] Fallback GPT2 model loaded")
                            model_name = "gpt2 (fallback)"
                        except Exception as fallback_error:
                            print(f"[ERROR] GPT2 model fallback failed: {fallback_error}")
                            self.resp_model = None
                            continue
                    else:
                        self.resp_model = None
                        continue

                self.response_model_name = model_name
                self.model_status["response"] = True
                print(f"[OK] Response model loaded successfully: {model_name}")
                loaded = True

            except Exception as e:
                print(f"[WARN] {model_name} failed: {e}")
                continue

        if not loaded:
            print("[ERROR] All response models failed to load")
            self.model_status["response"] = False
            self.response_model_name = None

    def _load_qwen(self):
        """Load Qwen model for refinement and fallback generation."""
        print("\n[LOAD] Loading Qwen2.5-0.5B-Instruct Model...")
        try:
            qwen_path = MODEL_PATHS.get("qwen")
            hf_id = "Qwen/Qwen2.5-0.5B-Instruct"
            load_path = qwen_path if (qwen_path and os.path.exists(qwen_path)) else hf_id

            print(f"[LOAD] Loading Qwen from: {load_path}")
            self.qwen_tokenizer = AutoTokenizer.from_pretrained(load_path)

            is_cuda = self.device.type == "cuda"
            self.qwen_model = AutoModelForCausalLM.from_pretrained(
                load_path,
                torch_dtype=torch.float16 if is_cuda else torch.float32,
                device_map="auto" if is_cuda else "cpu",
                low_cpu_mem_usage=not is_cuda
            )
            if not is_cuda and hasattr(self.qwen_model, 'to'):
                self.qwen_model = self.qwen_model.to(self.device)

            self.model_status["qwen"] = True
            print("[OK] Qwen model loaded successfully")
        except Exception as e:
            print(f"[ERROR] Qwen model failed to load: {e}")
            self.qwen_model = None
            self.qwen_tokenizer = None
            self.model_status["qwen"] = False

    def predict_intent(self, text):
        """
        Intent classification with rule-based post-processing.

        ✅ FIX 2 (part 2): Labels are now read from model config (id2label)
        instead of a hardcoded list, so they always match what the model
        was actually trained on.
        """
        if not self.model_status["intent"]:
            return "general"

        try:
            inputs = self.intent_tokenizer(
                text, return_tensors="pt", truncation=True, padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = self.intent_model(**inputs)
                probs = torch.softmax(outputs.logits, dim=-1)
                idx = torch.argmax(probs).item()

            if hasattr(self.intent_model.config, 'id2label'):
                labels_map = self.intent_model.config.id2label
                predicted_intent = labels_map.get(idx, "general")
            else:
                # Fallback only if model config has no id2label
                labels = [
                    "anger",
                    "sadness",
                    "gratitude",
                    "greeting",
                    "loneliness",
                    "help",
                    "relationship",
                    "self_care",
                    "stress",
                ]
                predicted_intent = labels[idx] if idx < len(labels) else "general"

            print(f"[INTENT] Index: {idx}, Label: {predicted_intent}")

            return override_intent(text, predicted_intent)

        except Exception as e:
            print(f"[ERROR] Intent prediction error: {e}")
            return "general"

    def predict_emotion(self, text):
        """
        Emotion classification with normalization to broader categories.

        Returns normalized emotion for better mental health context.
        """
        if not self.model_status["emotion"]:
            return "neutral"

        try:
            inputs = self.emotion_tokenizer(
                text, return_tensors="pt", truncation=True, padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = self.emotion_model(**inputs)
                probs = torch.sigmoid(outputs.logits)
                idx = torch.argmax(probs).item()

            emotions = [
                "admiration",
                "amusement",
                "anger",
                "annoyance",
                "approval",
                "caring",
                "confusion",
                "curiosity",
                "desire",
                "disappointment",
                "disapproval",
                "disgust",
                "embarrassment",
                "excitement",
                "fear",
                "gratitude",
                "grief",
                "joy",
                "love",
                "nervousness",
                "optimism",
                "pride",
                "realization",
                "relief",
                "remorse",
                "sadness",
                "surprise",
                "neutral",
            ]
            raw_emotion = emotions[idx] if idx < len(emotions) else "neutral"

            # Normalize to broader categories
            return normalize_emotion(raw_emotion)

        except Exception as e:
            print(f"[ERROR] Emotion prediction error: {e}")
            return "neutral"

    def predict_risk(self, text):
        """
        ML-based suicide risk detection with keyword augmentation.

        Combines:
        1. Trained ML classifier score
        2. Expanded high-risk keyword detection
        3. ML + rule-based score fusion

        Returns: (label: str, score: float)
            label: "high_risk" or "low_risk"
            score: 0.0 to 1.0 confidence
        """
        ml_score = 0.0

        if self.model_status["risk"]:
            try:
                inputs = self.risk_tokenizer(
                    text, return_tensors="pt", truncation=True, padding=True
                ).to(self.device)

                with torch.no_grad():
                    outputs = self.risk_model(**inputs)
                    logits = outputs.logits.squeeze()

                if logits.dim() == 0 or (
                    hasattr(logits, "shape") and len(logits.shape) == 1 and logits.shape[0] == 1
                ):
                    ml_score = torch.sigmoid(logits).item()
                else:
                    probs = torch.softmax(logits, dim=-1)
                    ml_score = probs[1].item() if probs.shape[-1] > 1 else probs[0].item()

            except Exception as e:
                print(f"Risk prediction error: {e}")

        text_lower = text.lower()

        import re
        high_risk_patterns = [
            r'\bi want to die\b',
            r'\bi want to kill myself\b',
            r'\bi don\'t want to live\b',
            r'\bi dont want to live\b',
            r'\bi don\'t want to live anymore\b',
            r'\bi dont want to live anymore\b',
            r'\bi can\'t live anymore\b',
            r'\bi cant live anymore\b',
            r'\bi want to end my life\b',
            r'\bi want to end it all\b',
            r'\bi\'m going to kill myself\b',
            r'\bim going to kill myself\b',
            r'\bend my life\b'
        ]

        # Check for strict pattern matches only
        pattern_matches = 0
        for pattern in high_risk_patterns:
            if re.search(pattern, text_lower):
                pattern_matches += 1

        # Only count keywords if strict patterns are found
        keyword_count = pattern_matches

        # Count and score high-risk keywords
        keyword_hits = keyword_count
        rule_score = min(keyword_hits / 2.0, 1.0)  # Each keyword = 50% impact

        print(f"[RISK ANALYSIS] ML score: {ml_score:.3f}, Rule score: {rule_score:.3f}, Keywords found: {keyword_hits}")

        # SANITY CHECK: Prevent false positives from ML overreacting to normal pleas for help
        # Crisis is ONLY triggered if:
        # 1. ml_score is extremely high (> 0.90) OR
        # 2. ml_score is high (> 0.70) AND rule_score > 0 (severe keywords actually found)
        # If ML score is high but NO keywords found, downgrade to moderate_risk
        if ml_score > 0.90:
            # Extremely high ML score - trigger crisis regardless of keywords
            final_score = ml_score
            label = "high_risk"
            print(f"[SANITY CHECK] Extreme ML score ({ml_score:.3f}) - triggering crisis")
        elif ml_score > 0.70 and keyword_hits > 0:
            # High ML score AND severe keywords found - trigger crisis
            final_score = max(ml_score, rule_score)
            label = "high_risk"
            print(f"[SANITY CHECK] High ML score ({ml_score:.3f}) + keywords found - triggering crisis")
        elif ml_score > 0.70:
            # High ML score but NO keywords - downgrade to moderate_risk to prevent false positives
            final_score = ml_score
            label = "moderate_risk"
            print(f"[SANITY CHECK] High ML score ({ml_score:.3f}) but NO keywords - downgraded to moderate_risk")
        else:
            final_score = ml_score
            label = "low_risk"

        return label, final_score

    def is_response_good(self, response, user_input, intent=None, emotion=None):
        """
        ENHANCED response validator v3.0 with comprehensive validation.
        """
        return response_is_good(response, user_input, intent, emotion)

        # Retained below for source compatibility with the original loader.
        try:
            response_lower = (response or "").lower().strip()
            user_lower = (user_input or "").lower().strip()

            # ========== CHECK 1: Response Length ==========
            word_count = len(response_lower.split())

            empathy_words = [
                "understand", "sorry", "feel", "support", "listen", "here",
                "care", "anxiety", "stress", "hard", "difficult"
            ]
            has_empathy = any(word in response_lower for word in empathy_words)

            min_words = 4 if has_empathy else 8

            if word_count < min_words:
                print(f"[VALIDATION] Response too short ({word_count} words, min {min_words})")
                return False

            if word_count > 80:
                print(f"[VALIDATION] Response too long ({word_count} words, max 80)")
                return False

            # ========== CHECK 2: Self-Reference Rejection ==========
            self_reference_phrases = [
                "my job", "i work as", "i work", "my role", "my position", "my occupation",
                "in my experience", "i am a counselor", "i am a therapist", "i am a doctor",
                "my name is", "about myself", "about me", "i am an assistant"
            ]

            allowed_empathy_phrases = [
                "i am sorry", "i'm sorry", "i am here", "i'm here", "i understand"
            ]

            has_allowed_empathy = any(phrase in response_lower for phrase in allowed_empathy_phrases)

            for phrase in self_reference_phrases:
                if phrase in response_lower and not has_allowed_empathy:
                    print(f"[VALIDATION] Self-reference detected: '{phrase}' -> REJECT")
                    return False

            # ========== CHECK 3: Empathy Enforcement ==========
            empathy_words_full = [
                "sorry", "understand", "hear you", "listen", "support",
                "here for you", "talk", "help", "feel", "care", "i'm here",
                "im here", "let's talk", "lets talk", "together", "there for you",
                "hard", "difficult", "common", "tough", "terrible", "overcome"
            ]

            distress_indicators = [
                "feel", "sad", "stress", "stressed", "anxious", "lonely",
                "bad", "not feeling well", "struggling", "upset", "worried",
                "afraid", "scared", "confused", "overwhelmed", "hopeless"
            ]

            user_shows_distress = any(indicator in user_lower for indicator in distress_indicators)
            has_empathy = any(word in response_lower for word in empathy_words_full)

            if user_shows_distress and not has_empathy:
                print("[VALIDATION] User shows distress but response lacks empathy words -> REJECT")
                return False

            # ========== CHECK 4: Intent-Aware Validation ==========
            if intent:
                intent_lower = intent.lower()

                if intent_lower == "help":
                    help_indicators = ["help", "support", "assist", "can try", "suggest", "recommend", "listen"]
                    if not any(word in response_lower for word in help_indicators):
                        print("[VALIDATION] HELP intent detected but response doesn't offer help/support -> REJECT")
                        return False

                if "stress" in intent_lower:
                    stress_related = [
                        "stress", "cope", "manage", "calm", "relax", "breathe",
                        "help", "understand", "anxious", "anxiety", "feel", "support"
                    ]
                    if not any(word in response_lower for word in stress_related):
                        print("[VALIDATION] STRESS intent detected but response doesn't address stress/coping -> REJECT")
                        return False

                if "sadness" in intent_lower or "sad" in intent_lower:
                    sadness_related = ["understand", "sorry", "feel", "listen", "support", "here"]
                    if not any(word in response_lower for word in sadness_related):
                        print("[VALIDATION] SADNESS intent detected but response not supportive -> REJECT")
                        return False

            # ========== CHECK 5: Emotion-Aware Validation ==========
            if emotion:
                emotion_lower = emotion.lower()

                negative_emotions = ["sadness", "anxiety", "grief", "fear", "anger", "nervousness"]
                positive_words = ["understand", "sorry", "here", "support", "help", "listen", "care"]

                if any(neg_emot in emotion_lower for neg_emot in negative_emotions):
                    if not any(pos_word in response_lower for pos_word in positive_words):
                        print(f"[VALIDATION] Negative emotion '{emotion}' detected but response lacks supportive tone -> REJECT")
                        return False

            # ========== CHECK 6: Keyword Overlap / Relevance Check ==========
            user_tokens = set(re.findall(r"\b\w+\b", user_lower))
            response_tokens = set(re.findall(r"\b\w+\b", response_lower))

            stopwords = {
                "i", "am", "is", "are", "the", "a", "an", "and", "or", "to", "of",
                "in", "on", "for", "with", "my", "me", "you", "your", "it", "that",
                "this", "be", "have", "has", "was", "were", "not", "so", "do", "did",
                "can", "will", "would", "could", "should", "if", "then", "by", "at",
                "from", "its", "their", "as", "but", "they", "we", "our", "just"
            }

            user_keywords = {w for w in user_tokens if w not in stopwords and len(w) > 2}
            response_keywords = {w for w in response_tokens if w not in stopwords and len(w) > 2}

            if user_keywords and response_keywords:
                overlap_ratio = len(user_keywords.intersection(response_keywords)) / len(user_keywords)

                if overlap_ratio < 0.1:
                    mh_keywords = {
                        "feel", "feeling", "sad", "stress", "anxiety", "help",
                        "support", "listen", "understand", "hear", "care"
                    }
                    if not (user_keywords & mh_keywords) or not (response_keywords & mh_keywords):
                        print(f"[VALIDATION] Response seems unrelated (overlap ratio: {overlap_ratio:.2f}) -> REJECT")
                        return False

            # ========== CHECK 7: No Unrelated Topics ==========
            invalid_phrases = [
                "activist", "politics", "political", "government",
                "election", "country", "national", "international"
            ]

            for phrase in invalid_phrases:
                if phrase in response_lower:
                    print(f"[VALIDATION] Invalid topic detected: '{phrase}' -> REJECT")
                    return False

            print("[VALIDATION] Response passes all validation checks")
            return True

        except Exception as e:
            print(f"[VALIDATION] Validation error: {e}")
            return False

    def crisis_fallback_response(self, user_input="", risk_score=0.0, user_context=None):
        """
        Enhanced crisis response with alarm system and knowledge resources.
        """
        print("CRISIS RESPONSE ACTIVATED!")

        if CRISIS_SYSTEM_AVAILABLE:
            try:
                crisis_info = trigger_crisis_response(user_input, risk_score, user_context)
                print(f"[CRISIS] Alarm and visual alerts triggered")
                print(f"[CRISIS] Risk Score: {risk_score:.3f}")

                resources = get_crisis_resources()

                response_parts = [
                    "CRISIS ALERT: I'm extremely concerned about you!",
                    "",
                    "IMMEDIATE COUNSELING SUPPORT:",
                    "",
                    "What to do right now:",
                    "1. Stay calm and speak in a gentle, reassuring voice",
                    "2. Validate feelings: 'I can see how much pain you're in'",
                    "3. Listen without judgment - don't try to 'fix' everything",
                    "4. Remind them they're not alone: 'I'm here with you'",
                    "5. Focus on the present moment: 'Let's get through this together'",
                    "",
                    "SUPPORTIVE PHRASES TO USE:",
                    "I'm here for you and I care about you",
                    "Your life matters and you are important",
                    "These feelings will pass, even if it doesn't feel like it",
                    "You are stronger than you think right now",
                    "Let's take this one moment at a time",
                    "",
                    "IMMEDIATE SAFETY ACTIONS:",
                    "CALL 911 IMMEDIATELY if this is an emergency!",
                    "CONTACT SUICIDE HOTLINE: 988",
                    "CRISIS TEXT: Text HOME to 741741",
                    "Remove any means of harm if possible",
                    "Stay with the person - don't leave them alone",
                    "",
                    "CALMING TECHNIQUES:",
                    "BREATHING: Inhale 4 seconds, hold 7, exhale 8 (repeat 3-4 times)",
                    "GROUNDING: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste",
                    "",
                    "A crisis interface has opened automatically with more detailed guidance.",
                    "Your life matters and there is hope - help is available now!"
                ]

                return "\n".join(response_parts)

            except Exception as e:
                print(f"[CRISIS] Error in crisis system: {e}")

        # Basic crisis response (fallback)
        return (
            "CRISIS ALERT: I'm really concerned about you and want you to get help immediately. "
            "Please reach out to these resources right now:\n\n"
            "Emergency Services: Call 911 or go to your nearest emergency room\n\n"
            "Suicide Prevention Lifeline: 988 (24/7, free, confidential)\n"
            "Crisis Text Line: Text HOME to 741741 (24/7, free, confidential)\n\n"
            "International Helplines:\n"
            "UK: Samaritans 116 123\n"
            "Canada: 988 (Canada Suicide Prevention Service)\n"
            "Australia: Lifeline 13 11 14\n"
            "India: +91-9820466726 (Vandrevala Foundation)\n\n"
            "You don't have to go through this alone. These services are staffed by "
            "trained professionals who want to help you through this difficult time. "
            "Please reach out now - your life matters and there is hope."
        )

    def safe_fallback_response(self):
        return "I'm here to listen. Can you tell me a little more about what's been bothering you?"

    def irrelevant_topic_response(self):
        return "I'm sorry, I didn't understand that. I'm here to help with mental health and emotional support."

    def is_relevant_input(self, text, has_context=False):
        """
        Check if user input is valid and relevant to mental health.
        
        Args:
            text: The user's current message
            has_context: Whether there is conversation history (follow-up message)
        
        Relevance is checked for every message, including follow-ups.  The
        has_context argument is retained for callers, but conversation history
        must not allow unrelated requests to bypass the domain check.
        """
        if not text or len(text.strip()) == 0:
            return False

        word_count = len(text.strip().split())
        text_lower = text.lower()

        # Check explicit self-harm phrases first (ALWAYS check, even with
        # context).  Do not match isolated words such as "end", "kill", or
        # "harm": substring matching makes ordinary phrases such as
        # "friend" and "ending a project" look like a crisis.
        crisis_patterns = [
            r"\bi\s+(?:want|wanna)\s+to\s+kill\s+myself\b",
            r"\bi\s+(?:want|wanna)\s+to\s+hurt\s+myself\b",
            r"\bi\s+(?:want|wanna)\s+to\s+die\b",
            r"\bi\s+(?:do\s+not|don't|dont)\s+want\s+to\s+live(?:\s+anymore)?\b",
            r"\bi\s+(?:can't|cant|cannot)\s+live\s+anymore\b",
            r"\bi\s+(?:am|['’]m)\s+thinking\s+about\s+suicide\b",
            r"\bi\s+(?:am|['’]m)\s+planning\s+to\s+(?:kill\s+myself|end\s+my\s+life)\b",
            r"\bi\s+(?:have\s+)?decided\s+to\s+end\s+my\s+life\b",
            r"\bi\s+(?:want|wanna)\s+to\s+end\s+(?:my\s+life|it\s+all)\b",
            r"\bi\s+(?:am|['’]m)\s+going\s+to\s+(?:kill|hurt)\s+myself\b",
            r"\bi\s+will\s+(?:kill|hurt)\s+myself\b",
            r"\bi\s+(?:am\s+)?better\s+off\s+dead\b",
            r"\bi\s+have\s+no\s+(?:reason|point)\s+(?:to|in)\s+live\b",
        ]
        has_crisis_phrase = any(re.search(pattern, text_lower) for pattern in crisis_patterns)

        if has_crisis_phrase:
            print(f"[CRISIS] Crisis keywords detected - providing specialized response")
            return {
                "response": "I hear that you're going through something incredibly difficult right now. Your life matters deeply, and there are people who want to help you through this. Please reach out to someone immediately - call the Kiran Mental Health Helpline at 1800-599-0019 or AASRA at 9820466626. You don't have to go through this alone, and there is hope even when it doesn't feel like it right now.",
                "crisis_response": True,
                "validation_applied": True,
                "rejected": False,
                "immediate_help": True
            }

        # ENHANCE short inputs (1-2 words) - ask clarifying questions
        if word_count <= 2:
            print(f"[FILTER] Input too short ({word_count} words) - asking clarifying question")
            return {
                "response": f"That's quite brief. Could you tell me more about what's on your mind? I'm here to help with mental health and emotional support.",
                "requires_clarification": True,
                "validation_applied": True,
                "rejected": False
            }

        # Mental health and emotional-support keywords. Keep this broad enough
        # to accept natural follow-ups about coping, relationships, school, and
        # distress, while applying the same check to every message.
        mental_health_keywords = [
            "sad", "sadness", "depressed", "depression", "hopeless",
            "stress", "stressed", "stressful", "overwhelm", "overwhelmed",
            "anxious", "anxiety", "worry", "worried", "panic", "fear",
            "angry", "anger", "frustrated", "irritated", "annoyed",
            "lonely", "loneliness", "isolated", "alone",
            "help", "support", "talk", "counseling", "therapy",
            "feeling", "feel", "emotions", "emotional", "mental",
            "struggling", "struggle", "difficult", "hard", "tough",
            "pain", "hurt", "suffering", "painful", "ache",
            "tired", "exhausted", "burnout", "fatigue",
            "sleep", "insomnia", "nightmare", "restless",
            "appetite", "eating", "food", "weight", "body",
            "concentration", "focus", "memory", "thinking",
            "thought", "thoughts", "can't stop thinking", "cannot stop thinking",
            "happened", "remember", "memory", "memories", "ruminating", "intrusive",
            "calm", "calm down", "cope", "coping", "manage", "grounding", "breathe", "breathing", "relax",
            "friend", "friends", "family", "partner", "relationship", "breakup", "argument",
            "fight", "conflict", "rejected", "ignored", "stopped talking", "grief", "loss",
            "exam", "exams", "school", "college", "study", "studying", "grades", "academic",
            "suicide", "kill", "die", "death", "end", "harm",
            "crisis", "emergency", "urgent", "immediate",
            "job", "work", "career", "employment", "unemployed",
            "fired", "laid off", "quit", "resigned", "terminated",
            "job loss", "lost job", "no job", "job hunting",
            "workplace", "boss", "colleague", "coworker", "team",
            "pressure", "deadline", "overwork", "workload", "burnout",
            "financial", "money", "income", "salary", "bills",
            "rejection", "interview", "resume", "application",
            "anxious about work", "work stress", "job anxiety",
            "career change", "professional", "office", "business"
        ]

        has_mental_health = any(keyword in text_lower for keyword in mental_health_keywords)

        if not has_mental_health:
            print(f"[FILTER] No mental health keywords found - rejected")
            return False

        return True

    def refine_response(self, user_input, response, emotion):
        """
        Refine response with emotion-aware empathy and natural language.
        """
        if self.model_status.get("qwen") and self.qwen_model is not None:
            try:
                return self._refine_with_qwen(user_input, response, emotion)
            except Exception as e:
                print(f"[QWEN] Refinement failed: {e}, falling back to next available refiner")

        emotion_key = emotion.lower()
        if emotion_key not in EMPATHY_RESPONSES:
            emotion_key = 'neutral'

        empathy_options = EMPATHY_RESPONSES[emotion_key]
        import random
        empathy_response = random.choice(empathy_options)

        response_lower = response.lower()
        has_substantial_empathy = any(phrase in response_lower for phrase in EMPATHY_INDICATORS)

        if not has_substantial_empathy:
            refined = f"{empathy_response} {response}"
        else:
            refined = response

        if '?' not in refined:
            follow_up_options = FOLLOW_UP_QUESTIONS.get(emotion_key, FOLLOW_UP_QUESTIONS['default'])
            refined += f" {random.choice(follow_up_options)}"

        return refined.strip()

    def _refine_with_qwen(self, user_input, response, emotion):
        """
        Use Qwen2.5 to refine and fix DialoGPT outputs.
        """
        messages = [
            {"role": "system", "content": "You are a highly empathetic mental health support assistant. Your task is to refine and correct a draft response. Fix any weird grammar, remove repetitive word-salad, and ensure it is supportive and natural. Do NOT give medical advice. Keep it under 3 sentences."},
            {"role": "user", "content": f"User's message: '{user_input}'\nDetected emotion: {emotion}\nDraft response to fix: '{response}'\n\nPlease provide only the corrected, final response."}
        ]

        try:
            prompt = self.qwen_tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            inputs = self.qwen_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(self.device)

            with torch.no_grad():
                outputs = self.qwen_model.generate(
                    **inputs,
                    max_new_tokens=150,
                    do_sample=True,
                    temperature=0.3,
                    pad_token_id=self.qwen_tokenizer.eos_token_id,
                    eos_token_id=self.qwen_tokenizer.eos_token_id
                )

            full_response = self.qwen_tokenizer.decode(outputs[0], skip_special_tokens=False)

            if "<|im_start|>assistant\n" in full_response:
                refined_response = full_response.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
            else:
                refined_response = self.qwen_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

            print(f"[QWEN] Refined: {refined_response}")
            return refined_response

        except Exception as e:
            print(f"[QWEN] Error during refinement: {e}")
            raise e

    def _generate_with_qwen_fallback(self, user_input, emotion, intent, context=None):
        """
        If DialoGPT totally fails, use Qwen2.5 to generate the response directly.
        """
        generation_context = context or f"User: {user_input}"
        messages = [
            {
            "role": "system",
            "content": (
                "You are a highly empathetic mental health support assistant. "
                "Focus primarily on the user's latest message while using previous conversation "
                "context to understand follow-up questions. Acknowledge the user's feelings "
                "and directly address the problem they are describing. "
                "For stress, anxiety, studying, concentration, exams, pressure, or emotional "
                "difficulties, provide one or two practical and supportive coping suggestions. "
                "Do not give medical advice. Do not mention unrelated topics. "
                "Do not claim to be a doctor, therapist, or human professional. "
                "Do not repeat the conversation history. "
                "Ask at most one relevant follow-up question, and only when useful. "
                "Keep the response between 30 and 70 words and no more than 3 sentences."
            )
        },
            {"role": "user", "content": generation_context}
        ]

        try:
            prompt = self.qwen_tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            inputs = self.qwen_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(self.device)

            with torch.no_grad():
                outputs = self.qwen_model.generate(
                    **inputs,
                    max_new_tokens=150,
                    do_sample=True,
                    temperature=0.4,
                    pad_token_id=self.qwen_tokenizer.eos_token_id,
                    eos_token_id=self.qwen_tokenizer.eos_token_id
                )

            full_response = self.qwen_tokenizer.decode(outputs[0], skip_special_tokens=False)

            if "<|im_start|>assistant\n" in full_response:
                generated_response = full_response.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
            else:
                generated_response = self.qwen_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

            print(f"[QWEN FALLBACK] Generated: {generated_response}")
            return generated_response

        except Exception as e:
            print(f"[QWEN FALLBACK] Generation failed: {e}")
            raise e

    def validate_with_phi3(self, user_input, response, emotion):
        """
        Use Phi-3 Mini to validate response quality.
        """
        validation_prompt = f"""You are a mental health response validator.

User input: "{user_input}"
Generated response: "{response}"
Detected emotion: {emotion}

Evaluate this response on a scale of 1-10 for:
1. Empathy and emotional support
2. Relevance to user's concern
3. Appropriateness for mental health context
4. Natural conversational tone

Respond with only a score (1-10) and brief feedback.
Example: "7/10 - Good empathy but could be more specific"

Score:"""

        try:
            inputs = self.phi3_tokenizer(
                validation_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512
            ).to(self.device)

            with torch.no_grad():
                outputs = self.phi3_model.generate(
                    **inputs,
                    max_new_tokens=50,
                    do_sample=True,
                    temperature=0.3,
                    top_p=0.8,
                    pad_token_id=self.phi3_tokenizer.eos_token_id
                )

            validation_result = self.phi3_tokenizer.decode(
                outputs[0],
                skip_special_tokens=True
            ).strip()

            if "Score:" in validation_result:
                validation_result = validation_result.split("Score:")[-1].strip()

            import re
            score_match = re.search(r'(\d+)/?10', validation_result)
            if score_match:
                score = int(score_match.group(1))
                is_valid = score >= 6
                feedback = validation_result
                print(f"[PHI3] Validation: {score}/10 - {feedback}")
                return is_valid, score/10.0, feedback

            return True, 0.7, "Valid response"

        except Exception as e:
            print(f"[PHI3] Validation error: {e}")
            return True, 0.7, "Validation failed - assuming valid"

    def detect_hallucination(self, response, user_input):
        """
        Detect hallucination patterns in model responses.
        """
        if not response or not user_input:
            return True, 1.0, ["Empty response or input"]

        hallucination_score = 0.0
        reasons = []

        fragmented_patterns = [
            r'\. ',
            r'\.\.\.',
            r'\. \. \.',
            r'[a-z]\. [a-z]',
            r'[a-z]\.[A-Z]',
        ]

        for pattern in fragmented_patterns:
            if re.search(pattern, response):
                hallucination_score += 0.3
                reasons.append("Fragmented text pattern detected")

        mixed_indicators = [
            'ial_tokens', 'kenizer.eos_token', 'add a new pad',
            'transformers_modules', 'special tokens', 'fine-tuned',
            'embedding', 'tensor', 'model.safetensors'
        ]

        response_lower = response.lower()
        for indicator in mixed_indicators:
            if indicator in response_lower:
                hallucination_score += 0.5
                reasons.append(f"Technical artifact: {indicator}")

        sentences = response.split('.')
        incoherent_count = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 0:
                words = sentence.split()
                if len(words) < 3:
                    incoherent_count += 1
                elif any(word.isdigit() and len(word) > 4 for word in words):
                    hallucination_score += 0.2
                    reasons.append("Numbers in inappropriate context")

        if incoherent_count > len(sentences) * 0.5:
            hallucination_score += 0.4
            reasons.append("Too many incoherent sentences")

        words = response.split()
        if len(set(words)) < len(words) * 0.3:
            hallucination_score += 0.3
            reasons.append("Excessive repetition")

        if len(response.split()) < 5:
            hallucination_score += 0.2
            reasons.append("Response too short")

        mental_health_keywords = [
            "feel", "feeling", "sad", "anxious", "stress", "help", "support",
            "understand", "listen", "talk", "difficult", "hard", "struggle"
        ]

        has_mental_health_content = any(
            keyword in response_lower for keyword in mental_health_keywords
        )

        if not has_mental_health_content and len(response) > 50:
            hallucination_score += 0.2
            reasons.append("No mental health relevant content")

        hallucination_score = min(hallucination_score, 1.0)
        is_hallucinated = hallucination_score > 0.6

        return is_hallucinated, hallucination_score, reasons

    def is_meaningful(self, response, user_input):
        """
        Enhanced quality check with aggressive hallucination detection.
        """
        if not response or len(response.strip()) < 6:
            print(f"[QUALITY] Response too short: '{response}'")
            return False

        response_lower = response.lower()

        bad_patterns = [
            "thank you have",
            "feeling good to",
            "you are doing this is",
            "have been feeling",
            "so much better than you've",
        ]

        for pattern in bad_patterns:
            if pattern in response.lower():
                print("[BLOCK] Known hallucination pattern")
                return False

        hallucination_indicators = [
            "do not the", "really do not", "thank you have", "have no worries",
            "i think you're really", "i have to be honest", "need to be proud",
            "you are very good support", "believe in yourself", "not to do not",
            "not to be strong", "do not think about", "been in the factuality",
            "can't know you", "talk about emotional support myself",
            "the things that you", "you and the future", "make it's mental health",
            "you're self", "need to feel", "try to do it, make", "and try to do",
            "i think i can't", "know we have to", "there will be better",
            "get more important", "not to get your health", "it's your health",
            "so much better", "have a good", "can be prepared", "never have a way",
            ":-that you're", "the things, they", "and will be strong",
            "don't get stronger", "should be strong", "be proud", "make you can"
        ]

        for indicator in hallucination_indicators:
            if indicator in response_lower:
                print(f"[QUALITY] ESCONV HALLUCINATION DETECTED: '{indicator}'")
                return False

        esconv_issues = [
            "i'm sorry that we will", "thank you for your help to help",
            "talk about my self", "i am doing the job", "do not to think",
            "i do not worry", "come back in the job", "trying to the job",
            "my self-you", "i'mself", "self-you", "doing the job",
            "we will not need", "not need to tell", "help to help us",
            "have to get to come", "thanks you are doing", "not letting go",
            "? , that we are", "! , it in", ", we are ready",
            ", feelings. !", ", self. ,", "self, self", "self esteem, self"
        ]

        for issue in esconv_issues:
            if issue in response_lower:
                print(f"[QUALITY] ESCONV MODEL ISSUE DETECTED: '{issue}'")
                return False

        job_related = ["job", "career", "work", "employment", "resume", "interview"]
        job_count = sum(1 for word in job_related if word in response_lower)
        if job_count >= 2:
            print(f"[QUALITY] Excessive job-related content detected: {job_count} mentions")
            return False

        words = response_lower.split()
        word_counts = {}
        for word in words:
            if len(word) > 3:
                word_counts[word] = word_counts.get(word, 0) + 1

        for word, count in word_counts.items():
            if count > 3:
                print(f"[QUALITY] Excessive repetition detected: '{word}' ({count} times)")
                return False

        irrelevant_phrases = [
            "i work as", "in our country", "politics", "government",
            "i am a", "my job is", "my role is", "as an ai", "i am an ai",
            "career advice", "job search", "resume", "interview",
            "financial advice", "investment", "money", "salary",
            "legal advice", "lawyer", "court", "legal",
            "medical advice", "doctor", "medicine", "diagnosis"
        ]

        for phrase in irrelevant_phrases:
            if phrase in response_lower:
                print(f"[QUALITY] Irrelevant phrase detected: '{phrase}'")
                return False

        generic_responses = ["ok", "yes", "i don't know", "i understand", "that's nice"]
        if response_lower.strip() in generic_responses:
            print(f"[QUALITY] Generic response detected: '{response}'")
            return False

        user_words = set(user_input.lower().split())
        response_words = set(response_lower.split())

        stopwords = {"i", "am", "is", "are", "the", "a", "an", "and", "or", "to", "of",
                     "in", "on", "for", "with", "my", "me", "you", "your"}
        user_keywords = {w for w in user_words if w not in stopwords and len(w) > 2}
        response_keywords = {w for w in response_words if w not in stopwords and len(w) > 2}

        if user_keywords and response_keywords:
            overlap = len(user_keywords.intersection(response_keywords))
            if overlap == 0 and len(response.split()) < 10:
                print(f"[QUALITY] No word overlap and response too short")
                return False

        return True

    def emotional_job_loss_fallback(self, user_input, emotion):
        """
        Emotional support fallback specifically for job loss situations.
        """
        job_loss_responses = {
            'sadness': "I'm really sorry you're going through this difficult time. Losing a job can bring up intense feelings of sadness, grief, and uncertainty about your self-worth. These feelings are completely valid and you deserve support as you process this emotional experience.",
            'anxiety': "I understand how stressful and anxiety-provoking job loss can be. The uncertainty about the future and financial worries can feel overwhelming. Let's focus on managing these anxious feelings and finding healthy ways to cope during this challenging time.",
            'anger': "It's completely understandable to feel angry about losing your job. Anger is a natural response to injustice and loss. Your feelings are valid, and it's important to acknowledge this anger while finding constructive ways to process it.",
            'fear': "Job loss can trigger deep fears about your future, security, and self-worth. These fears are real and understandable. You're not alone in feeling this way, and we can work together on managing these fearful emotions.",
            'neutral': "I'm here to support you through this difficult time. Job loss brings up many complex emotions - stress, anxiety, sadness, and questions about self-worth. Whatever you're feeling right now is completely valid."
        }

        response = job_loss_responses.get(emotion.lower(), job_loss_responses['neutral'])
        print(f"[EMOTIONAL JOB LOSS FALLBACK] Using emotional support for {emotion}")
        return response

    def comprehensive_rule_based_response(self, user_input, emotion, intent):
        """
        Comprehensive rule-based response system for when LLM fails or hallucinates.
        """
        user_input_lower = user_input.lower()

        if any(keyword in user_input_lower for keyword in ["lost job", "job loss", "unemployed", "fired", "laid off"]):
            job_loss_responses = {
                'sadness': "I'm really sorry you're going through this difficult time. Losing a job can bring up intense feelings of sadness, grief, and uncertainty about your self-worth. These feelings are completely valid and you deserve support as you process this emotional experience.",
                'anxiety': "I understand how stressful and anxiety-provoking job loss can be. The uncertainty about the future and financial worries can feel overwhelming. Let's focus on managing these anxious feelings and finding healthy ways to cope during this challenging time.",
                'anger': "It's completely understandable to feel angry about losing your job. Anger is a natural response to injustice and loss. Your feelings are valid, and it's important to acknowledge this anger while finding constructive ways to process it.",
                'fear': "Job loss can trigger deep fears about your future, security, and self-worth. These fears are real and understandable. You're not alone in feeling this way, and we can work together on managing these fearful emotions.",
                'neutral': "I'm here to support you through this difficult time. Job loss brings up many complex emotions - stress, anxiety, sadness, and questions about self-worth. Whatever you're feeling right now is completely valid."
            }
            return job_loss_responses.get(emotion.lower(), job_loss_responses['neutral'])

        if any(keyword in user_input_lower for keyword in ["stress", "overwhelm", "overwhelmed", "too much"]):
            stress_responses = {
                'sadness': "I can hear how overwhelmed and sad you're feeling. When everything feels like too much, it's important to be gentle with yourself. You don't have to carry all this weight alone.",
                'anxiety': "That sounds incredibly stressful and overwhelming. Your anxiety is completely justified given what you're experiencing. Let's focus on grounding techniques to help you feel more centered.",
                'anger': "I understand why you're feeling angry and overwhelmed. When stress builds up, anger is a natural response. Your feelings are valid, and we can work on healthy ways to process this.",
                'fear': "Feeling overwhelmed can be scary, especially when you don't know how to cope. You're not alone in this feeling, and there are ways to manage overwhelming stress.",
                'neutral': "That sounds really overwhelming. It takes courage to acknowledge when things feel like too much. I'm here to help you break this down into manageable steps."
            }
            return stress_responses.get(emotion.lower(), stress_responses['neutral'])

        emotion_responses = {
            'sadness': "I'm really sorry you're feeling this way. Sadness can feel heavy and overwhelming, but you don't have to carry it alone. I'm here to listen and support you through this difficult emotion.",
            'anxiety': "I understand how difficult anxiety can feel. Those racing thoughts and physical symptoms can be exhausting. Take a deep breath - I'm here to help you work through this anxiety together.",
            'stress': "That sounds really stressful. When everything feels like it's piling up, it's important to remember that you don't have to handle it all at once. I'm here to support you.",
            'anger': "That sounds really frustrating. Anger is a valid emotion, and it's okay to feel angry about what's happening. I'm here to help you process these feelings in a healthy way.",
            'fear': "That sounds really scary. Fear can be paralyzing, but you don't have to face it alone. I'm here to help you feel safer and more grounded.",
            'joy': "It's wonderful to hear you're feeling joyful! These moments of happiness are precious. What's bringing you this joy today?",
            'neutral': "I'm here to listen and support you. Whatever you're going through, you don't have to face it alone. Can you tell me more about what's on your mind?"
        }

        response = emotion_responses.get(emotion.lower(), emotion_responses['neutral'])
        print(f"[RULE-BASED] Using comprehensive response for {emotion}/{intent}")
        return response

    def simple_fallback_response(self, user_input, emotion):
        """
        Simple rule-based fallback when model generation fails.
        """
        fallbacks = {
            'sadness': "I'm really sorry you're feeling this way. I'm here to listen and support you through this.",
            'anxiety': "I understand how difficult anxiety can feel. Take a deep breath - I'm here to help you work through this.",
            'stress': "That sounds really overwhelming. Let's take this one step at a time. I'm here to support you.",
            'anger': "That sounds really frustrating. It's okay to feel angry - I'm here to help you process these feelings.",
            'fear': "That sounds really scary. You're not alone in this - I'm here to help you feel safer.",
            'neutral': "I'm here to listen and support you. Can you tell me more about what's on your mind?"
        }

        fallback = fallbacks.get(emotion.lower(), fallbacks['neutral'])
        print(f"[SIMPLE FALLBACK] Using empathetic fallback for {emotion}")
        return fallback

    def _validate_generated_response(self, response, user_input, intent, emotion, context=None):
        if not isinstance(response, str) or not response.strip():
            print("[VALIDATION] Generated response is empty or malformed")
            return False

        if not self.is_meaningful(response, user_input):
            print("[VALIDATION] Generated response is not meaningful")
            return False

        is_hallucinated, hallucination_score, hallucination_reasons = self.detect_hallucination(
            response,
            user_input,
        )
        if is_hallucinated:
            print(
                f"[VALIDATION] Generated response hallucination detected: "
                f"{hallucination_score:.2f} - {', '.join(hallucination_reasons)}"
            )
            return False

        validation_input = context if context else user_input
        is_valid, reason = self.validate_response(
            response,
            intent,
            emotion,
            user_input=validation_input,
        )
        if not is_valid:
            print(f"[VALIDATION] Generated response rejected: {reason}")
        return is_valid

    def _validated_safe_fallback(self, user_input, intent, emotion, context=None):
        response = self.safe_fallback_response()
        self.last_response_generation = "safe_fallback"
        self._validate_generated_response(
            response,
            user_input,
            intent,
            emotion,
            context=context,
        )
        return response

    def generate_simple_response(self, context, intent, emotion, history=None):
        """
        ENHANCED response generation v4.1 WITH context handling.

        Pipeline:
        1. Extract current user input from context
        2. Crisis detection using ML classifier
        3. Domain filtering
        4. Generate response using conversation context
        5. Clean and refine response
        6. Return final response

        Args:
            context (str): Full conversation context
            intent (str): Detected intent
            emotion (str): Detected emotion
            history (list): Conversation history

        Returns: str (validated and refined response text)
        """
        print(f"[DEBUG] generate_simple_response called with:")
        print(f"[DEBUG]   context: {context[:200]}..." if len(context) > 200 else f"[DEBUG]   context: {context}")
        print(f"[DEBUG]   intent: {intent}")
        print(f"[DEBUG]   emotion: {emotion}")
        print(f"[DEBUG]   history length: {len(history) if history else 0}")
        self.last_response_generation = "unknown"
        
        try:
            # STEP 1: Extract current user input from context
            current_input = ""
            if isinstance(context, str) and "\n" in context:
                lines = context.strip().split('\n')
                for line in reversed(lines):
                    if line.startswith("User:"):
                        current_input = line.replace("User:", "").strip()
                        break
                else:
                    current_input = lines[-1].strip() if lines else context.strip()
            else:
                current_input = context.strip()

            print(f"[DEBUG] Extracted current_input: {current_input}")

            # ✅ FIX 1: alias current_input as text so all fallback branches work correctly
            text = current_input

            print(f"[CONTEXT] Current input: '{current_input}'")
            print(f"[CONTEXT] Full context: {context[:200]}...")

            # STEP 2: Crisis detection using ML classifier
            risk_label, risk_score = self.predict_risk(current_input)
            if risk_label == "high_risk":
                print("[CRISIS] High-risk input detected - using crisis response")
                user_context = {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {
                        "label": risk_label,
                        "score": float(risk_score),
                        "method": "ml_classifier",
                    },
                }
                return self._generate_with_qwen_fallback(context, emotion, intent)

            print(f"[CONTEXT] Using context for response generation")
            if self.model_status.get("qwen") and self.qwen_model is not None:
                print("[PRIMARY] Using Qwen for response generation")
                try:
                    qwen_response = self._generate_with_qwen_fallback(
                        current_input,
                        emotion,
                        intent,
                        context=context,
                    )
                    if self._validate_generated_response(
                        qwen_response,
                        current_input,
                        intent,
                        emotion,
                        context=context,
                    ):
                        self.last_response_generation = "qwen_model"
                        return qwen_response
                    print("[QWEN] Generated response failed validation, falling back to DialoGPT")
                except Exception as e:
                    print(f"[QWEN] Primary generation failed: {e}, falling back to DialoGPT")

            # STEP 4b: Fallback to DialoGPT if Qwen fails
            print("[FALLBACK] Using DialoGPT for response generation")

            prompt = context

            max_retries = 1
            retry_count = 0
            response_text = None

            while retry_count <= max_retries:
                try:
                    print(f"\n[DIALO GPT] Attempt {retry_count + 1}/{max_retries + 1}")

                    if self.resp_tokenizer is None:
                        raise Exception("Tokenizer not initialized")

                    if hasattr(self.resp_tokenizer, 'pad_token') and self.resp_tokenizer.pad_token is None:
                        self.resp_tokenizer.pad_token = self.resp_tokenizer.eos_token

                    inputs = self.resp_tokenizer(
                        prompt,
                        return_tensors="pt",
                        truncation=True,
                        padding=True,
                        max_length=512,
                    ).to(self.device)

                    with torch.no_grad():
                        outputs = self.resp_model.generate(
                            **inputs,
                            max_new_tokens=150,
                            do_sample=True,
                            temperature=0.6,
                            top_p=0.8,
                            repetition_penalty=1.3,
                            pad_token_id=self.resp_tokenizer.eos_token_id,
                            eos_token_id=self.resp_tokenizer.eos_token_id,
                            early_stopping=True
                        )

                    response_text = self.resp_tokenizer.decode(
                        outputs[0],
                        skip_special_tokens=True
                    ).strip()

                    if "Assistant:" in response_text:
                        response_text = response_text.split("Assistant:")[-1].strip()
                    if "User:" in response_text:
                        response_text = response_text.split("User:")[0].strip()

                    response_text = response_text.replace("User:", "").replace("Assistant:", "")

                    lines = response_text.split('\n')
                    clean_lines = []
                    for line in lines:
                        line = line.strip()
                        if not line.startswith(('User:', 'Assistant:', 'Human:', 'AI:')):
                            if len(line) > 3:
                                clean_lines.append(line)

                    response_text = ' '.join(clean_lines)

                    if '?' in response_text and response_text.count('?') > 1:
                        parts = response_text.split('?')
                        response_text = parts[0] + '?'

                    print(f"[RAW OUTPUT] Generated: '{response_text}'")

                    # STEP 5: Clean response
                    response_text = clean_response(response_text)

                    # STEP 6: Check quality — ✅ now uses `text` which is defined above
                    is_meaningful = self.is_meaningful(response_text, text)

                    is_hallucinated, hallucination_score, hallucination_reasons = self.detect_hallucination(response_text, text)
                    if is_hallucinated:
                        print(f"[HALLUCINATION] Detected: {hallucination_score:.2f} - {', '.join(hallucination_reasons)}")
                        is_meaningful = False

                    if is_meaningful and not is_hallucinated:
                        print("[SUCCESS] Response is meaningful - proceeding to refinement")

                        # STEP 7: Refine response — ✅ uses `text` safely
                        final_response = self.refine_response(text, response_text, emotion)
                        if self._validate_generated_response(
                            final_response,
                            text,
                            intent,
                            emotion,
                            context=context,
                        ):
                            self.last_response_generation = "dialogpt_model"
                            return final_response
                        print("[QUALITY] Refined response failed validation - retrying")
                        retry_count += 1
                        continue
                    else:
                        print(f"[QUALITY] Response not meaningful - retrying")
                        retry_count += 1

                        if retry_count <= max_retries:
                            print(f"[RETRY] Attempting again (attempt {retry_count + 1})...")
                            continue
                        else:
                            print("[RETRIES EXHAUSTED] Checking fallbacks...")
                            break

                except Exception as gen_error:
                    print(f"[ERROR] Generation error on attempt {retry_count + 1}: {gen_error}")
                    retry_count += 1
                    if retry_count > max_retries:

                        # QWEN FALLBACK: If DialoGPT is unstable, ask Qwen to answer directly
                        if self.model_status.get("qwen") and self.qwen_model is not None:
                            print("[FORCED FALLBACK] DialoGPT unstable → Qwen taking over generation")
                            qwen_response = self._generate_with_qwen_fallback(
                                text,
                                emotion,
                                intent,
                                context=context,
                            )  # ✅ text defined
                            if self._validate_generated_response(
                                qwen_response,
                                text,
                                intent,
                                emotion,
                                context=context,
                            ):
                                self.last_response_generation = "qwen_model"
                                return qwen_response

                        # Otherwise use rule-based — ✅ text defined
                        if response_text is None or not self.is_meaningful(response_text, text):
                            print("[FORCED FALLBACK] Model unstable → using rule-based response")
                            fallback_response = self.comprehensive_rule_based_response(text, emotion, intent)
                            if self._validate_generated_response(
                                fallback_response,
                                text,
                                intent,
                                emotion,
                                context=context,
                            ):
                                self.last_response_generation = "rule_based_fallback"
                                return fallback_response
                            return self._validated_safe_fallback(text, intent, emotion, context=context)

                        response_lower = response_text.lower()
                        job_advice_indicators = [
                            "job search", "resume", "interview", "career", "training", "education",
                            "apply for", "find a job", "new job", "job opportunities", "skills",
                            "unemployment", "benefits", "financial", "money", "budget", "savings"
                        ]

                        if any(indicator in response_lower for indicator in job_advice_indicators):
                            print("[QUALITY] Job/career advice detected - using emotional fallback")
                            fallback_response = self.emotional_job_loss_fallback(text, emotion)  # ✅ text defined
                            if self._validate_generated_response(
                                fallback_response,
                                text,
                                intent,
                                emotion,
                                context=context,
                            ):
                                self.last_response_generation = "rule_based_fallback"
                                return fallback_response
                            return self._validated_safe_fallback(text, intent, emotion, context=context)
                        else:
                            fallback_response = self.simple_fallback_response(text, emotion)  # ✅
                            final_response = self.refine_response(text, fallback_response, emotion)  # ✅
                            if len(response_text.split()) < 6:
                                fallback_response = self.comprehensive_rule_based_response(text, emotion, intent)  # ✅
                                if self._validate_generated_response(
                                    fallback_response,
                                    text,
                                    intent,
                                    emotion,
                                    context=context,
                                ):
                                    self.last_response_generation = "rule_based_fallback"
                                    return fallback_response
                                return self._validated_safe_fallback(text, intent, emotion, context=context)
                            print(f"[FINAL OUTPUT] After simple fallback + refinement: '{final_response}'")
                            if self._validate_generated_response(
                                final_response,
                                text,
                                intent,
                                emotion,
                                context=context,
                            ):
                                self.last_response_generation = "rule_based_fallback"
                                return final_response
                            fallback_response = self.comprehensive_rule_based_response(text, emotion, intent)
                            if self._validate_generated_response(
                                fallback_response,
                                text,
                                intent,
                                emotion,
                                context=context,
                            ):
                                self.last_response_generation = "rule_based_fallback"
                                return fallback_response
                            return self._validated_safe_fallback(text, intent, emotion, context=context)

            # STEP 8: QWEN FALLBACK OR COMPREHENSIVE RULE-BASED FALLBACK
            if self.model_status.get("qwen") and self.qwen_model is not None:
                print("[QWEN FALLBACK] All DialoGPT attempts failed, Qwen taking over...")
                qwen_response = self._generate_with_qwen_fallback(
                    text,
                    emotion,
                    intent,
                    context=context,
                )  # ✅
                if self._validate_generated_response(
                    qwen_response,
                    text,
                    intent,
                    emotion,
                    context=context,
                ):
                    self.last_response_generation = "qwen_model"
                    return qwen_response

            print("[COMPREHENSIVE FALLBACK] All attempts failed, using rule-based response")
            fallback_response = self.comprehensive_rule_based_response(text, emotion, intent)  # ✅
            final_response = self.refine_response(text, fallback_response, emotion)  # ✅
            print(f"[FINAL OUTPUT] After comprehensive fallback + refinement: '{final_response}'")
            if self._validate_generated_response(
                final_response,
                text,
                intent,
                emotion,
                context=context,
            ):
                self.last_response_generation = "rule_based_fallback"
                return final_response
            if self._validate_generated_response(
                fallback_response,
                text,
                intent,
                emotion,
                context=context,
            ):
                self.last_response_generation = "rule_based_fallback"
                return fallback_response
            return self._validated_safe_fallback(text, intent, emotion, context=context)

        except Exception as e:
            print(f"[ERROR] Critical error in response generation: {e}")
            return self._validated_safe_fallback("", None, None)

    def extract_contexts(self, user_input):
        """
        Extract multiple contexts from user input for compound understanding.
        """
        input_lower = user_input.lower()
        contexts = {}

        suicide_keywords = ["suicide", "kill myself", "end my life", "want to die", "live suicide", "commit suicide"]
        if any(keyword in input_lower for keyword in suicide_keywords):
            contexts['crisis'] = {'severity': 'high', 'type': 'suicide_risk'}

        job_keywords = ["lost job", "job loss", "unemployed", "fired", "laid off", "no job", "quit job", "job", "work", "employment"]
        if any(keyword in input_lower for keyword in job_keywords):
            contexts['job_loss'] = {'severity': 'medium', 'type': 'employment_crisis'}

        financial_keywords = ["money", "financial", "bills", "debt", "poor", "broke", "can't afford"]
        if any(keyword in input_lower for keyword in financial_keywords):
            contexts['financial'] = {'severity': 'medium', 'type': 'financial_stress'}

        relationship_keywords = ["relationship", "breakup", "divorce", "partner", "boyfriend", "girlfriend", "husband", "wife"]
        if any(keyword in input_lower for keyword in relationship_keywords):
            contexts['relationship'] = {'severity': 'medium', 'type': 'relationship_crisis'}

        mental_health_keywords = ["depressed", "anxious", "overwhelmed", "stress", "sad", "lonely"]
        if any(keyword in input_lower for keyword in mental_health_keywords):
            contexts['mental_health'] = {'severity': 'low', 'type': 'emotional_distress'}

        return contexts

    def generate_context_aware_crisis_response(self, user_input, detected_contexts):
        """
        Generate crisis response that acknowledges specific contexts.
        """
        base_response = """CRISIS ALERT: I'm extremely concerned about you!

IMMEDIATE COUNSELING SUPPORT:

What to do right now:
1. Stay calm and speak in a gentle, reassuring voice
2. Validate feelings: 'I can see how much pain you're in'
3. Listen without judgment - don't try to 'fix' everything
4. Remind them they're not alone: 'I'm here with you'
5. Focus on the present moment: 'Let's get through this together'

SUPPORTIVE PHRASES TO USE:
I'm here for you and I care about you
Your life matters and you are important
These feelings will pass, even if it doesn't feel like it
You are stronger than you think right now
Let's take this one moment at a time

IMMEDIATE SAFETY ACTIONS:
CALL 911 IMMEDIATELY if this is an emergency!
CONTACT SUICIDE HOTLINE: 988
CRISIS TEXT: Text HOME to 741741
Remove any means of harm if possible
Stay with the person - don't leave them alone

CALMING TECHNIQUES:
BREATHING: Inhale 4 seconds, hold 7, exhale 8 (repeat 3-4 times)
GROUNDING: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste

A crisis interface has opened automatically with more detailed guidance.
Your life matters and there is hope - help is available now!"""

        context_additions = []

        if 'job_loss' in detected_contexts:
            context_additions.append("""

JOB LOSS SUPPORT:
I hear that losing your job has made you feel hopeless. Job loss is one of life's most stressful events, but it does NOT define your worth or future.
Your skills and experience are still valuable. This is temporary - your life is permanent.

ADDITIONAL RESOURCES:
- National Career Development Association: 1-866-496-7332
- Unemployment Benefits: Contact your local unemployment office
- Financial Counseling: National Foundation for Credit Counseling - 1-800-388-2227
- Job Search Support: Indeed, LinkedIn, local job centers""")

        if 'financial' in detected_contexts:
            context_additions.append("""

FINANCIAL STRESS SUPPORT:
Financial stress can feel overwhelming, but there are solutions available.
Money problems are temporary and solvable. Your life is priceless.

FINANCIAL RESOURCES:
- 211 (United Way): Dial 2-1-1 for local financial assistance
- National Foundation for Credit Counseling: 1-800-388-2227
- Local food banks and housing assistance""")

        if 'relationship' in detected_contexts:
            context_additions.append("""

RELATIONSHIP CRISIS SUPPORT:
Relationship pain can feel devastating, but you will get through this.
Your worth is not determined by someone else's presence in your life.

RELATIONSHIP RESOURCES:
- National Domestic Violence Hotline: 1-800-799-7233
- Relationship Counseling: Psychology Today therapist finder
- Support groups: Meetup.com, local community centers""")

        if context_additions:
            full_response = base_response + "\n" + "\n".join(context_additions)
        else:
            full_response = base_response

        return full_response

    def generate_crisis_response(self, text, user_context=None):
        """
        Generate comprehensive crisis response with context awareness.
        """
        print("[CRISIS] Generating context-aware crisis response...")

        detected_contexts = self.extract_contexts(text)
        print(f"[CRISIS] Detected contexts: {list(detected_contexts.keys())}")

        response = self.generate_context_aware_crisis_response(text, detected_contexts)
        return response

    def chat(self, text, history=None):
        """
        Enhanced chat pipeline.
        """
        try:
            # STEP 1: Analyze input with all classifiers
            intent = self.predict_intent(text)
            emotion = self.predict_emotion(text)
            risk_label, risk_score = self.predict_risk(text)

            crisis_triggered = risk_label == "high_risk"

            print(f"\n[CHAT] Intent: {intent}, Emotion: {emotion}, Risk: {risk_label} ({risk_score:.3f})")

            # STEP 2: Crisis branch
            if crisis_triggered:
                print("[CRISIS BRANCH] High-risk input - generating empathetic crisis response")
                response_text = self.generate_simple_response(text, intent, emotion)

                return {
                    "response": response_text,
                    "analysis": {
                        "intent": intent,
                        "emotion": emotion,
                        "risk": {
                            "label": risk_label,
                            "score": float(risk_score),
                            "method": "ml_classifier",
                        },
                    },
                    "alert": True,
                    "crisis_triggered": True,
                    "validation_applied": True,
                    "models_used": {
                        "intent_detection": "trained_model" if self.model_status.get("intent") else "unavailable",
                        "emotion_detection": "trained_model" if self.model_status.get("emotion") else "unavailable",
                        "risk_detection": "trained_model" if self.model_status.get("risk") else "unavailable",
                        "response_generation": "trained_model" if self.model_status.get("response") else "unavailable",
                    },
                }

            # STEP 3: Normal branch
            print("[NORMAL BRANCH] Generating empathetic response")
            response_text = self.generate_simple_response(text, intent, emotion)

            return {
                "response": response_text,
                "analysis": {
                    "intent": intent,
                    "emotion": emotion,
                    "risk": {
                        "label": risk_label,
                        "score": float(risk_score),
                        "method": "ml_classifier",
                    },
                },
                "alert": False,
                "crisis_triggered": False,
                "validation_applied": True,
                "models_used": {
                    "intent_detection": "trained_model" if self.model_status.get("intent") else "unavailable",
                    "emotion_detection": "trained_model" if self.model_status.get("emotion") else "unavailable",
                    "risk_detection": "trained_model" if self.model_status.get("risk") else "unavailable",
                    "response_generation": "trained_model" if self.model_status.get("response") else "unavailable",
                },
            }

        except Exception as e:
            print(f"[CHAT ERROR] {e}")
            import traceback
            traceback.print_exc()

            return {
                "response": self.safe_fallback_response(),
                "analysis": {
                    "intent": "unknown",
                    "emotion": "neutral",
                    "risk": {
                        "label": "unknown",
                        "score": 0.0,
                        "method": "error",
                    },
                },
                "alert": False,
                "crisis_triggered": False,
                "validation_applied": False,
                "models_used": {
                    "intent_detection": "error",
                    "emotion_detection": "error",
                    "risk_detection": "error",
                    "response_generation": "error",
                },
            }

    def validate_response(self, response, intent, emotion, user_input=None):
        return validate_response_contract(response, intent, emotion, user_input=user_input)

    def get_model_status(self):
        return self.model_status


if __name__ == "__main__":
    print("Testing Fixed Model Loader")
    bot = FixedMentalHealthBot()

    print("\nTesting predictions:")
    test_texts = [
        "I feel very sad today",
        "Hello there",
        "I want to kill myself",
        "I'm feeling anxious about my exam",
    ]

    for text in test_texts:
        print(f"\nInput: {text}")
        intent = bot.predict_intent(text)
        emotion = bot.predict_emotion(text)
        risk, score = bot.predict_risk(text)
        print(f"Intent: {intent}, Emotion: {emotion}, Risk: {risk} ({score:.2f})")

    print("\nTesting full chat flow:")
    sample = bot.chat("I'm not feeling well", history=[])
    print(sample)
