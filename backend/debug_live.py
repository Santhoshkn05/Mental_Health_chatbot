#!/usr/bin/env python3
"""
Debug the actual running system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_current_system():
    print("Testing ACTUAL running system...")
    
    # Import fresh
    from fixed_model_loader import FixedMentalHealthBot
    
    # Test the exact input you mentioned
    test_inputs = [
        "I'm not feeling well",
        "I feel sad", 
        "I need help",
        "I'm stressed",
        "I want to die",  # This should trigger crisis
    ]
    
    bot = FixedMentalHealthBot()
    
    for test_input in test_inputs:
        print(f"\n{'='*50}")
        print(f"Testing: '{test_input}'")
        print(f"{'='*50}")
        
        result = bot.is_relevant_input(test_input)
        
        print(f"Result type: {type(result)}")
        
        if isinstance(result, dict):
            is_crisis = result.get('crisis_response', False)
            print(f"CRISIS DETECTED: {is_crisis}")
            print(f"Response: {result.get('response', 'No response')[:100]}...")
        else:
            print(f"CRISIS DETECTED: False")
            print(f"Result: {result}")

if __name__ == "__main__":
    debug_current_system()
