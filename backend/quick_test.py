#!/usr/bin/env python3
"""
Quick test for crisis detection fix
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fixed_model_loader import FixedMentalHealthBot

def quick_test():
    bot = FixedMentalHealthBot()
    
    # Test cases that should NOT trigger crisis
    normal_inputs = [
        "I feel sad",
        "I'm anxious",
        "I need help with depression",
        "I want to learn about suicide prevention",
        "Don't commit suicide",
        "Suicide is a serious issue",
        "Help with suicide prevention",
        "I'm worried about suicide",
        "I want to feel better",
        "I'm stressed about work"
    ]
    
    # Test cases that SHOULD trigger crisis
    crisis_inputs = [
        "I don't want to live",
        "I want to die",
        "I want to kill myself",
        "suicide",
        "I want to end my life"
    ]
    
    print("Testing NORMAL inputs (should NOT trigger crisis):")
    for input_text in normal_inputs:
        result = bot.is_relevant_input(input_text)
        is_crisis = isinstance(result, dict) and result.get('crisis_response', False)
        status = "PASS" if not is_crisis else "FAIL"
        print(f"  '{input_text}' - {status}")
    
    print("\nTesting CRISIS inputs (should trigger crisis):")
    for input_text in crisis_inputs:
        result = bot.is_relevant_input(input_text)
        is_crisis = isinstance(result, dict) and result.get('crisis_response', False)
        status = "PASS" if is_crisis else "FAIL"
        print(f"  '{input_text}' - {status}")

if __name__ == "__main__":
    quick_test()
