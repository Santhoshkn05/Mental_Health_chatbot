# Mental Health Assistant - Complete Project Documentation

## Project Overview
The Mental Health Assistant is a comprehensive AI-powered mental health support system that provides empathetic conversations, crisis detection, and personalized emotional support through a modern web interface.

## Architecture
```
Frontend (React)  <--->  Node.js API Server  <--->  Flask AI Server
     (Port 3000)           (Port 3001)              (Port 5001)
```

## Project Structure

### Root Directory
```
e:\Major Project\
|
+-- .gitignore                    # Git ignore rules
+-- venv/                         # Python virtual environment
+-- backend/                      # Backend services
+-- frontend/                     # Frontend application
+-- result.json                   # Project results data
```

### Backend Structure
```
backend/
|
+-- PRODUCTION_READY_FLASK.py    # Main Flask AI server (Port 5001)
+-- nodejs_api_server.js          # Node.js API middleware (Port 3001)
+-- fixed_model_loader.py         # AI model management and response generation
+-- crisis_detection_system.py    # Crisis alert and monitoring system
+-- .env                          # Environment variables
+-- requirements.txt              # Python dependencies
+-- package.json                  # Node.js dependencies
+-- mindease.db                   # SQLite database
|
+-- models/                       # Trained AI models
|   +-- intent_classifier/        # User intent detection model
|   +-- emotion_classifier/       # Emotion recognition model
|   +-- risk_classifier/          # Crisis risk assessment model
|   +-- qwen_model/              # Primary response generation model
|   +-- dialogpt_model/          # Secondary response generation model
|
+-- datasets/                     # Training datasets
|   +-- intent_data/             # Intent classification data
|   +-- emotion_data/            # Emotion classification data
|   +-- risk_data/               # Risk assessment data
|
+-- knowledge_resources/          # Support resources and templates
|   +-- crisis_resources.json    # Emergency contact information
|   +-- response_templates.json  # Response templates
|
+-- suicide_risk_evaluation_results.json  # Risk assessment results
+-- templates/                    # HTML templates for crisis pages
```

### Frontend Structure
```
frontend/
|
+-- public/                       # Static assets
|   +-- index.html               # Main HTML file
|   +-- logo.png                 # Application logo
|   +-- manifest.json            # PWA manifest
|   +-- robots.txt               # SEO robots file
|
+-- src/                          # React source code
|   +-- pages/                   # React components
|   |   +-- Login.js            # Authentication page
|   |   +-- Register.js         # User registration page
|   |   +-- Dashboard.js        # Main dashboard
|   |   +-- ChatWindow.js       # Chat interface
|   |   +-- History.js          # Chat history
|   |   +-- Landing.js          # Landing page
|   |
|   +-- utils/                   # Utility functions
|   |   +-- auth.js             # Authentication utilities
|   |
|   +-- App.js                   # Main React app
|   +-- index.js                 # React entry point
|
+-- package.json                  # Node.js dependencies
+-- package-lock.json            # Dependency lock file
+-- .gitignore                   # Git ignore rules
```

## Core Components

### 1. Frontend Application (React)
- **Login.js**: User authentication with forgot password functionality
- **Dashboard.js**: Session management and chat history
- **ChatWindow.js**: Main chat interface with real-time messaging
- **History.js**: Conversation history management
- **Landing.js**: Application landing page with features overview

### 2. Node.js API Server (Port 3001)
- **Authentication**: JWT-based user authentication
- **Database Management**: SQLite database for users and chat history
- **API Endpoints**:
  - `POST /api/register` - User registration
  - `POST /api/login` - User login
  - `POST /api/chats` - Chat message handling
  - `GET /api/chats` - Chat history retrieval
  - `POST /api/forgot-password` - Password recovery
  - `POST /api/verify-otp` - OTP verification
  - `POST /api/reset-password` - Password reset

### 3. Flask AI Server (Port 5001)
- **AI Processing**: Multi-model analysis and response generation
- **Crisis Detection**: Real-time risk assessment and alerting
- **Response Generation**: Context-aware AI responses
- **Endpoints**:
  - `POST /chat` - Main chat processing endpoint
  - `GET /health` - Server health check

### 4. AI Model System
- **Intent Classifier**: Detects user intent (greeting, question, crisis, etc.)
- **Emotion Classifier**: Identifies user emotions (sad, anxious, happy, etc.)
- **Risk Classifier**: Assesses crisis risk levels (low, moderate, high)
- **Response Generation**: Qwen2.5 (primary) and DialoGPT (fallback) models

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);
```

### Chats Table
```sql
CREATE TABLE chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  role TEXT,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## AI Processing Pipeline

### 1. Input Processing
- User message received via React frontend
- Authentication verification
- Message storage in database

### 2. Multi-Model Analysis
- **Intent Classification**: User intent detection
- **Emotion Recognition**: Emotional state analysis
- **Risk Assessment**: Crisis risk evaluation

### 3. Response Generation
- **Context Building**: Sliding window of last 6 messages
- **Primary Model**: Qwen2.5 for main response generation
- **Fallback Model**: DialoGPT for backup responses
- **Quality Control**: Response validation and refinement

### 4. Crisis Management
- **High Risk**: Immediate crisis alerts and emergency resources
- **Moderate Risk**: Enhanced monitoring and support
- **Low Risk**: Standard AI response with safety checks

