import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import app


class ModelGenerationMetadataTest(unittest.TestCase):
    class StubBot:
        model_status = {
            "intent": False,
            "emotion": False,
            "risk": False,
            "response": False,
            "qwen": False,
        }

        def __init__(self, mode):
            self.mode = mode

        def is_relevant_input(self, *_args, **_kwargs):
            return True

        def predict_intent(self, _context):
            return "sadness"

        def predict_emotion(self, _context):
            return "sadness"

        def predict_risk(self, _message):
            return "low_risk", 0.1

        def generate_simple_response(self, *_args, **_kwargs):
            if self.mode == "qwen":
                self.last_response_generation = "qwen_model"
                return "Qwen response"
            if self.mode == "dialogpt":
                self.last_response_generation = "dialogpt_model"
                return "DialoGPT response"
            raise RuntimeError("model generation failed")

        def comprehensive_rule_based_response(self, *_args):
            return "Rule-based response"

        def _validate_generated_response(self, *_args):
            return True

        def _validated_safe_fallback(self, *_args):
            self.last_response_generation = "safe_fallback"
            return "Safe fallback response"

    def post_with_mode(self, mode):
        app.app.testing = True
        with patch.object(app, "bot", self.StubBot(mode)):
            return app.app.test_client().post(
                "/chat",
                json={"message": "I feel sad"},
            ).get_json()

    def test_qwen_success_reports_qwen(self):
        payload = self.post_with_mode("qwen")
        self.assertEqual(payload["models_used"]["response_generation"], "qwen_model")
        self.assertFalse(payload.get("degraded", False))

    def test_qwen_failure_to_dialogpt_reports_dialogpt(self):
        payload = self.post_with_mode("dialogpt")
        self.assertEqual(payload["models_used"]["response_generation"], "dialogpt_model")
        self.assertFalse(payload.get("degraded", False))

    def test_model_failure_reports_rule_based_fallback(self):
        payload = self.post_with_mode("failure")
        self.assertEqual(payload["models_used"]["response_generation"], "rule_based_fallback")
        self.assertTrue(payload["degraded"])
        self.assertTrue(payload["fallback"])
        self.assertFalse(payload["crisis_triggered"])
        self.assertFalse(payload["moderate_risk"])


if __name__ == "__main__":
    unittest.main()
