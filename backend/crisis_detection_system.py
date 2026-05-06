#!/usr/bin/env python3
"""
Advanced Crisis Detection System with Alarm and Visual Alerts
"""

import json
import os
import time
import threading
from datetime import datetime
import sys
import subprocess
import platform
import webbrowser
from typing import Dict, List, Optional, Any

class CrisisDetectionSystem:
    def __init__(self):
        self.crisis_active = False
        self.alarm_thread = None
        self.alarm_running = False
        self.crisis_log = []
        self.knowledge_resources = self.load_knowledge_resources()
        
    def load_knowledge_resources(self):
        """Load all knowledge resources from the knowledge_resources folder"""
        resources = {}
        knowledge_dir = os.path.join(os.path.dirname(__file__), "knowledge_resources")
        
        if not os.path.exists(knowledge_dir):
            os.makedirs(knowledge_dir)
            return resources
        
        try:
            # Load breathing exercises
            breathing_file = os.path.join(knowledge_dir, "breathing_exercises.json")
            if os.path.exists(breathing_file):
                with open(breathing_file, 'r') as f:
                    resources['breathing'] = json.load(f)
            
            # Load yoga exercises
            yoga_file = os.path.join(knowledge_dir, "yoga_exercises.json")
            if os.path.exists(yoga_file):
                with open(yoga_file, 'r') as f:
                    resources['yoga'] = json.load(f)
            
            # Load grounding techniques
            grounding_file = os.path.join(knowledge_dir, "grounding_techniques.json")
            if os.path.exists(grounding_file):
                with open(grounding_file, 'r') as f:
                    resources['grounding'] = json.load(f)
        
            # Load crisis counseling
            counseling_file = os.path.join(knowledge_dir, "crisis_counseling.json")
            if os.path.exists(counseling_file):
                with open(counseling_file, 'r') as f:
                    resources['counseling'] = json.load(f)
                    
        except Exception as e:
            print(f"Error loading knowledge resources: {e}")
            
        return resources
    
    def trigger_crisis_alert(self, user_input, risk_score, user_context=None):
        """
        Trigger comprehensive crisis response with alarm and visual alerts
        
        Args:
            user_input (str): The triggering user input
            risk_score (float): The calculated risk score
            user_context (dict): Additional context about the user
        """
        # Check if crisis is already active or in cooldown
        if self.crisis_active:
            print("[CRISIS] Crisis already active - ignoring trigger")
            return {"crisis_active": True, "message": "Crisis already in progress"}
        
        # Cooldown check - prevent rapid re-triggering
        current_time = time.time()
        if hasattr(self, 'last_trigger_time') and current_time - self.last_trigger_time < 30:
            print("[CRISIS] In cooldown period - ignoring trigger")
            return {"crisis_active": False, "message": "Crisis system in cooldown"}
        
        self.crisis_active = True
        self.last_trigger_time = current_time
        crisis_timestamp = datetime.now().isoformat()
        
        # Log crisis event
        crisis_data = {
            "timestamp": crisis_timestamp,
            "user_input": user_input,
            "risk_score": risk_score,
            "user_context": user_context or {},
            "actions_taken": []
        }
        
        print("CRISIS ALERT TRIGGERED!")
        print(f"Risk Score: {risk_score}")
        print(f"User Input: {user_input}")
        
        # Start continuous alarm
        self.start_continuous_alarm()
        
        # Show visual alert
        self.show_visual_alert(user_input, risk_score)
        
        # Get immediate resources
        immediate_resources = self.get_immediate_resources()
        
        crisis_data["actions_taken"].extend([
            "continuous_alarm_started",
            "visual_alert_shown",
            "resources_provided"
        ])
        
        self.crisis_log.append(crisis_data)
        
        return {
            "crisis_active": True,
            "timestamp": crisis_timestamp,
            "resources": immediate_resources,
            "helplines": self.get_helpline_info(),
            "immediate_actions": [
                "Continuous alarm activated",
                "Visual danger alert displayed",
                "Emergency resources provided"
            ]
        }
    
    def start_continuous_alarm(self):
        """Start continuous alarm sound in a separate thread"""
        if self.alarm_running:
            return
        
        self.alarm_running = True
        self.alarm_thread = threading.Thread(target=self._alarm_loop, daemon=True)
        self.alarm_thread.start()
    
    def _alarm_loop(self):
        """Continuous alarm loop with cross-platform sound"""
        alarm_count = 0
        while self.alarm_running and alarm_count < 60:  # Limit to 60 iterations
            try:
                # Play alarm sound based on platform
                self._play_alarm_sound()
                
                # Visual alarm in console
                print("CRISIS ALARM! " * 5)
                print("DANGER! DANGER! DANGER!")
                print("IMMEDIATE ATTENTION REQUIRED!")
                print("CRISIS ALARM! " * 5)
                
                time.sleep(2)  # Wait between alarm cycles
                alarm_count += 1
                
            except Exception as e:
                print(f"Alarm error: {e}")
                break
        
        self.alarm_running = False
    
    def _play_alarm_sound(self):
        """Play alarm sound based on platform"""
        try:
            system = platform.system()
            
            if system == "Windows":
                # Windows beep
                import winsound
                winsound.Beep(1000, 500)  # Frequency: 1000Hz, Duration: 500ms
                time.sleep(0.1)
                winsound.Beep(1000, 500)
            elif system == "Darwin":  # macOS
                # macOS beep
                subprocess.run(['afplay', '/System/Library/Sounds/Basso.aiff'], 
                             capture_output=True, check=False)
            elif system == "Linux":
                # Linux beep
                subprocess.run(['beep', '-f', '1000', '-l', '500'], 
                             capture_output=True, check=False)
            else:
                # Fallback to console beep
                print("\a")
                time.sleep(0.5)
                print("\a")
                
        except Exception as e:
            # Ultimate fallback - console beeps
            try:
                print("\a")
                time.sleep(0.5)
                print("\a")
            except:
                pass
    
    def show_visual_alert(self, user_input, risk_score):
        """Show visual danger alert with automatic crisis interface"""
        # Always show console alert first
        print("\n" + "="*80)
        print("CRISIS ALERT - IMMEDIATE ATTENTION NEEDED")
        print("="*80)
        print("DANGER! DANGER! DANGER!")
        print(f"Risk Score: {risk_score:.3f}")
        print(f"User Input: {user_input}")
        print("CALL 911 IMMEDIATELY!")
        print("CONTACT SUICIDE HOTLINE: 988")
        print("DO NOT LEAVE USER ALONE!")
        print("="*80)
        print("ALARM SYSTEM ACTIVATED!")
        print("CRISIS INTERFACE OPENING!")
        print("="*80 + "\n")
        
        # Automatically open crisis interface
        self._open_crisis_interface(user_input, risk_score)
        
        # Try GUI alert as secondary option
        try:
            import tkinter as tk
            root = tk.Tk()
            root.withdraw()
            
            alert_window = tk.Toplevel(root)
            alert_window.title("CRISIS ALERT - IMMEDIATE ATTENTION NEEDED")
            alert_window.geometry("600x400")
            alert_window.configure(bg='#8B0000')
            
            # Danger symbol
            danger_label = tk.Label(
                alert_window,
                text="! DANGER !",
                font=("Arial", 24, "bold"),
                fg="white",
                bg="#8B0000"
            )
            danger_label.pack(pady=10)
            
            # Warning message
            warning_label = tk.Label(
                alert_window,
                text="CRISIS DETECTED - IMMEDIATE ACTION REQUIRED",
                font=("Arial", 16, "bold"),
                fg="yellow",
                bg="#8B0000"
            )
            warning_label.pack(pady=5)
            
            # Risk score
            risk_label = tk.Label(
                alert_window,
                text=f"Risk Score: {risk_score:.3f}",
                font=("Arial", 12),
                fg="orange",
                bg="#8B0000"
            )
            risk_label.pack(pady=5)
            
            # Auto-close after 10 seconds
            alert_window.after(10000, lambda: (alert_window.destroy(), root.destroy()))
            
            # Non-blocking - don't wait for user interaction
            alert_window.update()
            
        except Exception as e:
            print(f"GUI alert not available: {e}")
            # Crisis interface already opened above
    
    def _open_crisis_interface(self, user_input, risk_score):
        """Open crisis interface in browser"""
        try:
            import webbrowser
            import threading
            
            def open_browser():
                # Open crisis interface
                crisis_url = "http://127.0.0.1:5001/crisis-interface"
                webbrowser.open(crisis_url, new=2)  # Open in new tab
            
            # Open in separate thread to not block
            thread = threading.Thread(target=open_browser, daemon=True)
            thread.start()
            
            print("CRISIS INTERFACE OPENED IN BROWSER!")
            
        except Exception as e:
            print(f"Could not open crisis interface: {e}")
            # Fallback - try to open with system command
            try:
                import subprocess
                import platform
                
                system = platform.system()
                if system == "Windows":
                    subprocess.run(['start', 'http://127.0.0.1:5001/crisis-interface'], 
                                 shell=True, check=False)
                elif system == "Darwin":  # macOS
                    subprocess.run(['open', 'http://127.0.0.1:5001/crisis-interface'], 
                                 check=False)
                elif system == "Linux":
                    subprocess.run(['xdg-open', 'http://127.0.0.1:5001/crisis-interface'], 
                                 check=False)
                    
            except Exception as e2:
                print(f"Could not open browser with system command: {e2}")
    
    def get_immediate_resources(self):
        """Get immediate crisis resources with fallback"""
        resources = {
            "breathing": [],
            "grounding": [],
            "counseling": [],
            "helplines": self.get_helpline_info()
        }
        
        # Try to load breathing exercises
        try:
            if 'breathing' in self.knowledge_resources:
                breathing_exercises = self.knowledge_resources['breathing'].get('breathing_exercises', [])
                resources['breathing'] = breathing_exercises[:2]  # First 2 exercises
            else:
                # Fallback breathing exercises
                resources['breathing'] = [
                    {
                        "name": "4-7-8 Breathing",
                        "description": "A simple but powerful relaxation technique",
                        "steps": ["Inhale through your nose for 4 seconds", "Hold your breath for 7 seconds", "Exhale slowly through your mouth for 8 seconds", "Repeat 3-4 times"]
                    }
                ]
        except Exception as e:
            print(f"Error loading breathing exercises: {e}")
            # Fallback
            resources['breathing'] = [
                {
                    "name": "Deep Breathing",
                    "description": "Take slow, deep breaths to calm your nervous system",
                    "steps": ["Breathe in slowly for 4 seconds", "Hold for 4 seconds", "Breathe out slowly for 4 seconds", "Repeat until calm"]
                }
            ]
        
        # Try to load grounding techniques
        try:
            if 'grounding' in self.knowledge_resources:
                grounding_techniques = self.knowledge_resources['grounding'].get('grounding_techniques', [])
                resources['grounding'] = grounding_techniques[:2]  # First 2 techniques
            else:
                # Fallback grounding techniques
                resources['grounding'] = [
                    {
                        "name": "5-4-3-2-1 Grounding",
                        "description": "Engage all five senses to return to the present moment",
                        "steps": ["Name 5 things you can SEE", "Name 4 things you can FEEL", "Name 3 things you can HEAR", "Name 2 things you can SMELL", "Name 1 thing you can TASTE"]
                    }
                ]
        except Exception as e:
            print(f"Error loading grounding techniques: {e}")
            # Fallback
            resources['grounding'] = [
                {
                    "name": "Focus on Breathing",
                    "description": "Pay attention to your breath to stay grounded",
                    "steps": ["Notice your breath going in and out", "Count each breath", "Focus on the sensation of breathing", "Continue until you feel calmer"]
                }
            ]
        
        # Try to load counseling resources
        try:
            if 'counseling' in self.knowledge_resources:
                counseling_resources = self.knowledge_resources['counseling'].get('crisis_counseling', [])
                resources['counseling'] = counseling_resources[:2]  # First 2 counseling resources
            else:
                # Fallback counseling
                resources['counseling'] = [
                    {
                        "title": "Immediate Crisis Support",
                        "description": "What to say and do right now in a crisis situation",
                        "steps": ["Stay calm and speak in a gentle, reassuring voice", "Validate their feelings", "Listen without judgment", "Remind them they're not alone", "Focus on the present moment"],
                        "phrases": ["I'm here for you and I care about you", "Your life matters and you are important", "These feelings will pass", "You are stronger than you think"]
                    }
                ]
        except Exception as e:
            print(f"Error loading counseling resources: {e}")
            # Fallback
            resources['counseling'] = [
                {
                    "title": "Crisis Support",
                    "description": "Immediate support for crisis situations",
                    "steps": ["Stay calm", "Listen without judgment", "Validate feelings", "Offer hope", "Get professional help"]
                }
            ]
        
        return resources
    
    def get_helpline_info(self):
        """Get helpline information"""
        return {
            "emergency": {
                "name": "Emergency Services",
                "number": "911",
                "description": "For immediate life-threatening situations"
            },
            "suicide_prevention": {
                "name": "Suicide Prevention Lifeline",
                "number": "988",
                "description": "24/7, free, confidential support"
            },
            "crisis_text": {
                "name": "Crisis Text Line",
                "number": "Text HOME to 741741",
                "description": "24/7 crisis support via text"
            },
            "international": {
                "UK": "Samaritans 116 123",
                "Canada": "988",
                "Australia": "Lifeline 13 11 14",
                "India": "+91-9820466726"
            }
        }
    
    def stop_alarm(self):
        """Stop the continuous alarm"""
        self.alarm_running = False
        self.crisis_active = False
        print("Crisis alarm stopped")
    
    def get_crisis_log(self):
        """Get crisis detection log"""
        return self.crisis_log
    
    def get_all_resources(self):
        """Get all available knowledge resources"""
        return self.knowledge_resources

# Global crisis detection system instance
crisis_system = CrisisDetectionSystem()

def trigger_crisis_response(user_input, risk_score, user_context=None):
    """
    Trigger crisis response with alarm and visual alerts
    
    Args:
        user_input (str): The triggering user input
        risk_score (float): The calculated risk score
        user_context (dict): Additional context about the user
    
    Returns:
        dict: Crisis response information
    """
    return crisis_system.trigger_crisis_alert(user_input, risk_score, user_context)

def stop_crisis_alarm():
    """Stop the crisis alarm"""
    crisis_system.stop_alarm()

def get_crisis_resources():
    """Get crisis resources for display"""
    return crisis_system.get_immediate_resources()

def get_all_knowledge_resources():
    """Get all knowledge resources"""
    return crisis_system.get_all_resources()
