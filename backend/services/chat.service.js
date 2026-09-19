const axios = require('axios');

function createChatService(chatRepository) {
  return {
    async sendChat(req, res) {
      const { session_id, message } = req.body;

      if (!message) return res.status(400).json({ error: "Message empty" });

      try {
        // Fetch previous conversation history before saving the current message
        // so the current turn is added exactly once by Flask.
        // Sort by DESC to get most recent messages, then reverse for chronological order
        const [historyRows] = await chatRepository.getRecentSessionMessages(req.user.id, session_id);
        const conversationHistory = (historyRows || []).reverse().map(row => ({
          role: row.role === 'bot' ? 'assistant' : 'user',
          text: row.message
        }));

        // Save user message after capturing only previous turns.
        await chatRepository.saveUserMessage(req.user.id, session_id, message);

        console.log("[DEBUG] Conversation history fetched:", JSON.stringify(conversationHistory, null, 2));

        // Call Flask AI with conversation history
        // Pull the URL from the .env file, but default to 5001 just in case
      const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5001';

      const aiResponse = await axios.post(`${FLASK_API_URL}/chat`, {
          message: message,
          history: conversationHistory  // FIX #3: Pass history
        });

        const botReply = aiResponse?.data?.response;
        if (typeof botReply !== 'string') {
          console.error("Invalid Flask AI response:", aiResponse?.data);
          throw new Error("Invalid AI response from Flask");
        }

        console.log("DEBUG: Flask AI Response Structure:", JSON.stringify(aiResponse.data, null, 2));
        
        const flaskData = aiResponse.data;
        const analysis = {
          intent: flaskData.analysis?.intent,
          emotion: flaskData.analysis?.emotion,
          risk: flaskData.analysis?.risk?.label || 'low_risk',
          score: flaskData.analysis?.risk?.score || 0.0
        };

        // Keep Flask safety metadata available to the frontend without
        // synthesizing values for fields Flask did not return.
        const safetyFieldNames = [
          'crisis_triggered',
          'alert',
          'resources',
          'emergency',
          'moderate_risk',
          'validation_applied',
          'rejected',
          'degraded',
          'fallback',
          'models_used',
          'model_based'
        ];
        const safety = safetyFieldNames.reduce((metadata, fieldName) => {
          if (Object.prototype.hasOwnProperty.call(flaskData, fieldName)) {
            metadata[fieldName] = flaskData[fieldName];
          }
          return metadata;
        }, {});
        
        console.log("DEBUG: Extracted Analysis:", analysis);

        // Check if response was rejected (validation_applied: true and rejected: true)
        const isRejected = aiResponse.data?.validation_applied === true && aiResponse.data?.rejected === true;
        
        // Determine risk level and status
        let riskLevel, status, emotion, riskScore;
        
        if (isRejected) {
          // For rejected responses, show "unrelated" intent and emotion
          riskLevel = 'low_risk';
          riskScore = 0.0;
          status = 'rejected';
          emotion = 'unrelated';
        } else {
          // For normal responses, use AI analysis
          riskLevel = analysis.risk || 'low_risk';
          riskScore = analysis.score || 0.0;
          status = riskLevel === 'high_risk' && riskScore > 0.6 ? 'critical' : 'normal';
          emotion = analysis.emotion;
        }
        
        // Save bot reply with correct analysis
        console.log("DEBUG: Database insertion values:", {
          user_id: req.user.id,
          session_id: session_id,
          role: 'bot',
          message: botReply.substring(0, 50) + '...',
          emotion: emotion,
          risk_level: riskLevel,
          risk_score: riskScore,
          status: status
        });

        const [result] = await chatRepository.saveBotMessage(req.user.id, session_id, botReply, analysis.emotion, riskLevel, riskScore, status);

        console.log("DEBUG: Database insertion successful, ID:", result.insertId);

        res.json({
          id: result.insertId,
          role: 'bot',
          message: botReply,
          analysis: flaskData.analysis || {},
          safety,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("AI Error:", error);

        // Graceful fallback: save a placeholder bot reply so frontend gets a 200
        // and the conversation remains consistent instead of returning 500.
        const fallbackReply = "I'm having trouble connecting to the AI service. Please try again shortly.";

        try {
          const [result] = await chatRepository.saveBotMessage(req.user.id, session_id, fallbackReply, null, 'low_risk', 0.0, 'normal');
          console.log("DEBUG: Fallback bot message saved, ID:", result.insertId);

          return res.json({
            id: result.insertId,
            role: 'bot',
            message: fallbackReply,
            analysis: {},
            safety: {
              degraded: true,
              fallback: true,
              alert: false,
              crisis_triggered: false,
              emergency: false,
              moderate_risk: false,
              validation_applied: false
            },
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Fallback DB save failed:", dbErr);
          return res.status(500).json({ error: "AI service unavailable" });
        }
      }
    },

    async getChatHistory(req, res) {
      try {
        const [rows] = await chatRepository.getUserChats(req.user.id);
        res.json(rows);
      } catch (err) {
        console.error('Get chat history error:', err);
        res.status(500).json({ error: "Database error" });
      }
    },

    async deleteSession(req, res) {
      try {

          const sessionId = req.params.sessionId;

          console.log("==================================");
          console.log("Logged in user :", req.user.id);
          console.log("Session to delete :", sessionId);

          const [rows] = await chatRepository.getUserChats(req.user.id);

          console.log("DATABASE ROWS");
          console.table(rows.map(r => ({
              id: r.id,
              user_id: r.user_id,
              session_id: r.session_id,
              role: r.role
          })));

          const [result] = await chatRepository.deleteSession(
              req.user.id,
              sessionId
          );

          console.log("DELETE RESULT");
          console.log(result);

          res.json({
              message: "Deleted",
              result
          });

      } catch(err) {
          console.error(err);
      }
  }
  };
}

module.exports = createChatService;
