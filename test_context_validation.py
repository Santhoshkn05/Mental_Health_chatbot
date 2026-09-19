import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from model_loader import FixedMentalHealthBot
from ai.validation.response_validator import is_response_good


class ContextValidationTest(unittest.TestCase):
    def test_normal_single_turn_response_is_accepted(self):
        self.assertTrue(
            is_response_good(
                "That sounds really difficult. I'm here to support you.",
                "I feel sad",
                "sadness",
                "sadness",
            )
        )

    def test_follow_up_response_can_use_previous_context(self):
        context = (
            "User: I lost my job yesterday.\n"
            "Assistant: That sounds really difficult, and I'm here with you.\n"
            "User: I am worried about what comes next.\n"
            "Assistant:"
        )
        self.assertTrue(
            is_response_good(
                "Losing your job can feel really difficult. I'm here to support you as you think about what comes next.",
                context,
                "sadness",
                "sadness",
            )
        )

    def test_unrelated_response_is_rejected_with_context(self):
        context = (
            "User: I lost my job yesterday.\n"
            "Assistant: That sounds really difficult.\n"
            "User: I am worried about what comes next.\n"
            "Assistant:"
        )
        self.assertFalse(
            is_response_good(
                "The government election results and international politics are changing rapidly today.",
                context,
                "sadness",
                "sadness",
            )
        )

    def test_crisis_response_bypasses_normal_validation(self):
        bot = FixedMentalHealthBot.__new__(FixedMentalHealthBot)
        bot.predict_risk = lambda _text: ("high_risk", 0.9)
        bot.generate_crisis_response = lambda _text, _context: "Crisis response"
        bot._validate_generated_response = lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("crisis response entered normal validation")
        )

        response = bot.generate_simple_response(
            "User: I want to die.\nAssistant:",
            "help",
            "sadness",
            [],
        )
        self.assertEqual(response, "Crisis response")


if __name__ == "__main__":
    unittest.main()
