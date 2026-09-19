# Fixed Model Loader Architecture Report

## 1. High Level Overview

### Purpose
`fixed_model_loader.py` is a **Mental Health Conversational AI System** that provides empathetic, validated responses to users seeking emotional support. It acts as a wrapper around multiple transformer models for classification and response generation, with built-in safety mechanisms for crisis detection.

### Core Pipeline
The system implements an **AI Inference Pipeline** that:
1. **Loads** 5-6 transformer models at initialization
2. **Classifies** user input for intent, emotion, and suicide risk
3. **Validates** input relevance and safety
4. **Routes** to appropriate response generator (Qwen, DialoGPT, or rule-based)
5. **Generates** empathetic, context-aware responses
6. **Validates** output for quality and hallucinations
7. **Refines** responses for natural tone and empathy
8. **Returns** analyzed response with metadata

### Flow: User Message → Response
```
User Input
   ↓
[INITIALIZATION] Load all models (intent, emotion, risk, response, Qwen)
   ↓
[VALIDATION] Check if input is relevant and safe
   ↓
[CLASSIFICATION]
   ├─ predict_intent(text) → intent label
   ├─ predict_emotion(text) → normalized emotion
   └─ predict_risk(text) → risk_label + risk_score
   ↓
[ROUTING]
   ├─ IF high_risk → generate_crisis_response()
   └─ ELSE → generate_simple_response()
   ↓
[GENERATION]
   ├─ Try Qwen model first
   ├─ Fall back to DialoGPT
   ├─ Fall back to rule-based
   └─ Fall back to safe_fallback_response()
   ↓
[QUALITY CHECKS]
   ├─ is_meaningful() → Check quality
   ├─ detect_hallucination() → Check artifacts
   └─ is_response_good() → Validate empathy/relevance
   ↓
[REFINEMENT]
   └─ refine_response() → Add empathy + follow-up
   ↓
[RETURN] Validated response + analysis metadata
```

---

## 2. Class Diagram

### **FixedMentalHealthBot** (Main Class)

**Purpose**: Central orchestrator for all AI inference operations. Manages model lifecycle, classification, response generation, and validation.

**Constructor**: `__init__(model_name="esconv-dialo-final")`
- Initializes device (CUDA/MPS/CPU)
- Loads all 5 models asynchronously
- Sets model_status tracking

**Attributes**:
- `device`: torch.device (CUDA/MPS/CPU)
- `intent_model`, `emotion_model`, `risk_model`: Classification models
- `resp_model`, `resp_tokenizer`: Response generation model
- `qwen_model`, `qwen_tokenizer`: Backup generation model
- `model_status`: dict tracking which models loaded successfully
- `model_paths`: dict of model file locations
- `current_model`: string name of response model in use

**Key Methods**:

| Method | Purpose |
|--------|---------|
| `_get_device()` | Auto-detect GPU/CPU availability |
| `_load_intent_model()` | Load intent classification model |
| `_load_emotion_model()` | Load emotion classification model |
| `_load_risk_model()` | Load suicide risk detection model |
| `_load_response_model()` | Load DialoGPT with fallback chain |
| `_load_qwen()` | Load Qwen2.5 for backup generation |
| `predict_intent(text)` | Classify user intent, apply overrides |
| `predict_emotion(text)` | Classify emotion, normalize to broad categories |
| `predict_risk(text)` | ML + keyword-based suicide risk detection |
| `is_relevant_input(text, has_context)` | Validate input relevance for MH support |
| `is_response_good(response, user_input, intent, emotion)` | Comprehensive response validator |
| `generate_simple_response(context, intent, emotion, history)` | Main response generator with fallbacks |
| `chat(text, history)` | High-level interface for API calls |
| `refine_response(user_input, response, emotion)` | Add empathy, follow-up questions |
| `clean_response(response)` | Remove artifacts, clean formatting |
| `is_meaningful(response, user_input)` | Detect hallucinations and quality issues |
| `detect_hallucination(response, user_input)` | Score hallucination probability |
| `override_intent(text, predicted_intent)` | Post-process intent predictions |
| `normalize_emotion(emotion)` | Map fine-grained emotions to broad categories |
| `validate_response(response, intent, emotion)` | Simple validation wrapper |
| `get_model_status()` | Return model status dict |

---

## 3. Method Inventory

### **Model Loading Methods**

#### `_get_device()`
- **Inputs**: None
- **Outputs**: `torch.device` (cuda, mps, or cpu)
- **Side Effects**: Prints GPU/CPU availability to console
- **Who Calls It**: `__init__()` at startup
- **Calls**: PyTorch internals (`torch.cuda.is_available()`, etc.)

#### `_load_intent_model()`
- **Inputs**: None
- **Outputs**: None (sets `self.intent_model`, `self.intent_tokenizer`, `self.model_status['intent']`)
- **Side Effects**: Loads model from disk, runs test prediction, prints logs
- **Who Calls It**: `__init__()`
- **Calls**: `AutoTokenizer.from_pretrained()`, `AutoModelForSequenceClassification.from_pretrained()`, `predict_intent()`

#### `_load_emotion_model()`
- **Inputs**: None
- **Outputs**: None (sets `self.emotion_model`, etc.)
- **Side Effects**: Loads model, runs test prediction
- **Who Calls It**: `__init__()`
- **Calls**: `AutoTokenizer.from_pretrained()`, `AutoModelForSequenceClassification.from_pretrained()`, `predict_emotion()`

#### `_load_risk_model()`
- **Inputs**: None
- **Outputs**: None (sets `self.risk_model`, etc.)
- **Side Effects**: Loads model, runs test prediction
- **Who Calls It**: `__init__()`
- **Calls**: `AutoTokenizer.from_pretrained()`, `AutoModelForSequenceClassification.from_pretrained()`, `predict_risk()`

#### `_load_response_model()`
- **Inputs**: None
- **Outputs**: None (sets `self.resp_model`, `self.resp_tokenizer`, `self.response_model_name`)
- **Side Effects**: Tries 4 models in fallback chain, fallsback to GPT2
- **Who Calls It**: `__init__()`
- **Calls**: `AutoTokenizer.from_pretrained()`, `AutoModelForCausalLM.from_pretrained()`

