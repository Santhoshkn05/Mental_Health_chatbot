import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

model_id = "Qwen/Qwen2.5-0.5B-Instruct"

print("Loading Qwen...")

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

messages = [
    {
        "role": "system",
        "content": "You are a brief, supportive mental health assistant."
    },
    {
        "role": "user",
        "content": "I am feeling stressed about my exams."
    }
]

prompt = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)

inputs = tokenizer(
    prompt,
    return_tensors="pt"
)

print("Generating response...")

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=60,
        do_sample=False,
        pad_token_id=tokenizer.eos_token_id
    )

generated_tokens = outputs[0][inputs["input_ids"].shape[1]:]

response = tokenizer.decode(
    generated_tokens,
    skip_special_tokens=True
).strip()

print("\n========== QWEN RESPONSE ==========")
print(response)
print("====================================")