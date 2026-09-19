const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createAdminService({ adminRepository, secret }) {
  return {
    async login(req, res) {
      const { username, password } = req.body;

      try {
        const [rows] = await adminRepository.findByUsername(username);
        const admin = rows[0];

        if (!admin) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const result = await bcrypt.compare(password, admin.password);
        if (!result) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin.id, username: admin.username }, secret, { expiresIn: '24h' });
        res.json({
          token,
          username: admin.username,
          message: "Admin login successful"
        });
      } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: "Database error" });
      }
    },

    async getLogs(req, res) {
      try {
        const [rows] = await adminRepository.getLogs();
        
        res.json({
          logs: rows || [],
          total: rows.length
        });
      } catch (err) {
        console.error('Admin logs error:', err);
        res.status(500).json({ error: "Database error" });
      }
    },

    async updateStatus(req, res) {
      const { chat_id, status } = req.body;

      if (!chat_id || !status) {
        return res.status(400).json({ error: "Missing chat_id or status" });
      }

      const validStatuses = ['pending', 'critical', 'normal', 'reviewed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const [result] = await adminRepository.updateStatus(chat_id, status);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.json({
        message: "Status updated successfully",
        chat_id: chat_id,
        new_status: status
      });
    }
  };
}

module.exports = createAdminService;