#### `_load_qwen()`
- **Inputs**: None
- **Outputs**: None (sets `self.qwen_model`, `self.qwen_tokenizer`)
- **Side Effects**: Loads Qwen or fallsback to HuggingFace
- **Who Calls It**: `__init__()`
- **Calls**: `AutoTokenizer.from_pretrained()`, `AutoModelForCausalLM.from_pretrained()`

---

### **Classification Methods**

#### `predict_intent(text)`
- **Inputs**: `text` (str)
- **Outputs**: `intent` (str, e.g., "help", "stress", "sadness")
- **Side Effects**: Runs ML inference, prints debug logs
- **Who Calls It**: `generate_simple_response()`, `chat()`, Flask `/chat` endpoint
- **Calls**: `override_intent()`, tokenizer, intent_model

#### `override_intent(text, predicted_intent)`
- **Inputs**: `text` (str), `predicted_intent` (str)
- **Outputs**: `intent` (str, possibly overridden)
- **Side Effects**: Prints override logs
- **Who Calls It**: `predict_intent()`
- **Calls**: None (pure regex pattern matching)

#### `predict_emotion(text)`
- **Inputs**: `text` (str)
- **Outputs**: `emotion` (str, e.g., "sadness", "anxiety", "positive")
- **Side Effects**: Runs ML inference, normalizes output
- **Who Calls It**: `generate_simple_response()`, `chat()`
- **Calls**: `normalize_emotion()`, tokenizer, emotion_model

#### `normalize_emotion(emotion)`
- **Inputs**: `emotion` (str)
- **Outputs**: `normalized_emotion` (str)
- **Side Effects**: Maps fine-grained emotions to broad categories
- **Who Calls It**: `predict_emotion()`
- **Calls**: None (pure mapping)

#### `predict_risk(text)`
- **Inputs**: `text` (str)
- **Outputs**: `(risk_label, risk_score)` tuple
  - `risk_label`: "high_risk", "moderate_risk", or "low_risk"
  - `risk_score`: float 0.0-1.0
- **Side Effects**: Runs ML inference + keyword matching, prints analysis logs
- **Who Calls It**: `generate_simple_response()`, `chat()`
- **Calls**: tokenizer, risk_model

---

### **Validation Methods**

#### `is_relevant_input(text, has_context=False)`
- **Inputs**: `text` (str), `has_context` (bool)
- **Outputs**: `True/False` or dict with clarification/crisis response
- **Side Effects**: Checks for mental health keywords, crisis indicators
- **Who Calls It**: Flask `/chat` endpoint in `PRODUCTION_READY_FLASK.py`
- **Calls**: None (pure regex/keyword matching)

**Logic**:
1. Check for crisis keywords → return crisis response dict
2. If has_context=True → return True (bypass filter)
3. If word_count ≤ 2 → ask clarification
4. Check for mental health keywords → reject if none found

#### `is_response_good(response, user_input, intent=None, emotion=None)`
- **Inputs**: `response` (str), `user_input` (str), `intent` (str), `emotion` (str)
- **Outputs**: `True/False`
- **Side Effects**: Prints validation checks
- **Who Calls It**: `generate_simple_response()` (removed in favor of `is_meaningful()`)
- **Calls**: None (pure text analysis)

**Checks**:
1. Response length (min 4-8 words, max 80)
2. Self-reference phrases (reject if mentions job/role without empathy)
3. Empathy enforcement (if user distressed, response must have empathy words)
4. Intent-aware validation (help, stress, sadness)
5. Emotion-aware validation
6. Keyword overlap/relevance
7. Invalid topics (politics, etc.)

#### `is_meaningful(response, user_input)`
- **Inputs**: `response` (str), `user_input` (str)
- **Outputs**: `True/False`
- **Side Effects**: Prints quality checks
- **Who Calls It**: `generate_simple_response()`
- **Calls**: `detect_hallucination()`

**Checks**:
1. Response length ≥ 6 chars
2. Known hallucination patterns
3. ESCONV model artifacts
4. Job-related repetition
5. Word repetition (>3x same word)
6. Irrelevant phrases
7. Generic responses
8. Keyword overlap with user input

#### `detect_hallucination(response, user_input)`
- **Inputs**: `response` (str), `user_input` (str)
- **Outputs**: `(is_hallucinated, hallucination_score, reasons)` tuple
- **Side Effects**: Prints hallucination analysis
- **Who Calls It**: `is_meaningful()`, `generate_simple_response()`
- **Calls**: None (pure regex/analysis)

**Detects**:
1. Fragmented text patterns
2. Technical artifacts (tokenizer, embeddings, etc.)
3. Incoherent sentences
4. Excessive repetition
5. Lack of mental health content

---

### **Response Generation Methods**

#### `generate_simple_response(context, intent, emotion, history=None)`
- **Inputs**: 
  - `context` (str): Full conversation + current message
  - `intent` (str): Detected intent
  - `emotion` (str): Detected emotion
  - `history` (list): Conversation history
- **Outputs**: `response` (str)
- **Side Effects**: Runs model inference, may save fallback responses
- **Who Calls It**: `chat()`, Flask service
- **Calls**: 
  - `predict_risk()` → crisis detection
  - `generate_crisis_response()` if high risk
  - `_generate_with_qwen_fallback()` (primary)
  - Model generation + `is_meaningful()` + `detect_hallucination()`
  - `clean_response()`, `refine_response()`
  - Fallback: `comprehensive_rule_based_response()`, `simple_fallback_response()`

**Pipeline**:
1. Extract current user input from context
2. Predict risk → if high, generate crisis response
3. Try Qwen generation
4. Fall back to DialoGPT with retries
5. Validate with `is_meaningful()` and `detect_hallucination()`
6. If valid, refine and return
7. If invalid, retry up to max_retries
8. If all fail, use comprehensive rule-based fallback

#### `chat(text, history=None)`
- **Inputs**: `text` (str), `history` (list, optional)
- **Outputs**: dict with keys:
  - `response` (str)
  - `analysis` (dict): intent, emotion, risk
  - `alert` (bool)
  - `crisis_triggered` (bool)
  - `validation_applied` (bool)
  - `models_used` (dict)
- **Side Effects**: Runs full classification pipeline
- **Who Calls It**: Flask service
- **Calls**: 
  - `predict_intent()`, `predict_emotion()`, `predict_risk()`
  - `generate_simple_response()`
  - `generate_crisis_response()`

---

### **Refinement & Fallback Methods**

