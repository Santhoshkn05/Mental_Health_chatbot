function createUserRepository(pool) {
  return {
    createUser(name, email, hashedPassword, verificationToken, verificationExpireAt) {
      return pool.execute(
        `INSERT INTO users (name, email, password, email_verified, verification_token, verification_expires_at) VALUES (?, ?, ?, FALSE, ?, ?)`,
        [name, email, hashedPassword, verificationToken, verificationExpireAt]
      );
    },

    findByEmail(email) {
      return pool.execute(
        `SELECT * FROM users WHERE email = ?`,
        [email]
      );
    },

    findVerificationStatusByEmail(email) {
      return pool.execute(
        `SELECT email_verified FROM users WHERE email = ?`,
        [email]
      );
    },

    findByVerificationToken(token) {
      return pool.execute(
        `SELECT * FROM users WHERE verification_token = ?`,
        [token]
      );
    },
    verifyEmailByToken(token) {
      return pool.execute(
        `UPDATE users
        SET email_verified = TRUE
        WHERE verification_token = ? AND verification_expires_at > NOW()`,
        [token]
      );
    },

    findEmailAndNameByEmail(email) {
      return pool.execute(
        `SELECT email, name FROM users WHERE email = ?`,
        [email]
      );
    },

    updatePasswordByEmail(hashedPassword, email) {
      return pool.execute(
        `UPDATE users SET password = ? WHERE email = ?`,
        [hashedPassword, email]
      );
    }
  };
}

module.exports = createUserRepository;
