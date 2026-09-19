"""Response validation shared by every non-crisis generation path."""

import re


def is_response_good(response, user_input, intent=None, emotion=None):
    """Apply the complete response validation rules used by the bot."""
    try:
        response_lower = (response or "").lower().strip()
        user_lower = (user_input or "").lower().strip()

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

        if emotion:
            emotion_lower = emotion.lower()
            negative_emotions = ["sadness", "anxiety", "grief", "fear", "anger", "nervousness"]
            positive_words = ["understand", "sorry", "here", "support", "help", "listen", "care"]
            if any(neg_emot in emotion_lower for neg_emot in negative_emotions):
                if not any(pos_word in response_lower for pos_word in positive_words):
                    print(f"[VALIDATION] Negative emotion '{emotion}' detected but response lacks supportive tone -> REJECT")
                    return False

        user_tokens = set(re.findall(r"\b\w+\b", user_lower))
        response_tokens = set(re.findall(r"\b\w+\b", response_lower))
        stopwords = {
            "i", "am", "is", "are", "the", "a", "an", "and", "or", "to", "of",
            "in", "on", "for", "with", "my", "me", "you", "your", "it", "that",
            "this", "be", "have", "has", "was", "were", "not", "so", "do", "did",
            "can", "will", "would", "could", "should", "if", "then", "by", "at",
            "from", "its", "their", "as", "but", "they", "we", "our", "just"
        }
        user_keywords = {word for word in user_tokens if word not in stopwords and len(word) > 2}
        response_keywords = {word for word in response_tokens if word not in stopwords and len(word) > 2}
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
    except Exception as error:
        print(f"[VALIDATION] Validation error: {error}")
        return False


def validate_response(response, intent, emotion, user_input=None):
    """Return the legacy validation tuple using the complete validator."""
    if is_response_good(response, user_input or "", intent, emotion):
        return True, "Response is valid"
    return False, "Response failed validation"