#### `refine_response(user_input, response, emotion)`
- **Inputs**: `user_input` (str), `response` (str), `emotion` (str)
- **Outputs**: `refined_response` (str)
- **Side Effects**: Adds empathy phrases, follow-up questions
- **Who Calls It**: `generate_simple_response()`
- **Calls**: `_refine_with_qwen()` (if available), random selection

**Logic**:
1. If Qwen available, try refinement with Qwen
2. Otherwise, add emotion-specific empathy response
3. Add context-specific follow-up question

#### `_refine_with_qwen(user_input, response, emotion)`
- **Inputs**: `user_input` (str), `response` (str), `emotion` (str)
- **Outputs**: `refined_response` (str)
- **Side Effects**: Runs Qwen inference for refinement
- **Who Calls It**: `refine_response()`
- **Calls**: Qwen tokenizer + model

#### `_generate_with_qwen_fallback(user_input, emotion, intent)`
- **Inputs**: `user_input` (str), `emotion` (str), `intent` (str)
- **Outputs**: `generated_response` (str)
- **Side Effects**: Generates complete response with Qwen
- **Who Calls It**: `generate_simple_response()`, `refine_response()`
- **Calls**: Qwen tokenizer + model

#### `comprehensive_rule_based_response(user_input, emotion, intent)`
- **Inputs**: `user_input` (str), `emotion` (str), `intent` (str)
- **Outputs**: `response` (str)
- **Side Effects**: Selects rule-based response from templates
- **Who Calls It**: `generate_simple_response()`
- **Calls**: `emotional_job_loss_fallback()` (if applicable)

**Logic**: Pattern-match on user input, return appropriate template response

#### `simple_fallback_response(user_input, emotion)`
- **Inputs**: `user_input` (str), `emotion` (str)
- **Outputs**: `response` (str)
- **Side Effects**: Returns emotion-specific empathetic response
- **Who Calls It**: `generate_simple_response()`
- **Calls**: None (pure dict lookup)

#### `emotional_job_loss_fallback(user_input, emotion)`
- **Inputs**: `user_input` (str), `emotion` (str)
- **Outputs**: `response` (str)
- **Side Effects**: Returns job-loss-specific response
- **Who Calls It**: `comprehensive_rule_based_response()`
- **Calls**: None (pure dict lookup)

#### `safe_fallback_response()`
- **Inputs**: None
- **Outputs**: `response` (str)
- **Side Effects**: None
- **Who Calls It**: `generate_simple_response()`, `chat()`
- **Calls**: None

Returns: `"I'm here to listen. Can you tell me a little more about what's bothering you?"`

#### `irrelevant_topic_response()`
- **Inputs**: None
- **Outputs**: `response` (str)
- **Side Effects**: None
- **Who Calls It**: Unused in current code
- **Calls**: None

Returns: `"I'm sorry, I didn't understand that. I'm here to help with mental health and emotional support."`

#### `crisis_fallback_response(user_input="", risk_score=0.0, user_context=None)`
- **Inputs**: `user_input` (str), `risk_score` (float), `user_context` (dict, optional)
- **Outputs**: `response` (str)
- **Side Effects**: Triggers crisis alerts if crisis_system available
- **Who Calls It**: Unused in current code (replaced by `generate_crisis_response()`)
- **Calls**: `trigger_crisis_response()`, `get_crisis_resources()` (if CRISIS_SYSTEM_AVAILABLE)

---

### **Text Processing Methods**

#### `clean_response(response)`
- **Inputs**: `response` (str)
- **Outputs**: `cleaned_response` (str)
- **Side Effects**: None
- **Who Calls It**: `generate_simple_response()`
- **Calls**: None (pure string manipulation)

**Removes**:
- "Bot:", "Assistant:", "User:", etc. prefixes
- System prompts
- Duplicate newlines/spaces
- Duplicate sentences
- Multiple punctuation

#### `extract_contexts(user_input)`
- **Inputs**: `user_input` (str)
- **Outputs**: `contexts` dict with keys like "crisis", "job_loss", "financial", "relationship"
- **Side Effects**: None
- **Who Calls It**: `generate_context_aware_crisis_response()`
- **Calls**: None (pure keyword matching)

---

### **Crisis Response Methods**

#### `generate_crisis_response(text, user_context=None)`
- **Inputs**: `text` (str), `user_context` (dict, optional)
- **Outputs**: `response` (str)
- **Side Effects**: Logs crisis detection
- **Who Calls It**: `generate_simple_response()`
- **Calls**: `extract_contexts()`, `generate_context_aware_crisis_response()`

#### `generate_context_aware_crisis_response(user_input, detected_contexts)`
- **Inputs**: `user_input` (str), `detected_contexts` (dict)
- **Outputs**: `response` (str)
- **Side Effects**: None
- **Who Calls It**: `generate_crisis_response()`
- **Calls**: None (pure string concatenation)

Returns base crisis response + context-specific additions (job loss, financial, relationship support)

---

### **Utility Methods**

#### `validate_response(response, intent, emotion)`
- **Inputs**: `response` (str), `intent` (str), `emotion` (str)
- **Outputs**: `(is_valid, message)` tuple
- **Side Effects**: None
- **Who Calls It**: Unused (deprecated)
- **Calls**: None

#### `get_model_status()`
- **Inputs**: None
- **Outputs**: `self.model_status` dict
- **Side Effects**: None
- **Who Calls It**: Flask health check endpoint
- **Calls**: None

#### `validate_with_phi3(user_input, response, emotion)`
- **Inputs**: `user_input` (str), `response` (str), `emotion` (str)
- **Outputs**: `(is_valid, score, feedback)` tuple
- **Side Effects**: Runs Phi3 inference
- **Who Calls It**: Never (Phi3 model never loaded)
- **Calls**: phi3_tokenizer, phi3_model (if they existed)

---

## 4. AI Pipeline

