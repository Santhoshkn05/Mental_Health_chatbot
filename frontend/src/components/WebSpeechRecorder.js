import React, { useState, useRef, useEffect } from 'react';

/**
 * Web Speech API Component
 * Speech-to-Text with language support (English, Hindi, Telugu)
 * No backend required - runs entirely in browser
 */

const WebSpeechRecorder = ({ onTranscriptReceived }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const interimTranscriptRef = useRef('');

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('❌ Web Speech API not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    // Start listening
    recognition.onstart = () => {
      console.log('[STT] Listening started...');
      setIsListening(true);
      setError('');
      setTranscript('');
      interimTranscriptRef.current = '';
    };

    // Capture results
    recognition.onresult = (event) => {
      interimTranscriptRef.current = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcriptSegment + ' ');
        } else {
          interimTranscriptRef.current += transcriptSegment;
        }
      }
    };

    // When done listening
    recognition.onend = () => {
      console.log('[STT] Listening ended');
      setIsListening(false);
    };

    // Handle errors
    recognition.onerror = (event) => {
      console.error('[STT Error]', event.error);
      let errorMsg = '';

      switch (event.error) {
        case 'no-speech':
          errorMsg = '❌ No speech detected. Try again.';
          break;
        case 'audio-capture':
          errorMsg = '❌ No microphone found. Check permissions.';
          break;
        case 'network':
          errorMsg = '❌ Network error. Check your connection.';
          break;
        default:
          errorMsg = `❌ Error: ${event.error}`;
      }

      setError(errorMsg);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Update language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Start recording
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError('');
      recognitionRef.current.start();
    }
  };

  // Stop recording
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  // Send transcription to backend
  const sendToBackend = async () => {
    if (!transcript.trim()) {
      setError('❌ No transcript to send');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[CHAT] Sending:', transcript);
      
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript.trim(),
          history: []
        })
      });

      const result = await response.json();

      if (result.response) {
        console.log('[CHAT] Response:', result.response);
        setError('✅ Message sent to chatbot!');
        if (onTranscriptReceived) {
          onTranscriptReceived({
            input: transcript.trim(),
            output: result.response,
            status: result.alert ? 'ALERT' : 'OK'
          });
        }
        setTranscript('');
      } else {
        setError(`❌ Bot: ${result.error || 'No response'}`);
      }
    } catch (err) {
      setError(`❌ Connection error: ${err.message}`);
      console.error('Backend error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear transcript
  const clearTranscript = () => {
    setTranscript('');
    setError('');
  };

  return (
    <div style={styles.container}>
      <h2>🎤 Web Speech Recorder</h2>

      {/* Language Selector */}
      <div style={styles.languageSelector}>
        <label>Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isListening}
          style={styles.select}
        >
          <option value="en-US">🇺🇸 English (US)</option>
          <option value="en-GB">🇬🇧 English (UK)</option>
          <option value="hi-IN">🇮🇳 Hindi</option>
          <option value="te-IN">🇮🇳 Telugu</option>
        </select>
      </div>

      {/* Status Message */}
      {isListening && (
        <div style={{ ...styles.statusBox, backgroundColor: '#cfe2ff', borderColor: '#0c5ff4' }}>
          🎤 Listening... {interimTranscriptRef.current && `(${interimTranscriptRef.current})`}
        </div>
      )}

      {isProcessing && (
        <div style={{ ...styles.statusBox, backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
          ⏳ Processing...
        </div>
      )}

      {error && (
        <div
          style={{
            ...styles.statusBox,
            backgroundColor: error.includes('✅') ? '#d4edda' : '#f8d7da',
            borderColor: error.includes('✅') ? '#28a745' : '#dc3545',
            color: error.includes('✅') ? '#155724' : '#721c24'
          }}
        >
          {error}
        </div>
      )}

      {/* Button Group */}
      <div style={styles.buttonGroup}>
        <button
          onClick={startListening}
          disabled={isListening}
          style={{ ...styles.button, ...styles.recordButton, opacity: isListening ? 0.5 : 1 }}
        >
          🔴 Start Recording
        </button>

        <button
          onClick={stopListening}
          disabled={!isListening}
          style={{ ...styles.button, ...styles.stopButton, opacity: !isListening ? 0.5 : 1 }}
        >
          ⏹️ Stop Recording
        </button>

        <button
          onClick={clearTranscript}
          style={styles.button}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Transcript Display */}
      <div style={styles.transcriptBox}>
        <label>Transcript:</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your speech will appear here..."
          style={styles.textarea}
          readOnly={isListening}
        />
      </div>

      {/* Send Button */}
      <button
        onClick={sendToBackend}
        disabled={!transcript.trim() || isListening || isProcessing}
        style={{
          ...styles.button,
          ...styles.sendButton,
          opacity: !transcript.trim() || isListening ? 0.5 : 1
        }}
      >
        {isProcessing ? '⏳ Sending...' : '📤 Send to Chatbot'}
      </button>

      {/* Info */}
      <div style={styles.info}>
        <small>💡 Tip: Speak naturally. Supports English, Hindi, and Telugu.</small>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '25px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif'
  },
  languageSelector: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  statusBox: {
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '2px solid',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '15px'
  },
  button: {
    padding: '12px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  recordButton: {
    backgroundColor: '#dc3545',
    color: 'white'
  },
  stopButton: {
    backgroundColor: '#ffc107',
    color: 'black'
  },
  sendButton: {
    backgroundColor: '#007bff',
    color: 'white',
    width: '100%',
    gridColumn: '1 / -1'
  },
  transcriptBox: {
    marginBottom: '15px'
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    marginTop: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    resize: 'vertical'
  },
  info: {
    marginTop: '15px',
    textAlign: 'center',
    color: '#666'
  }
};

export default WebSpeechRecorder;
