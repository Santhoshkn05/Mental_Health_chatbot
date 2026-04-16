// Crisis Detection Utility - ENHANCED with comprehensive ML-friendly keywords
export const crisisKeywords = [
  // Direct suicide statements
  'suicide', 'suicidal', 'kill myself', 'kill myself',
  'end my life', 'end it all', 'want to die', 
  'don\'t want to live', 'dont want to live',
  'i dont want to live anymore', 'i don\'t want to live anymore',
  
  // Self-harm
  'hurt myself', 'self harm', 'self-harm', 'harm myself',
  'cut myself', 'injure myself', 'wound myself',
  
  // Hopelessness/despair
  'no reason to live', 'no point living', 'pointless',
  'hopeless', 'hopelessness', 
  'can\'t go on', 'cant go on', 'give up',
  'lost all hope', 'no hope',
  
  // Burden statements
  'better off dead', 'no way out', 'burden',
  'burden to others', 'world better without me',
  'nobody needs me', 'worthless',
  
  // Goodbye/Final statements
  'goodbye forever', 'final goodbye', 'goodbye world',
  'farewell', 'last message', 'last time',
  
  // Escape/Disappearance
  'want to vanish', 'disappear', 'go away forever',
  'escape this life',
  
  // Extreme suffering
  'pain too much', 'unbearable pain', 'suffering too much',
  'can\'t take it anymore', 'cant take it anymore',
  
  // Planning (very high risk)
  'going to kill', 'planning to', 'method',
  'ways to', 'already decided',
  
  // Crisis keywords (existing)
  'not worth living', 'pain too much', 'want to vanish'
];

export const detectCrisis = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowercaseText = text.toLowerCase();
  return crisisKeywords.some(keyword => lowercaseText.includes(keyword));
};

export const playAlarmSound = () => {
  try {
    // Create audio context for alarm sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for continuous alarm tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set alarm frequency (high-pitched alert sound)
    oscillator.frequency.value = 1000; // Higher frequency for more urgency
    oscillator.type = 'square'; // Harsher sound for alarm
    
    // Set volume (noticeable but not too loud)
    gainNode.gain.value = 0.4;
    
    // Create continuous beeping pattern
    const currentTime = audioContext.currentTime;
    for (let i = 0; i < 10; i++) {
      const beepTime = currentTime + (i * 0.8);
      gainNode.gain.setValueAtTime(0, beepTime);
      gainNode.gain.setValueAtTime(0.4, beepTime + 0.1);
      gainNode.gain.setValueAtTime(0, beepTime + 0.2);
      gainNode.gain.setValueAtTime(0.4, beepTime + 0.3);
      gainNode.gain.setValueAtTime(0, beepTime + 0.4);
    }
    
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 8); // 8 seconds of continuous alarm
    
  } catch (error) {
    console.warn('Could not play alarm sound:', error);
    // Fallback: use browser notification if audio fails
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Crisis Alert', {
        body: 'Crisis keywords detected in conversation',
        icon: '/favicon.ico'
      });
    }
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};