### **User Message Flow Through Code**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT ARRIVES AT FLASK /chat ENDPOINT                           │
│    (in PRODUCTION_READY_FLASK.py)                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. INPUT VALIDATION                                                      │
│    is_relevant_input(user_message, has_context=False)                   │
│    ├─ Check for crisis keywords                                         │
│    ├─ Check for mental health keywords                                  │
│    └─ Ask clarification if too short                                    │
│                                                                          │
│    If REJECTED: Return error response                                   │
│    If CRISIS: Return special crisis response dict                       │
│    If VALID: Continue to classification                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. CLASSIFICATION (3 Parallel Models)                                   │
│                                                                          │
│    A. INTENT DETECTION                                                  │
│       predict_intent(text)                                              │
│       ├─ Intent Classification Model                                    │
│       ├─ Apply override_intent() for help-seeking patterns              │
│       └─ Return: intent label (e.g., "stress", "help", "sadness")      │
│                                                                          │
│    B. EMOTION DETECTION                                                 │
│       predict_emotion(text)                                             │
│       ├─ Emotion Classification Model (28 classes)                      │
│       ├─ Normalize to broad categories                                  │
│       └─ Return: emotion label (e.g., "anxiety", "sadness")            │
│                                                                          │
│    C. RISK DETECTION                                                    │
│       predict_risk(text)                                                │
│       ├─ ML Risk Classification Model                                   │
│       ├─ Keyword-based pattern matching                                 │
│       ├─ Sanity check: ML + keyword fusion                              │
│       └─ Return: (risk_label, risk_score)                              │
│          - "high_risk" (suicide indicators)                             │
│          - "moderate_risk" (high ML but no keywords)                    │
│          - "low_risk" (normal)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. CRISIS ROUTING DECISION                                              │
│                                                                          │
│    IF risk_label == "high_risk" AND risk_score > 0.6:                  │
│       └─ Route to generate_crisis_response()                            │
│    ELSE:                                                                │
│       └─ Route to generate_simple_response()                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
        ┌───────────────────────┬──────────────────────┐
        ↓ CRISIS BRANCH         ↓ NORMAL BRANCH        
        
┌──────────────────────┐  ┌──────────────────────────────────┐
│ CRISIS RESPONSE      │  │ generate_simple_response()       │
│ ─────────────────    │  │ ────────────────────────         │
│ generate_crisis_     │  │ 5A. BUILD CONTEXT               │
│ response()           │  │     Extract current_input from   │
│ ├─ Extract contexts  │  │     full context string          │
│ ├─ Add job/financial │  │                                  │
│ │  support           │  │ 5B. GENERATE RESPONSE            │
│ ├─ Add safety hotlines    │ │     Try Qwen first:            │
│ └─ Return detailed   │  │     └─ Qwen generation with chat │
│   crisis response    │  │        template                  │
│                      │  │     Fall back to DialoGPT:       │
└──────────────────────┘  │     ├─ Build prompt: "User: ... │
                          │     │  \nAssistant:"             │
                          │     ├─ Tokenize and generate     │
                          │     ├─ Decode output             │
                          │     └─ Max retries: 2            │
                          │                                  │
                          │ 5C. QUALITY VALIDATION           │
                          │     ├─ is_meaningful()           │
                          │     │  (check hallucinations)    │
                          │     ├─ detect_hallucination()    │
                          │     │  (score from 0-1)          │
                          │     └─ If invalid, retry         │
                          │                                  │
                          │ 5D. REFINEMENT                   │
                          │     refine_response()            │
                          │     ├─ Try Qwen refinement       │
                          │     ├─ Add empathy phrases       │
                          │     ├─ Add follow-up question    │
                          │     └─ Return refined response   │
                          │                                  │
                          │ 5E. FALLBACK CASCADE             │
                          │     IF quality fails:            │
                          │     ├─ Qwen fallback            │
                          │     ├─ Rule-based fallback      │
                          │     ├─ Job loss fallback        │
                          │     ├─ Simple fallback          │
                          │     └─ Safe fallback            │
└──────────────────────────────────────────────────────────┘
        │
        └──────────────────┬─────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 6. BUILD RESPONSE METADATA & RETURN TO FLASK             │
