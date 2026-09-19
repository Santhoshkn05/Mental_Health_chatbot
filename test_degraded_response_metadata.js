const assert = require('assert');
const axios = require('./backend/node_modules/axios');
const createChatService = require('./backend/services/chat.service');

const repository = {
  getRecentSessionMessages: async () => [[]],
  saveUserMessage: async () => [{}],
  saveBotMessage: async () => [{ insertId: 7 }]
};

const originalPost = axios.post;
axios.post = async () => {
  throw new Error('AI service unavailable');
};

const service = createChatService(repository);
const response = {
  json(payload) {
    this.payload = payload;
  },
  status(code) {
    this.statusCode = code;
    return this;
  }
};

service.sendChat(
  {
    body: { session_id: 'session-1', message: 'I feel overwhelmed' },
    user: { id: 1 }
  },
  response
).then(() => {
  try {
    assert.strictEqual(response.statusCode, undefined);
    assert.strictEqual(response.payload.message, "I'm having trouble connecting to the AI service. Please try again shortly.");
    assert.deepStrictEqual(response.payload.safety, {
      degraded: true,
      fallback: true,
      alert: false,
      crisis_triggered: false,
      emergency: false,
      moderate_risk: false,
      validation_applied: false
    });
    console.log('DEGRADED_NETWORK_METADATA_OK');
  } finally {
    axios.post = originalPost;
  }
}).catch(error => {
  axios.post = originalPost;
  console.error(error);
  process.exitCode = 1;
});
