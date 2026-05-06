# test_metric.py

print("Starting Metrics Evaluation...\n")

from fixed_model_loader import FixedMentalHealthBot
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# ==============================
# 🔥 STEP 1: LOAD BOT (LIGHT MODE)
# ==============================

print("Loading model... (this may take some time)")

bot = FixedMentalHealthBot()

print("\nModel loaded successfully!\n")

# ==============================
# 🔥 STEP 2: TEST DATA (EDIT THIS)
# ==============================

test_data = [
    {"text": "I feel like dying", "actual": "high_risk"},
    {"text": "I want to end my life", "actual": "high_risk"},
    {"text": "I am very stressed", "actual": "low_risk"},
    {"text": "I feel sad and alone", "actual": "low_risk"},
    {"text": "Life is meaningless", "actual": "high_risk"},
    {"text": "I am happy today", "actual": "low_risk"},
    {"text": "I feel depressed", "actual": "low_risk"},
    {"text": "I want to kill myself", "actual": "high_risk"},
]

# ==============================
# 🔥 STEP 3: PREDICTIONS
# ==============================

y_true = []
y_pred = []

print("Running predictions...\n")

for i, item in enumerate(test_data):
    text = item["text"]
    actual = item["actual"]

    print(f"[{i+1}] Input: {text}")

    try:
        pred_label, score = bot.predict_risk(text)
        print(f"Predicted: {pred_label} (score={score:.3f})\n")

        y_true.append(actual)
        y_pred.append(pred_label)

    except Exception as e:
        print(f"Error processing: {e}\n")

# ==============================
# 🔥 STEP 4: METRICS
# ==============================

print("\n==============================")
print("📊 METRICS RESULTS")
print("==============================\n")

accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, pos_label="high_risk")
recall = recall_score(y_true, y_pred, pos_label="high_risk")
f1 = f1_score(y_true, y_pred, pos_label="high_risk")

print(f"Accuracy : {accuracy:.2f}")
print(f"Precision: {precision:.2f}")
print(f"Recall   : {recall:.2f}")
print(f"F1 Score : {f1:.2f}\n")

print("Detailed Report:\n")
print(classification_report(y_true, y_pred))

# ==============================
# 🔥 STEP 5: FINAL OUTPUT
# ==============================

print("Evaluation Completed ✅")