│                                                          │
│    Return dict with:                                    │
│    ├─ response: str (the actual response text)          │
│    ├─ analysis: {                                       │
│    │   intent: str,                                     │
│    │   emotion: str,                                    │
│    │   risk: { label, score, method }                   │
│    │ }                                                  │
│    ├─ alert: bool (show warning badge to user)         │
│    ├─ crisis_triggered: bool                            │
│    ├─ validation_applied: bool                          │
│    └─ models_used: { intent_model, emotion_model, ... } │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 7. FLASK /chat ENDPOINT RECEIVES RESPONSE                │
│    ├─ Serializes to JSON                                │
│    └─ Returns to Node.js backend                        │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 8. NODE.JS BACKEND (chat.service.js)                     │
│    ├─ Extracts response.message                         │
│    ├─ Saves to MySQL database                           │
│    └─ Returns to React frontend                         │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 9. REACT FRONTEND (ChatWindow.js)                        │
│    ├─ Adds message to chat history                      │
│    ├─ Shows analysis badges (intent, emotion, risk)     │
│    ├─ If crisis_triggered: Show alert                   │
│    └─ Display message in chat UI                        │
└──────────────────────────────────────────────────────────┘
```

**Functions involved by stage**:

| Stage | Functions |
|-------|-----------|
| Input Validation | `is_relevant_input()` |
| Classification | `predict_intent()`, `predict_emotion()`, `predict_risk()` |
| Routing | `predict_risk()` (checks risk_label) |
| Generation | `generate_simple_response()`, `generate_crisis_response()`, `_generate_with_qwen_fallback()`, `clean_response()`, `refine_response()` |
| Quality Check | `is_meaningful()`, `detect_hallucination()` |
| Fallback | `comprehensive_rule_based_response()`, `simple_fallback_response()`, `safe_fallback_response()` |
| Return | `chat()` returns dict |

---

## 5. Context Handling

### **Where Context/History is Processed**

#### **1. Conversation Context Building**
- **Location**: `generate_simple_response(context, intent, emotion, history)`
- **What it does**: 
  - Takes full context string (built by Flask)
  - Extracts the current user message from end of context
  - Uses reversed line iteration to find last "User:" line
- **Code**:
  ```python
  lines = context.strip().split('\n')
  for line in reversed(lines):
      if line.startswith("User:"):
          current_input = line.replace("User:", "").strip()
          break
  ```

#### **2. Qwen Refinement with History**
- **Location**: `_refine_with_qwen(user_input, response, emotion)`
- **What it does**:
  - Applies chat template with system + user message
  - Uses Qwen to refine/improve response tone
  - Does NOT use full conversation history
  - Only refines the generated response, not context-aware generation
- **Code**:
  ```python
  messages = [
      {"role": "system", "content": "You are empathetic..."},
      {"role": "user", "content": f"User message: '{user_input}'\nDraft response: '{response}'"}
  ]
  ```

#### **3. Qwen Generation with History**
- **Location**: `_generate_with_qwen_fallback(user_input, emotion, intent)`
- **What it does**:
  - Uses only current user message (NOT full history)
  - System message emphasizes brevity and empathy
  - Generates standalone response
- **Code**:
  ```python
  messages = [
      {"role": "system", "content": "You are empathetic MH assistant..."},
      {"role": "user", "content": user_input}
  ]
  ```

#### **4. DialoGPT Generation (No History)**
- **Location**: `generate_simple_response()` → DialoGPT section
- **What it does**:
  - Builds prompt: `"User: {current_input}\nAssistant:"`
  - Uses ONLY current user message
  - Does NOT pass `history` to model
- **Code**:
  ```python
  prompt = f"User: {current_input}{self.resp_tokenizer.eos_token}Assistant:"
  inputs = self.resp_tokenizer(prompt, return_tensors="pt", ...)
  ```

#### **5. Context-Aware Classification**
- **Location**: `predict_intent()`, `predict_emotion()`
- **What it does**:
  - These receive full context string (conversation built by Flask)
  - Uses entire context for intent/emotion classification
  - Different from response generation which uses current message
- **Purpose**: Better intent/emotion understanding with conversation flow
- **Code**:
  ```python
  # Intent uses FULL context
  context = "User: I'm stressed\nAssistant: ...\nUser: it's about work\nAssistant:"
  intent = bot.predict_intent(context)
  ```

#### **6. Risk Detection (Current Message Only)**
- **Location**: `predict_risk(text)`
- **What it does**:
  - ONLY analyzes current user message, not history
  - Prevents false positives from assistant's "help" keywords
  - This is intentional to avoid triggering on conversations about help-seeking
- **Code**:
  ```python
  # Risk analysis uses ONLY current_input, not full context
  risk_label, risk_score = predict_risk(user_input)
  ```

#### **7. Validation (Current Message Only)**
- **Location**: `is_relevant_input(text, has_context)`
- **What it does**:
  - `has_context=True`: If conversation exists, bypass keyword filter
  - `has_context=False`: If first message, apply strict keyword filter
  - **Purpose**: Allow natural follow-up conversations while validating first message
- **Code**:
  ```python
  if has_context:
      print("[CONTEXT] Conversation established - bypassing keyword filter")
      return True
  # Otherwise check keywords...
  ```

#### **8. Context Extraction for Crisis Response**
- **Location**: `extract_contexts(user_input)`
- **What it does**:
  - Searches for keywords related to: crisis, job loss, financial, relationship, mental health
  - Only analyzes current message, not history
  - Adds context-specific support to crisis response
- **Code**:
  ```python
  if any(keyword in input_lower for keyword in ["lost job", "job loss", "fired"]):
      contexts['job_loss'] = {'severity': 'medium', ...}
  ```

### **Summary: History Usage**

| Component | Uses Full Context? | Uses History? | Purpose |
|-----------|-------------------|---------------|---------|
| `is_relevant_input()` | Current message only | No | First-msg validation |
| `predict_intent()` | Full context | Implicit | Better classification |
| `predict_emotion()` | Full context | Implicit | Better classification |
| `predict_risk()` | Current message only | No | Avoid false positives |
| `generate_simple_response()` | Current message | Parameter passed, not used | Future extensibility |
| `_generate_with_qwen_fallback()` | Current message | No | Standalone generation |
| `refine_response()` | Current message + response | No | Response refinement |
| `extract_contexts()` | Current message | No | Crisis context |

---

## 6. Model Loading

### **Intent Model Loading**

**Where**: `_load_intent_model()`

**Process**:
1. Load tokenizer from `models/intent_detection/final-intent-model`
2. Load classification model (AutoModelForSequenceClassification)
3. Move to device (CUDA/CPU)
4. Set to eval mode
5. Read id2label from model.config (to match actual training labels)
6. Run test prediction with "hello"
7. Set `model_status['intent'] = True`

**Files**: 
- `models/intent_detection/final-intent-model/tokenizer.json`
- `models/intent_detection/final-intent-model/model.safetensors`
- `models/intent_detection/final-intent-model/config.json`

**Labels** (from model config):
```
anger, sadness, gratitude, greeting, loneliness, help, relationship, self_care, stress
```

---

### **Emotion Model Loading**

**Where**: `_load_emotion_model()`

**Process**:
1. Load tokenizer from `models/go_emotions/final-goemotions-model`
2. Load classification model
3. Move to device, set eval mode
4. Run test prediction
5. Set status = True

**Labels** (28 emotions):
```
admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity,
desire, disappointment, disapproval, disgust, embarrassment, excitement, fear,
gratitude, grief, joy, love, nervousness, optimism, pride, realization, relief,
remorse, sadness, surprise, neutral
```

**Post-processing**: `normalize_emotion()` maps to broader categories:
- grief, disappointment → sadness
- fear, nervousness → anxiety
- annoyance → anger
- joy, gratitude, etc. → positive
- Others → return as-is

---

### **Risk Model Loading**

**Where**: `_load_risk_model()`

**Process**:
1. Load tokenizer from `models/suicide_risk_detection`
2. Load classification model
3. Move to device, set eval mode
4. Run test prediction
5. Set status = True

**Output**: Binary classification + keyword scoring

---

### **Response Model Loading**

**Where**: `_load_response_model()`

**Fallback Chain**:
1. Try esconv-dialo-final
2. Try counselchat
3. Try empathetic
4. Try dailydialog
5. Fall back to GPT2

**Process per model**:
1. Load tokenizer (always use GPT2 as fallback)
2. Set pad_token = eos_token
3. Load model (AutoModelForCausalLM)
4. Move to device
5. Set `model_status['response'] = True`
6. Store model name

**Tokenizer**: Always GPT2 (most reliable)

**Model Files**: `model.safetensors` from each directory

---

### **Qwen Loading**

**Where**: `_load_qwen()`

**Process**:
1. Check if local path exists: `models/Qwen2.5-0.5B-Instruct`
2. Fall back to HuggingFace ID: `Qwen/Qwen2.5-0.5B-Instruct`
3. Load tokenizer
4. Load model:
   - CUDA: float16, device_map="auto"
   - CPU: float32, device_map="cpu"
5. Set status = True

**Purpose**: Fallback generation and response refinement

**Features**:
- Supports chat template
- Smaller model (0.5B) for efficiency
- Uses torch.float16 on GPU

---

### **Embeddings**

**Status**: No embeddings are loaded. The system uses:
- Tokenizers from HuggingFace (AutoTokenizer)
- Model weights from HuggingFace (safetensors format)
- No separate embedding models

---

## 7. Validation System

### **Validation Functions Overview**

#### **1. `is_relevant_input(text, has_context=False)`**
**Purpose**: Gate-keeper for first message or conversation follow-ups

**Rejection Criteria**:
1. Empty input
2. Crisis keywords found → special response
3. No mental health keywords (only on first message)
4. Too short (≤2 words) → ask clarification

**Allows**:
- Any follow-up message if `has_context=True`
- Messages with mental health keywords
- Messages ≥3 words with keywords

**Returns**:
- `True`: Valid, continue
- `False`: Invalid, reject
- `dict`: Special response (crisis, clarification)

---

#### **2. `is_response_good(response, user_input, intent, emotion)`**
**Purpose**: Comprehensive response validation (currently replaced by `is_meaningful()`)

**Checks**:
1. **Length**: 4-80 words (min 4 if has empathy words, 8 otherwise)
2. **Self-reference**: Reject if mentions job/role without empathy phrases
3. **Empathy**: If user shows distress, response must have empathy words
4. **Intent-specific**:
   - "help" → must contain help/support verbs
   - "stress" → must address stress/coping
   - "sadness" → must have supportive tone
5. **Emotion-specific**: Negative emotions require supportive tone
6. **Keyword overlap**: User input and response should relate
7. **Invalid topics**: Reject politics, activism, etc.

**Returns**: `True/False`

---

#### **3. `is_meaningful(response, user_input)`**
**Purpose**: Detect hallucinations and quality issues (primary validator)

**Detects**:
1. **Too short**: < 6 characters
2. **Known patterns**: 
   - "thank you have"
   - "feeling good to"
   - "you are doing this is"
3. **Hallucination indicators**:
   - "do not the"
   - "i think i can't"
   - "be proud"
4. **ESCONV artifacts**:
   - "i'm sorry that we will"
   - "talk about my self"
   - "self, self" (repetition)
5. **Job obsession**: ≥2 job/career mentions
6. **Repetition**: Word used >3 times
7. **Irrelevant phrases**: job/legal/medical advice keywords
8. **Generic responses**: "ok", "yes", "i don't know"
9. **No word overlap**: Zero matching keywords with input

**Returns**: `True/False`

---

#### **4. `detect_hallucination(response, user_input)`**
**Purpose**: Score hallucination probability and identify reasons

**Detection Methods**:
1. **Fragmented patterns**: Text broken by periods/commas
2. **Technical artifacts**: "tokenizer", "embeddings", "tensor"
3. **Incoherent sentences**: < 3 words or has 4-digit numbers
4. **Excessive repetition**: < 30% unique word ratio
5. **Too short**: < 5 words
6. **No MH content**: Lacks mental health keywords

**Returns**: `(is_hallucinated, hallucination_score: 0-1, reasons: list)`

**Threshold**: hallucination_score > 0.6 → is_hallucinated = True

---

### **Crisis Detection Flow**

#### **1. Input Validation Stage**
**Function**: `is_relevant_input(text, has_context=False)`

**Crisis Keywords Checked**:
```
suicide, kill myself, kill, die, death, end, harm, 
crisis, emergency, don't want to live, can't live anymore,
want to die, want to end it, better off dead, etc.
```

**Action**: If any found → return crisis response dict (skip to Flask crisis handler)

#### **2. Classification Stage**
**Function**: `predict_risk(text)`

**ML Scoring**:
1. Run risk classification model
2. Extract sigmoid probability
3. Score = 0.0 to 1.0

**Keyword Scoring**:
1. Search for strict patterns (regex):
   ```
   \bi want to die\b
   \bi want to kill myself\b
   \bi want to end my life\b
   \bsuicide\b
   etc.
   ```
2. Pattern match count
3. Rule score = min(match_count / 2.0, 1.0)

**Sanity Check** (fusion logic):
```
IF ml_score > 0.90:
    label = "high_risk"  # Extreme ML confidence
