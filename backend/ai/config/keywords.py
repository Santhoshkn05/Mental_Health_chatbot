"""
Keyword lists and patterns for mental health validation and intent detection.
Extracted from fixed_model_loader.py for maintainability.
"""

# Help-seeking indicators for intent override (from override_intent method)
HELP_INDICATORS = [
    "i need help", "need help", "help me",
    "can you help", "please help",
    "struggling", "i'm struggling",
    "i need support", "need support",
    "don't know what to do",
    "what should i do",
    "what can i do",
    "how can i",
    "tell me what to do",
    "i need advice",
    "please advise",
    "what do i do"
]

# Mental health keywords for input validation (from is_relevant_input method)
MENTAL_HEALTH_KEYWORDS = [
    "help", "support", "talk", "counseling", "therapy",
    "feeling", "feel", "emotions", "emotional", "mental",
    "struggling", "struggle", "difficult", "hard", "tough",
    "pain", "hurt", "suffering", "painful", "ache",
    "tired", "exhausted", "burnout", "fatigue",
    "sleep", "insomnia", "nightmare", "restless",
    "appetite", "eating", "food", "weight", "body",
    "concentration", "focus", "memory", "thinking",
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

# Crisis indicators (from is_relevant_input method)
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "kill", "die", "death", "end", "harm",
    "crisis", "emergency", "don't want to live", "can't live anymore",
    "want to end it", "better off dead", "not worth living"
]

# Invalid topics that should not be discussed (from is_response_good method)
INVALID_TOPICS = [
    "activist", "politics", "political", "government",
    "election", "country", "national", "international"
]

# Job-related keywords (from is_response_good and fallback branches)
JOB_RELATED_KEYWORDS = [
    "job search", "resume", "interview", "career", "training", "education",
    "apply for", "find a job", "new job", "job opportunities", "skills",
    "unemployment", "benefits", "financial", "money", "budget", "savings"
]