## Security Features

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Session management with expiration

### Data Protection
- User-specific chat isolation
- Secure API endpoints
- Input validation and sanitization

### Crisis Management
- Real-time risk assessment
- Automated crisis alerts
- Emergency response protocols

## API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User authentication
- `POST /api/forgot-password` - Password recovery initiation
- `POST /api/verify-otp` - OTP verification
- `POST /api/reset-password` - Password reset completion

### Chat System
- `POST /api/chats` - Send chat message
- `GET /api/chats` - Retrieve chat history
- `DELETE /api/chats/:sessionId` - Delete chat session

### AI Processing
- `POST /chat` - AI chat processing (Flask)
- `GET /health` - Server health check

## Environment Configuration

### Backend Environment (.env)
```
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
PORT=3001
```

### Python Dependencies (requirements.txt)
```
flask==2.3.3
torch==2.0.1
transformers==4.33.2
sqlite3
bcrypt==4.0.1
jsonwebtoken==9.0.2
nodemailer==6.9.4
cors==2.8.5
axios==1.5.0
```

### Node.js Dependencies (package.json)
```
{
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.4",
    "cors": "^2.8.5",
    "axios": "^1.5.0"
  }
}
```

## Frontend Dependencies
```
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^10.16.4"
  }
}
```

## Installation and Setup

### 1. Backend Setup
```bash
# Navigate to backend directory
cd e:\Major Project\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Set up environment variables
# Copy .env file and configure with your settings
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd e:\Major Project\frontend

# Install Node.js dependencies
npm install
```

### 3. Start Services
```bash
# Start Flask AI Server (Terminal 1)
cd e:\Major Project\backend
python PRODUCTION_READY_FLASK.py

# Start Node.js API Server (Terminal 2)
cd e:\Major Project\backend
node nodejs_api_server.js

# Start React Frontend (Terminal 3)
cd e:\Major Project\frontend
npm start
```

## Usage

### 1. User Registration
- Navigate to `http://localhost:3000/register`
- Fill in name, email, and password
- Click "Sign Up"

### 2. User Login
- Navigate to `http://localhost:3000/login`
- Enter email and password
- Click "Sign In"

### 3. Chat Interface
- After login, you'll be redirected to the dashboard
- Click "New Chat" to start a conversation
- Type your message and press Enter
- AI will respond with empathetic support

### 4. Password Recovery
- On login page, click "Forgot Password?"
- Enter your registered email
- Check email for OTP code
- Enter OTP and new password to reset

## Crisis Management

### High Risk Detection
- Automatic crisis alerts
- Emergency resource display
- Crisis hotline information
- Immediate support protocols

### Emergency Resources
- Kiran Mental Health Helpline: 1800-599-0019
- AASRA (Suicide Prevention): 9820466726
- National Suicide Prevention Lifeline: 988
- Emergency Services: 911

## Model Performance

### Intent Classification
- Accuracy: ~92%
- Classes: greeting, question, crisis, statement, thanks, goodbye

### Emotion Recognition
- Accuracy: ~89%
- Emotions: sad, anxious, happy, angry, neutral, confused

### Risk Assessment
- Accuracy: ~95%
- Levels: low_risk, moderate_risk, high_risk

### Response Generation
- Primary Model: Qwen2.5 (150 tokens max)
- Fallback Model: DialoGPT (150 tokens max)
- Quality Control: Hallucination detection and validation

## Monitoring and Logging

### System Logs
- User interaction tracking
- AI response quality metrics
- System performance monitoring
- Error tracking and reporting

### Crisis Monitoring
- High-risk intervention tracking
- Alert system status
- Emergency protocol activation
- Resource utilization metrics

## Troubleshooting

### Common Issues

#### 1. Server Connection Failed
- Ensure Node.js server is running on port 3001
- Check Flask server is running on port 5001
- Verify network connectivity

#### 2. AI Response Truncation
- Check model token limits (max_new_tokens: 150)
- Verify response cleaning filters
- Monitor model loading status

#### 3. Authentication Issues
- Verify JWT secret configuration
- Check database connection
- Ensure password hashing is working

#### 4. Crisis Alerts Not Working
- Verify crisis detection system is loaded
- Check audio system for alerts
- Ensure crisis templates are accessible

### Debug Mode
Enable debug logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## Future Enhancements

### Planned Features
1. Voice input/output integration
2. Multi-language support
3. Video counseling integration
4. Advanced analytics dashboard
5. Mobile application
6. Integration with healthcare providers

### Technical Improvements
1. Model fine-tuning with user feedback
2. Enhanced context handling
3. Real-time collaboration features
4. Improved security measures
5. Performance optimization

## Support and Maintenance

### Regular Maintenance
- Database backups
- Model performance monitoring
- Security updates
- Dependency updates

### Support Contact
- Technical issues: Check system logs
- Crisis emergencies: Use emergency resources
- Feature requests: Submit through GitHub issues

## License and Terms

This project is developed for mental health support purposes and should be used in accordance with healthcare guidelines and regulations. Always consult with qualified healthcare professionals for medical advice and treatment.

---

**Note**: This documentation covers the complete Mental Health Assistant system. For specific implementation details, refer to the individual component files and inline code comments.
