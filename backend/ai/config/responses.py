"""
Response templates and empathy phrases for mental health chatbot.
Extracted from fixed_model_loader.py for maintainability.
"""

# Emotion-specific empathy responses used in refine_response()
EMPATHY_RESPONSES = {
    'sadness': [
        "I can hear how much pain you're in right now, and I want you to know that your feelings are completely valid.",
        "It sounds like you're carrying a heavy weight of sadness. I'm here to sit with you in this difficult moment.",
        "I can feel the depth of your sadness, and I want you to know you don't have to face this alone."
    ],
    'anxiety': [
        "I can sense how overwhelming this anxiety must feel for you. Let's take this one breath at a time together.",
        "Your anxiety sounds really intense right now. I'm here to help you find some grounding in this moment.",
        "I hear how much this anxiety is affecting you. You're showing incredible strength by reaching out."
    ],
    'stress': [
        "I can see how much stress you're under right now. It makes complete sense that you're feeling overwhelmed.",
        "The pressure you're describing sounds incredibly difficult. You don't have to carry all of this by yourself.",
        "I can hear how stressed and exhausted you must be. Let's work together to find some relief."
    ],
    'anger': [
        "I can hear the frustration and anger in your voice. These feelings are telling us something important needs attention.",
        "Your anger makes complete sense given what you're going through. I'm here to help you process these intense emotions.",
        "I can feel how powerful this anger is for you. Let's explore what's underneath these strong feelings."
    ],
    'fear': [
        "I can hear how scared you are right now. Fear like this can feel overwhelming, but you don't have to face it alone.",
        "Your fear sounds really intense and valid. I'm here with you to help you feel safer in this moment.",
        "I can sense how much this fear is affecting you. You're brave for sharing something so vulnerable."
    ],
    'hopelessness': [
        "I can hear how hopeless and defeated you're feeling. Even in this darkness, I want you to know there's still hope.",
        "The hopelessness you're describing sounds incredibly painful. I'm here to hold hope for you until you can feel it again.",
        "I can feel the weight of this hopelessness you're carrying. You're not alone in this feeling, even if it seems that way."
    ],
    'neutral': [
        "Thank you for sharing this with me. I'm here to listen and support you through whatever you're experiencing.",
        "I appreciate you opening up about this. I'm here to help you navigate whatever challenges you're facing.",
        "I'm grateful that you trust me enough to share this. Let's work together to find the support you need."
    ]
}

# Follow-up questions by emotion for conversation continuation
FOLLOW_UP_QUESTIONS = {
    'sadness': [
        "What specifically is making you feel this sadness right now?",
        "How long have you been carrying these feelings of sadness?",
        "Is there someone in your life who knows about this sadness you're experiencing?"
    ],
    'anxiety': [
        "What specifically is triggering this anxiety for you right now?",
        "Have you noticed any physical sensations that come with this anxiety?",
        "What has helped you manage anxiety in the past, even a little bit?"
    ],
    'stress': [
        "What feels like the biggest source of this stress right now?",
        "How is this stress affecting your daily life and relationships?",
        "What would it look like if you could reduce this stress by even 10%?"
    ],
    'default': [
        "Can you tell me more about what's been happening that led to this feeling?",
        "How long have you been experiencing this, and what makes it better or worse?",
        "What kind of support would feel most helpful to you right now?",
        "Is there anything specific you'd like to explore about this feeling?"
    ]
}

# Phrases that indicate substantial empathy in responses
EMPATHY_INDICATORS = [
    "i can hear", "i can feel", "i can see", "i understand how",
    "i want you to know", "you're not alone", "i'm here to",
    "it makes sense", "completely valid"
]
