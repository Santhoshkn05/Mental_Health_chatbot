import React, { useState, useRef } from 'react';

/**
 * TranslationAndSTTTest Component
 * Tests Speech-to-Text (Whisper) and Translation (LibreTranslate)
 */

export default function TranslationAndSTTTest() {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  // Language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' }
  ];

  // ============ TRANSLATION FUNCTIONS ============

  const handleTranslate = async () => {
    if (!text) {
      setMessage('❌ Please enter text to translate');
      return;
    }

    setLoading(true);
    setMessage('Translating...');

    try {
      const response = await fetch('http://localhost:5001/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          source_language: sourceLanguage,
          target_language: targetLanguage
        })
      });

      const result = await response.json();

      if (result.success) {
        setTranslatedText(result.translated_text);
        setMessage(`✅ Translation successful!`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Connection error: ${error.message}`);
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ START RECORDING ============

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.onstart = () => {
        setMessage('🎤 Recording started...');
        setIsRecording(true);
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioFile(audioBlob);
        setMessage('✅ Recording stopped. Click "Transcribe" to convert to text.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      setMessage(`❌ Microphone error: ${error.message}`);
      console.error('Recording error:', error);
    }
  };

  // ============ STOP RECORDING ============

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // ============ TRANSCRIBE AUDIO ============

  const handleTranscribe = async () => {
    if (!audioFile) {
      setMessage('❌ No audio file. Record audio first or upload a file.');
      return;
    }

    setLoading(true);
    setMessage('Transcribing audio...');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile, 'audio.wav');
      formData.append('language', 'auto');

      const response = await fetch('http://localhost:5001/speech-to-text', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setTranscribedText(result.text);
        setMessage(`✅ Transcription successful! Language detected: ${result.language}`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Connection error: ${error.message}`);
      console.error('Transcription error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLE FILE UPLOAD ============

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setMessage(`✅ Audio file selected: ${file.name}`);
    }
  };

  // ============ CLEAR ALL ============

  const clearAll = () => {
    setText('');
    setTranslatedText('');
    setTranscribedText('');
    setAudioFile(null);
    setMessage('');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎤 Speech-to-Text & Translation Tester</h1>

      {/* Status Message */}
      {message && (
        <div style={{
          ...styles.messageBox,
          backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('🎤') ? '#cfe2ff' : '#f8d7da',
          borderColor: message.includes('✅') ? '#28a745' : message.includes('🎤') ? '#0c5ff4' : '#dc3545',
          color: message.includes('✅') ? '#155724' : message.includes('🎤') ? '#004085' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <div style={styles.grid}>
        {/* ========== SPEECH-TO-TEXT SECTION ========== */}
        <div style={styles.section}>
          <h2>🎤 Speech-to-Text (Whisper)</h2>

          <div style={styles.buttonGroup}>
            <button
              onClick={startRecording}
              disabled={isRecording}
              style={{ ...styles.button, ...styles.recordButton, opacity: isRecording ? 0.5 : 1 }}
            >
              🔴 Start Recording
            </button>

            <button
              onClick={stopRecording}
              disabled={!isRecording}
              style={{ ...styles.button, ...styles.stopButton, opacity: !isRecording ? 0.5 : 1 }}
            >
              ⏹️ Stop Recording
            </button>
          </div>

          <div style={styles.orDivider}>OR</div>

          <div style={styles.fileInput}>
            <label>Upload Audio File:</label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={styles.input}
            />
            <small>Supported: WAV, MP3, M4A, MP4, FLAC, OGG, OPUS, AAC (Max 25MB)</small>
          </div>

          <button
            onClick={handleTranscribe}
            disabled={!audioFile || loading}
            style={{ ...styles.button, ...styles.primaryButton, opacity: !audioFile ? 0.5 : 1 }}
          >
            {loading ? '⏳ Transcribing...' : '📝 Transcribe Audio'}
          </button>

          {transcribedText && (
            <div style={styles.output}>
              <strong>Transcribed Text:</strong>
              <p>{transcribedText}</p>
            </div>
          )}
        </div>

        {/* ========== TRANSLATION SECTION ========== */}
        <div style={styles.section}>
          <h2>🌐 Translation (LibreTranslate)</h2>

          <div style={styles.languageSelector}>
            <div>
              <label>From:</label>
              <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} style={styles.select}>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.swapButton}>
              <button onClick={() => {
                setSourceLanguage(targetLanguage);
                setTargetLanguage(sourceLanguage);
              }} style={styles.button}>
                ⇄ Swap
              </button>
            </div>

            <div>
              <label>To:</label>
              <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} style={styles.select}>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label>Text to Translate:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or paste transcribed text here..."
            style={styles.textarea}
          />

          <button
            onClick={handleTranslate}
            disabled={!text || loading}
            style={{ ...styles.button, ...styles.primaryButton, opacity: !text ? 0.5 : 1 }}
          >
            {loading ? '⏳ Translating...' : '🌐 Translate'}
          </button>

          {translatedText && (
            <div style={styles.output}>
              <strong>Translated Text:</strong>
              <p>{translatedText}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== EXAMPLE WORKFLOW ========== */}
      <div style={styles.workflow}>
        <h3>📋 Quick Workflow:</h3>
        <ol>
          <li>Click <strong>"Start Recording"</strong> to record your voice</li>
          <li>Click <strong>"Stop Recording"</strong> when done</li>
          <li>Click <strong>"Transcribe Audio"</strong> to convert speech to text</li>
          <li>Transcribed text appears on the right</li>
          <li>Select target language and click <strong>"Translate"</strong></li>
          <li>View translated text</li>
        </ol>
      </div>

      {/* Clear Button */}
      <button onClick={clearAll} style={styles.clearButton}>
        🗑️ Clear All
      </button>
    </div>
  );
}

// ============ STYLES ============

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontSize: '32px'
  },
  messageBox: {
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '5px',
    border: '2px solid',
    fontSize: '16px',
    fontWeight: 'bold',
    animation: 'slideIn 0.3s ease-in'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '30px'
  },
  section: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
    width: '100%'
  },
  recordButton: {
    backgroundColor: '#dc3545',
    color: 'white'
  },
  stopButton: {
    backgroundColor: '#ffc107',
    color: 'black'
  },
  clearButton: {
    display: 'block',
    margin: '20px auto',
    padding: '12px 30px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  orDivider: {
    textAlign: 'center',
    margin: '20px 0',
    color: '#999',
    fontWeight: 'bold'
  },
  fileInput: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '8px',
    marginBottom: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px'
  },
  select: {
    width: '100%',
    padding: '8px',
    marginTop: '8px',
    marginBottom: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px'
  },
  textarea: {
    width: '100%',
    height: '120px',
    padding: '10px',
    marginTop: '8px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    resize: 'vertical'
  },
  output: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    borderLeft: '4px solid #28a745'
  },
  languageSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '10px',
    marginBottom: '15px',
    alignItems: 'flex-end'
  },
  swapButton: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  workflow: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  }
};
