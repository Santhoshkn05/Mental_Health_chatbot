import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import app


class RelevanceCrisisResourcesTest(unittest.TestCase):
    def test_relevance_crisis_response_contains_existing_resources(self):
        class StubBot:
            model_status = {
                "intent": False,
                "emotion": False,
                "risk": False,
                "response": False,
                "qwen": False,
            }

            def is_relevant_input(self, *_args, **_kwargs):
                return {
                    "crisis_response": True,
                    "response": "Existing crisis response"
                }

        app.app.testing = True
        with patch.object(app, "bot", StubBot()):
            response = app.app.test_client().post(
                "/chat",
                json={"message": "I am in crisis"},
            )

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["response"], "Existing crisis response")
        self.assertTrue(payload["crisis_triggered"])
        self.assertTrue(payload["alert"])
        self.assertTrue(payload["emergency"])
        self.assertEqual(payload["resources"], app.CRISIS_RESOURCES)
        self.assertEqual(len(payload["resources"]), 4)
        self.assertEqual(payload["resources"][0]["name"], "Kiran Mental Health Helpline")
        self.assertEqual(payload["resources"][-1]["phone"], "988")


if __name__ == "__main__":
    unittest.main()