ELIF ml_score > 0.70 AND keyword_hits > 0:
    label = "high_risk"  # High ML + keywords found
ELIF ml_score > 0.70:
    label = "moderate_risk"  # High ML but NO keywords
ELSE:
    label = "low_risk"
```

**Purpose of sanity check**: Prevent false positives where AI talks about "help" and triggers on benign messages

#### **3. Routing Decision**
**Location**: `generate_simple_response()` and `chat()`

**Code**:
```python
risk_label, risk_score = self.predict_risk(current_input)
if risk_label == "high_risk":
    return self.generate_crisis_response(current_input, user_context)
else:
    # Normal response generation
```

#### **4. Crisis Response Generation**
**Function**: `generate_crisis_response(text, user_context)`

**Steps**:
1. Extract contexts from message (job loss, financial, relationship)
2. Generate context-aware response with specific resources
3. Include:
   - Immediate counseling support
   - Supportive phrases
   - Safety actions (911, crisis hotlines)
   - Calming techniques (breathing, grounding)
   - Context-specific resources

---

### **Summary: Which Messages Get Rejected**

| Condition | Rejects | Where |
|-----------|---------|-------|
| Empty input | Yes | `is_relevant_input()` |
| Crisis keywords | Yes (special response) | `is_relevant_input()` |
| ≤2 words, first message | Yes (ask clarification) | `is_relevant_input()` |
| No MH keywords, first message | Yes | `is_relevant_input()` |
| Generic/hallucinated response | Yes | `is_meaningful()` |
| Technical artifacts | Yes | `is_meaningful()` |
| Excessive repetition | Yes | `is_meaningful()` |
| No word overlap | Yes (conditional) | `is_meaningful()` |

### **Summary: Which Messages Get Allowed**

| Condition | Allows | Where |
|-----------|--------|-------|
| Follow-up message (has_context=True) | Yes | `is_relevant_input()` |
| ≥3 words + MH keywords, first message | Yes | `is_relevant_input()` |
| Valid response, passes `is_meaningful()` | Yes | `generate_simple_response()` |
| High quality, no hallucinations | Yes | `generate_simple_response()` |

---

## 8. Response Generation

### **Where Final Response is Produced**

**Primary Generation**: `generate_simple_response(context, intent, emotion, history=None)`

**Secondary Generation** (if primary fails): `_generate_with_qwen_fallback(user_input, emotion, intent)`

**Tertiary Generation** (if both fail): `comprehensive_rule_based_response(user_input, emotion, intent)`

---

### **Prompt Construction**

#### **For Qwen**:
```python
messages = [
    {"role": "system", "content": "You are a highly empathetic mental health support assistant..."},
    {"role": "user", "content": user_input}
]
prompt = self.qwen_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
```

**Key Point**: System message emphasizes:
- Empathy
- No medical advice
- Brevity (under 3 sentences)
- Acknowledgment of feelings

#### **For DialoGPT**:
```python
prompt = f"User: {current_input}{self.resp_tokenizer.eos_token}Assistant:"
```

**Key Point**: Simple prompt, no system message, just dialogue format

---

### **History Inclusion**

**Currently**: History is NOT included in generation

**Parameters**: `history` parameter is passed to `generate_simple_response()` but NOT USED

**Why**: 
- DialoGPT was trained on dialogue pairs, not conversations
- Keeping context window short improves generation quality
- Intent/emotion classification already uses full context

**Future Enhancement**: Could build full conversation context string like Flask does, but would need prompt engineering

---

### **Context Processing in Flask**

The **Flask service** (PRODUCTION_READY_FLASK.py) builds context like this:

```python
WINDOW_SIZE = 6  # Last 3 user + 3 assistant messages
history_slice = conversation_history[-WINDOW_SIZE:]

