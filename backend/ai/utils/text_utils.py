"""
Text utility functions for mental health chatbot.
Extracted from fixed_model_loader.py for maintainability.
Pure functions with no external dependencies.
"""

from ai.config.keywords import HELP_INDICATORS, INVALID_TOPICS


def override_intent(text, predicted_intent):
    """
    Override predicted intent with rule-based post-processing.

    Detects help-seeking patterns in user input and overrides misclassifications
    from stress/greeting/sadness to HELP intent.

    Args:
        text (str): User input text
        predicted_intent (str): Initial intent prediction from model

    Returns:
        str: Final intent (overridden or original)
    """
    text_lower = text.lower()

    # If explicit help patterns detected, override with HELP intent
    if any(pattern in text_lower for pattern in HELP_INDICATORS):
        if predicted_intent in ["stress", "greeting", "sadness"]:
            print(f"[POSTPROCESS] Help intent detected, overriding from {predicted_intent} -> help")
            return "help"

    return predicted_intent


def normalize_emotion(emotion):
    """
    Normalize fine-grained emotion labels to broader categories.

    Mapping:
    - grief, disappointment -> sadness
    - fear, nervousness -> anxiety
    - annoyance -> anger
    - joy, gratitude -> positive
    - All others -> return as-is

    Args:
        emotion (str): Original emotion label from classifier

    Returns:
        str: Normalized emotion category
    """
    emotion_lower = emotion.lower().strip()

    normalization_map = {
        # To sadness
        "grief": "sadness",
        "disappointment": "sadness",

        # To anxiety
        "fear": "anxiety",
        "nervousness": "anxiety",

        # To anger
        "annoyance": "anger",

        # To positive
        "joy": "positive",
        "gratitude": "positive",
        "admiration": "positive",
        "approval": "positive",
        "caring": "positive",
        "excitement": "positive",
        "love": "positive",
        "optimism": "positive",
        "pride": "positive",
        "relief": "positive",
    }

    normalized = normalization_map.get(emotion_lower, emotion_lower)
    if normalized != emotion_lower:
        print(f"[NORMALIZE] Emotion: {emotion} -> {normalized}")
    return normalized


def clean_response(response):
    """
    Clean and format response text.

    Removes:
    - Bot/Assistant/User prefixes
    - System prompt artifacts
    - Duplicate whitespace and punctuation
    - Repeated sentences

    Args:
        response (str): Raw response text from model

    Returns:
        str: Cleaned response text
    """
    if not response:
        return ""

    response = response.replace("Bot:", "").replace("Assistant:", "").replace("User:", "")
    response = response.replace("Human:", "").replace("AI:", "").replace("System:", "")
    response = response.replace("Response:", "")

    response = response.replace("You are a professional mental health support assistant.", "")
    response = response.replace("Strict Rules:", "")
    response = response.replace("- Only respond based on the user's message", "")
    response = response.replace("- Do NOT assume anything not mentioned", "")
    response = response.replace("- Do NOT add unrelated sentences", "")
    response = response.replace("- Do NOT repeat or generate random phrases", "")
    response = response.replace("- Keep response clear, short (2-3 sentences)", "")
    response = response.replace("- Use simple and natural language", "")
    response = response.replace("- Be empathetic and focused", "")
    response = response.replace("User message:", "")
    response = response.replace("User:", "")

    response = response.replace("Response:", "")

    response = response.replace("You are a professional mental health support assistant.", "")
    response = response.replace("Strict Rules:", "")
    response = response.replace("- Only respond based on the user's message", "")
    response = response.replace("- Do NOT assume anything not mentioned", "")
    response = response.replace("- Do NOT add unrelated sentences", "")
    response = response.replace("- Do NOT repeat or generate random phrases", "")
    response = response.replace("- Keep response clear, short", "")
    response = response.replace("- Use simple and natural language", "")
    response = response.replace("- Be empathetic and focused", "")

    response = response.replace("\n\n", "\n").replace("\n", " ")
    response = " ".join(response.split())

    words = response.split()
    cleaned_words = []
    prev_word = None

    for word in words:
        if word != prev_word:
            cleaned_words.append(word)
        prev_word = word

    result = ' '.join(cleaned_words)

    sentences = []
    for sentence in result.split('.'):
        sentence = sentence.strip()
        if sentence and sentence not in sentences:
            sentences.append(sentence)

    result = '. '.join(sentences)
    result = ' '.join(result.split())
    result = result.replace('..', '.').replace('!!', '!').replace('??', '?')

    if result and not result.endswith(('.', '!', '?')):
        result += '.'

    return result.strip()
