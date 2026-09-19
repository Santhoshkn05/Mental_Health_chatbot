"""Shared model paths and device selection for the mental-health bot."""

import os

import torch


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATHS = {
    "intent": os.path.join(MODELS_DIR, "intent_detection", "final-intent-model"),
    "emotion": os.path.join(MODELS_DIR, "go_emotions", "final-goemotions-model"),
    "risk": os.path.join(MODELS_DIR, "suicide_risk_detection"),
    "esconv-dialo-final": os.path.join(MODELS_DIR, "esconv-dialo-final"),
    "counselchat": os.path.join(MODELS_DIR, "counselchat"),
    "empathetic": os.path.join(MODELS_DIR, "empathetic"),
    "dailydialog": os.path.join(MODELS_DIR, "dailydialog"),
    "qwen": os.path.join(MODELS_DIR, "Qwen2.5-0.5B-Instruct"),
}


def get_device():
    """Determine the best available device for model execution."""
    if torch.cuda.is_available():
        print("[GPU STATUS] CUDA Available: True")
        return torch.device("cuda")

    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        print("[GPU STATUS] Apple Metal (MPS) Available: True")
        return torch.device("mps")

    if hasattr(torch.version, "hip") and torch.version.hip:
        print("[GPU STATUS] AMD ROCm (HIP) Available: True")
        return torch.device("cuda")

    print("[GPU STATUS] No GPU-compatible GPU found - using CPU")
    return torch.device("cpu")