context = ""
for msg in history_slice:
    role = msg.get("role", "user").lower()
    content = msg.get("content", msg.get("text", "")).strip()
    
    if role == "user":
        context += f"User: {content}\n"
    else:
        context += f"Assistant: {content}\n"

context += f"User: {user_input}\nAssistant:"
```

Then passes this context to `predict_intent()` and `predict_emotion()` for better classification.

---

### **Generation Parameters**

#### **Qwen Generation**:
```python
max_new_tokens=150
do_sample=True
temperature=0.3  # Low temperature = deterministic, focused
top_p=0.8
pad_token_id=tokenizer.eos_token_id
eos_token_id=tokenizer.eos_token_id
```

#### **DialoGPT Generation**:
```python
max_new_tokens=150
do_sample=True
temperature=0.6  # Higher = more varied
top_p=0.8
repetition_penalty=1.3  # Avoid repetition
early_stopping=True
```

---

### **Post-Processing**

After generation:

1. **Decode**: Convert token IDs back to text
2. **Extract**: Remove "User:", "Assistant:" prefixes
3. **Clean**: `clean_response()` removes system prompts, artifacts
4. **Validate**: `is_meaningful()` checks for hallucinations
5. **Refine**: `refine_response()` adds empathy and questions
6. **Return**: Final response string

---

## 9. Dependencies

### **Helper Functions & Where Used**

| Helper Function | Used By | Purpose |
|-----------------|---------|---------|
| `override_intent()` | `predict_intent()` | Post-process intent predictions |
| `normalize_emotion()` | `predict_emotion()` | Map emotions to broad categories |
| `is_meaningful()` | `generate_simple_response()` | Hallucination detection |
| `detect_hallucination()` | `is_meaningful()` | Score hallucination probability |
| `clean_response()` | `generate_simple_response()` | Remove artifacts |
| `refine_response()` | `generate_simple_response()` | Add empathy + questions |
| `_refine_with_qwen()` | `refine_response()` | Qwen-based refinement |
| `_generate_with_qwen_fallback()` | `generate_simple_response()` | Qwen generation fallback |
| `comprehensive_rule_based_response()` | `generate_simple_response()` | Rule-based response templates |
| `simple_fallback_response()` | `generate_simple_response()` | Simple empathetic fallback |
| `emotional_job_loss_fallback()` | `comprehensive_rule_based_response()` | Job loss specific response |
| `extract_contexts()` | `generate_crisis_response()` | Extract situation contexts |
| `generate_context_aware_crisis_response()` | `generate_crisis_response()` | Build detailed crisis response |
| `is_response_good()` | Unused (replaced by `is_meaningful()`) | Old validator |
| `validate_with_phi3()` | Never (Phi3 not loaded) | Deprecated validator |
| `safe_fallback_response()` | `generate_simple_response()`, `chat()` | Last resort fallback |
| `irrelevant_topic_response()` | Unused | Generic irrelevant response |
| `crisis_fallback_response()` | Unused (replaced by `generate_crisis_response()`) | Old crisis handler |
| `get_model_status()` | Flask health endpoint | Return model status dict |
| `validate_response()` | Unused | Simple wrapper |

---

## 10. Suggested Module Split

### **Proposed Modular Architecture** (Without Moving Code)

```
fixed_model_loader/
├── models/
│   ├── intent_classifier.py
│   │   ├── predict_intent()
│   │   ├── override_intent()
│   │   └── _load_intent_model()
│   │
│   ├── emotion_classifier.py
│   │   ├── predict_emotion()
│   │   ├── normalize_emotion()
│   │   └── _load_emotion_model()
│   │
│   ├── risk_detector.py
│   │   ├── predict_risk()
│   │   └── _load_risk_model()
│   │
│   └── model_loader.py
│       ├── _get_device()
│       ├── _load_response_model()
│       ├── _load_qwen()
│       └── get_model_status()
│
├── validation/
│   ├── input_validator.py
│   │   ├── is_relevant_input()
│   │
│   ├── response_validator.py
│   │   ├── is_response_good()
│   │   ├── is_meaningful()
│   │   └── detect_hallucination()
│   │
│   └── crisis_detector.py
│       ├── extract_contexts()
│
├── generation/
│   ├── response_generator.py
│   │   ├── generate_simple_response()
│   │   ├── _generate_with_qwen_fallback()
│   │   ├── clean_response()
│   │
│   ├── crisis_response.py
│   │   ├── generate_crisis_response()
│   │   ├── generate_context_aware_crisis_response()
│   │   └── crisis_fallback_response()
│   │
│   ├── fallback_generator.py
│   │   ├── comprehensive_rule_based_response()
│   │   ├── simple_fallback_response()
│   │   ├── emotional_job_loss_fallback()
│   │   ├── safe_fallback_response()
│   │   └── irrelevant_topic_response()
│   │
│   └── refinement.py
│       ├── refine_response()
│       └── _refine_with_qwen()
│
├── core/
│   ├── bot.py
│   │   └── FixedMentalHealthBot (class wrapper)
│   │
│   └── inference.py
│       └── chat() (main entry point)
│
└── config/
    ├── constants.py
    │   ├── MODEL_PATHS
    │   ├── Crisis keywords
    │   ├── MH keywords
    │   ├── Hallucination patterns
    │   └── Response templates
    │
    └── device_config.py
        ├── GPU/CPU settings
        └── Model loading defaults
