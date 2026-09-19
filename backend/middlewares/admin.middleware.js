const jwt = require('jsonwebtoken');

function createAuthenticateAdmin(secret) {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secret, (err, admin) => {
      if (err) return res.sendStatus(403);
      req.admin = admin;
      next();
    });
  };
}

module.exports = createAuthenticateAdmin;
