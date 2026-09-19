import unittest
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import app


class OuterExceptionFallbackTest(unittest.TestCase):
    def test_outer_fallback_is_validated_and_preserved_when_valid(self):
        class StubBot:
            def is_relevant_input(self, *_args, **_kwargs):
                raise RuntimeError("forced outer exception")

            def _validate_generated_response(self, response, *_args):
                self.validated_response = response
                return True

        stub_bot = StubBot()
        app.app.testing = True

        with patch.object(app, "bot", stub_bot):
            response = app.app.test_client().post(
                "/chat",
                json={"message": "I feel overwhelmed"},
            )

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            payload["response"],
            "I'm here to support you. Please tell me more."
        )
        self.assertEqual(payload["validation_applied"], True)
        self.assertEqual(payload["degraded"], True)
        self.assertEqual(payload["fallback"], True)
        self.assertEqual(payload["crisis_triggered"], False)
        self.assertEqual(payload["moderate_risk"], False)
        self.assertEqual(
            stub_bot.validated_response,
            "I'm here to support you. Please tell me more."
        )

    def test_outer_fallback_uses_safe_fallback_when_rejected(self):
        class StubBot:
            def __init__(self):
                self.validation_calls = []

            def is_relevant_input(self, *_args, **_kwargs):
                raise RuntimeError("forced outer exception")

            def _validate_generated_response(self, response, *_args):
                self.validation_calls.append(response)
                return len(self.validation_calls) > 1

            def safe_fallback_response(self):
                return "I'm here to listen and support you."

        stub_bot = StubBot()
        app.app.testing = True

        with patch.object(app, "bot", stub_bot):
            response = app.app.test_client().post(
                "/chat",
                json={"message": "I feel overwhelmed"},
            )

        payload = response.get_json()
        self.assertEqual(payload["response"], "I'm here to listen and support you.")
        self.assertEqual(payload["validation_applied"], True)
        self.assertEqual(len(stub_bot.validation_calls), 2)


if __name__ == "__main__":
    unittest.main()