```

---

### **Module Breakdown Details**

#### **models/intent_classifier.py**
```python
# Methods from FixedMentalHealthBot:
- _load_intent_model()
- predict_intent()
- override_intent()
```
**Purpose**: Intent classification pipeline
**Dependencies**: transformers, torch
**Used by**: core/bot.py, core/inference.py

---

#### **models/emotion_classifier.py**
```python
# Methods:
- _load_emotion_model()
- predict_emotion()
- normalize_emotion()
```
**Purpose**: Emotion detection and normalization
**Dependencies**: transformers, torch
**Used by**: core/bot.py, core/inference.py

---

#### **models/risk_detector.py**
```python
# Methods:
- _load_risk_model()
- predict_risk()
```
**Purpose**: Suicide risk detection (ML + keywords)
**Dependencies**: transformers, torch, re
**Used by**: core/bot.py, generation/response_generator.py

---

#### **models/model_loader.py**
```python
# Methods:
- _get_device()
- _load_response_model()
- _load_qwen()
- get_model_status()
```
**Purpose**: Centralized model lifecycle management
**Dependencies**: transformers, torch, os
**Used by**: core/bot.py initialization

---

#### **validation/input_validator.py**
```python
# Methods:
- is_relevant_input()
```
**Purpose**: Gate-keep invalid inputs
**Dependencies**: re
**Called by**: Flask `/chat` endpoint before calling bot
**Context**: First message or follow-up validation

---

#### **validation/response_validator.py**
```python
# Methods:
- is_response_good()
- is_meaningful()
- detect_hallucination()
```
**Purpose**: Quality assurance for generated responses
**Dependencies**: re, torch
**Used by**: generation/response_generator.py
**Context**: Check if response is worthy of returning

---

#### **validation/crisis_detector.py**
```python
# Methods:
- extract_contexts()
```
**Purpose**: Identify situation contexts (job loss, financial, relationship)
**Dependencies**: None
**Used by**: generation/crisis_response.py
**Context**: Enhance crisis response with specific resources

---

#### **generation/response_generator.py**
```python
# Methods:
- generate_simple_response()
- _generate_with_qwen_fallback()
- clean_response()
```
**Purpose**: Core response generation with fallback chain
**Dependencies**: transformers, torch, validation/response_validator
**Used by**: core/inference.py
**Context**: Main generation pipeline

---

#### **generation/crisis_response.py**
```python
# Methods:
- generate_crisis_response()
- generate_context_aware_crisis_response()
- crisis_fallback_response()
```
**Purpose**: Crisis-specific responses with resources
**Dependencies**: validation/crisis_detector
**Used by**: generation/response_generator.py
**Context**: Route when risk_label == "high_risk"

---

#### **generation/fallback_generator.py**
```python
# Methods:
- comprehensive_rule_based_response()
- simple_fallback_response()
- emotional_job_loss_fallback()
- safe_fallback_response()
- irrelevant_topic_response()
```
**Purpose**: Rule-based responses when LLM fails
**Dependencies**: None
**Used by**: generation/response_generator.py
**Context**: Fallback cascade when quality checks fail

---

#### **generation/refinement.py**
```python
# Methods:
- refine_response()
- _refine_with_qwen()
```
**Purpose**: Post-generation refinement and empathy injection
**Dependencies**: transformers, torch, random
**Used by**: generation/response_generator.py
**Context**: Final polish before returning response

---

#### **core/bot.py**
```python
# Class:
- FixedMentalHealthBot
  - __init__()
  - All model loading delegated to models/*
  - All methods delegated to respective modules
```
**Purpose**: Public interface, dependency injection point
**Dependencies**: All modules
**Used by**: Flask service initialization

---

#### **core/inference.py**
```python
# Methods:
- chat()
```
**Purpose**: High-level entry point for Flask
**Dependencies**: All validation and generation modules
**Used by**: PRODUCTION_READY_FLASK.py
**Context**: Main orchestration logic

---

#### **config/constants.py**
```python
# Constants:
MODEL_PATHS
CRISIS_KEYWORDS
MENTAL_HEALTH_KEYWORDS
HALLUCINATION_PATTERNS
EMPATHY_RESPONSES
JOB_LOSS_RESPONSES
STRESS_RESPONSES
EMOTION_RESPONSES
```
**Purpose**: Centralize all hardcoded lists
**Used by**: validation/*, generation/*, models/*

---

#### **config/device_config.py**
```python
# Settings:
DEFAULT_DEVICE
CUDA_DTYPE
CPU_DTYPE
MODEL_LOADING_DEFAULTS
GENERATION_DEFAULTS
```
**Purpose**: Configuration management
**Used by**: models/model_loader.py, generation/response_generator.py

---

### **Dependency Graph**

```
PRODUCTION_READY_FLASK.py
    ↓
core/inference.py (chat())
    ├─→ models/* (classification)
    ├─→ validation/* (validation)
    ├─→ generation/response_generator.py
    │   ├─→ generation/crisis_response.py
    │   ├─→ generation/fallback_generator.py
    │   ├─→ generation/refinement.py
    │   └─→ validation/response_validator.py
    └─→ config/*
```

---

## Conclusion

`fixed_model_loader.py` is a production mental health AI system with:

1. **5-6 transformer models** for classification and generation
2. **Robust validation** at input, output, and hallucination detection
3. **Crisis detection** with ML + keywords + sanity checks
4. **Fallback cascade** (Qwen → DialoGPT → Rule-based → Safe)
5. **Context awareness** for intent/emotion, but current-message-only for generation
6. **Empathy injection** through refinement and response templates

The proposed modular split maintains all behavior while improving maintainability and testability.

