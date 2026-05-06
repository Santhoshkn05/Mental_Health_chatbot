# MindEase Mental Health AI Chatbot

A comprehensive mental health support application featuring AI-powered crisis detection, real-time chat, and administrative dashboard.

## 🚀 Features

### Core Features
- **AI-Powered Chat**: Intelligent conversation system with mental health support
- **Crisis Detection**: Real-time risk assessment and intervention
- **Speech Recognition**: Voice input with Web Speech API
- **Text-to-Speech**: Audio responses for accessibility
- **Multi-language Support**: Translation capabilities

### User Features
- User authentication and registration
- Personal dashboard
- Chat history tracking
- Profile management
- Emergency resources access

### Admin Features
- Admin dashboard
- User management
- Crisis monitoring
- System analytics

## 🏗️ Project Structure

```
Project/
├── backend/                 # Node.js + Python backend
│   ├── src/
│   │   ├── controllers/     # API handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── config/             # Configuration files
│   ├── tests/              # Test files
│   └── knowledge_resources/ # AI model resources
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── pages/          # Page components
    │   ├── hooks/          # Custom hooks
    │   ├── context/        # React context
    │   ├── services/       # API services
    │   └── utils/          # Frontend utilities
    └── public/             # Static assets
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **Python** with Flask
- **SQLite** database
- **JWT** authentication
- **Groq AI** API integration
- **Nodemailer** for email services

### Frontend
- **React** 19.x
- **React Router** for navigation
- **Bootstrap** for styling
- **Lucide React** for icons
- **Framer Motion** for animations

### AI/ML
- **Natural Language Processing** for sentiment analysis
- **Crisis detection algorithms**
- **Speech recognition** and synthesis

## 📋 Prerequisites

- Node.js 16+ 
- Python 3.8+
- npm or yarn
- Git

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Santhoshkn05/Mental_Health_chatbot.git
cd Mental_Health_chatbot
```

### 2. Backend Setup

#### Node.js Backend
```bash
cd backend
npm install
```

#### Python Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Configuration
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3001
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GROQ_API_KEY=your_groq_api_key_here
```

### Required API Keys
1. **Groq AI API**: For AI chat responses
2. **Email Service**: Gmail or other SMTP service
3. **JWT Secret**: For authentication tokens

## 🏃‍♂️ Running the Application

### Start Backend
```bash
cd backend
npm run dev  # Development mode with nodemon
# or
node nodejs_api_server.js  # Production mode
```

### Start Frontend
```bash
cd frontend
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🧪 Testing

### Backend Tests
```bash
cd backend
python test_crisis_detection.py
python test_metric.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Database Setup

The application uses SQLite for data storage. The database is automatically initialized on first run.

### Database Migration
```bash
cd backend
node database_migration.js
```

## 🔐 Authentication

- **JWT-based** authentication system
- **Role-based** access control (User/Admin)
- **Protected routes** for sensitive operations

## 🚨 Crisis Detection

The system includes sophisticated crisis detection:
- **Sentiment analysis** of user messages
- **Risk level assessment** (low/high)
- **Automatic alerts** for high-risk situations
- **Emergency resource** recommendations

## 🌍 Features in Detail

### Chat System
- Real-time messaging
- Voice input/output
- Message history
- Crisis intervention prompts

### Dashboard
- User statistics
- Chat analytics
- Crisis monitoring
- System health

### Admin Panel
- User management
- Content moderation
- System configuration
- Analytics reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For mental health emergencies, please contact:
- **Emergency Services**: 911
- **Crisis Hotline**: 988 (US)
- **Local Mental Health Services**

## 📞 Contact

- **GitHub**: [@Santhoshkn05](https://github.com/Santhoshkn05)
- **Project Issues**: [GitHub Issues](https://github.com/Santhoshkn05/Mental_Health_chatbot/issues)

## 🙏 Acknowledgments

- Groq AI for providing the AI API
- React community for excellent documentation
- Mental health professionals for guidance and insights

---

**⚠️ Disclaimer**: This application is designed to provide support and is not a substitute for professional medical advice. Always consult with qualified healthcare professionals for mental health concerns.
