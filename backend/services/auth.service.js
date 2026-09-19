const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function createAuthService({
  userRepository,
  transporter,
  otpStore,
  secret
}) {
  return {

    // =====================================================
    // REGISTER
    // =====================================================
    async register(req, res) {
      try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
          return res.status(400).json({
            error: "All fields are required"
          });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Validate name
        if (normalizedName.length < 2) {
          return res.status(400).json({
            error: "Name should be min 2 characters long."
          });
        }

        if (normalizedName.length > 255) {
          return res.status(400).json({
            error: "Name should not exceed 255 characters."
          });
        }

        // Validate email
        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
          return res.status(400).json({
            error: "Please enter valid email address"
          });
        }

        // Gmail only
        if (!normalizedEmail.endsWith("@gmail.com")) {
          return res.status(400).json({
            error: "Only @gmail.com addresses can be accessed"
          });
        }

        // Validate password
        if (password.length < 8) {
          return res.status(400).json({
            error: "Password must be min 8 characters long"
          });
        }

        // Check existing user
        const [existingUsers] =
          await userRepository.findByEmail(
            normalizedEmail
          );

        if (existingUsers.length > 0) {
          return res.status(409).json({
            error: "Email already exists"
          });
        }

        // Hash password
        const hashedPassword =
          await bcrypt.hash(password, 12);

        // Generate email verification token
        const verificationToken =
          crypto.randomBytes(32).toString('hex');

        // Token expires after 15 minutes
        const verificationExpiresAt =
          new Date(
            Date.now() + 15 * 60 * 1000
          );

        // Create user
        await userRepository.createUser(
          normalizedName,
          normalizedEmail,
          hashedPassword,
          verificationToken,
          verificationExpiresAt
        );

        // Create verification link
        const verificationLink =
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(
            verificationToken
          )}`;

        // Send verification email
        const emailInfo =
          await transporter.sendMail({
            from: process.env.EMAIL_USER,

            to: normalizedEmail,

            subject:
              'Verify your MindEase account',

            html: `
              <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
              ">

                <h2>
                  Welcome to MindEase
                </h2>

                <p>
                  Hello ${normalizedName},
                </p>

                <p>
                  Please verify your email address
                  by clicking the button below.
                </p>

                <a
                  href="${verificationLink}"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#4f46e5;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                  "
                >
                  Verify Email
                </a>

                <p style="
                  margin-top:20px;
                  color:#666;
                ">
                  This verification link will expire
                  in 15 minutes.
                </p>

              </div>
            `
          });

        console.log(
          "Verification email result:",
          {
            messageId:
              emailInfo.messageId,

            accepted:
              emailInfo.accepted,

            rejected:
              emailInfo.rejected,

            response:
              emailInfo.response
          }
        );

        return res.status(201).json({
          message:
            "Verification email sent successfully"
        });

      } catch (err) {
        console.error(
          "Register error:",
          err
        );

        return res.status(500).json({
          error:
            "Unable to create account. Please try again later."
        });
      }
    },


    // =====================================================
    // CHECK EMAIL VERIFICATION STATUS
    // =====================================================
    async checkEmailVerification(req, res) {
      const { email } = req.query;

      if (
        !email ||
        typeof email !== "string"
      ) {
        return res.status(400).json({
          error: "Email is required"
        });
      }

      try {
        const normalizedEmail =
          email.trim().toLowerCase();

        const [rows] =
          await userRepository
            .findVerificationStatusByEmail(
              normalizedEmail
            );

        if (rows.length === 0) {
          return res.status(404).json({
            error: "Email is not registered"
          });
        }

        return res.status(200).json({
          verified:
            Boolean(
              rows[0].email_verified
            )
        });

      } catch (err) {
        console.error(
          "Verification status error:",
          err
        );

        return res.status(500).json({
          error:
            "Unable to check email verification status"
        });
      }
    },


    // =====================================================
    // VERIFY EMAIL
    // =====================================================
    async verifyEmail(req, res) {
      try {
        const { token } = req.query;

        console.log(
          "[DEBUG] Email verification request received"
        );

        // Check token
        if (!token) {
          console.log(
            "[DEBUG] Verification token is missing"
          );

          return res.status(400).json({
            error:
              "Verification token is required"
          });
        }

        // Find user by verification token
        const [rows] =
          await userRepository
            .findByVerificationToken(
              token
            );

        if (rows.length === 0) {
          console.log(
            "[DEBUG] Invalid verification token"
          );

          return res.status(400).json({
            error:
              "Invalid or expired verification link"
          });
        }

        const user = rows[0];

        console.log(
          "[DEBUG] User found:",
          user.email
        );

        // Already verified
        if (user.email_verified) {
          return res.status(200).json({
            message:
              "Email is already verified",

            email:
              user.email
          });
        }

        // Check token expiry
        if (
          !user.verification_expires_at ||
          new Date(
            user.verification_expires_at
          ) < new Date()
        ) {
          console.log(
            "[DEBUG] Verification token has expired"
          );

          return res.status(400).json({
            error:
              "Verification link has expired"
          });
        }

        // Mark email as verified
        const [updateResult] =
          await userRepository
            .verifyEmailByToken(
              token
            );

        if (
          updateResult.affectedRows !== 1
        ) {
          return res.status(400).json({
            error:
              "Invalid or expired verification link"
          });
        }

        console.log(
          "[DEBUG] Email verified successfully:",
          user.email
        );

        return res.status(200).json({
          message:
            "Email verified successfully",

          email:
            user.email
        });

      } catch (err) {
        console.error(
          "Email verification error:",
          err
        );

        return res.status(500).json({
          error:
            "Unable to verify email. Please try again."
        });
      }
    },


    // =====================================================
    // LOGIN
    // =====================================================
    async login(req, res) {
      const {
        email,
        password
      } = req.body;

      // Validate request
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Email and password are required"
        });
      }

      try {
        const normalizedEmail =
          email.trim().toLowerCase();

        console.log(
          "[LOGIN DEBUG] Email:",
          normalizedEmail
        );

        console.log(
          "[LOGIN DEBUG] Password received:",
          Boolean(password)
        );

        // Find user
        const [rows] =
          await userRepository.findByEmail(
            normalizedEmail
          );

        console.log(
          "[LOGIN DEBUG] Users found:",
          rows.length
        );

        const user = rows[0];

        // User not found
        if (!user) {
          console.log(
            "[LOGIN DEBUG] User not found"
          );

          return res.status(401).json({
            error:
              "Invalid credentials"
          });
        }

        console.log(
          "[LOGIN DEBUG] User:",
          user.email
        );

        console.log(
          "[LOGIN DEBUG] Email verified:",
          user.email_verified
        );

        console.log(
          "[LOGIN DEBUG] Has password hash:",
          Boolean(user.password)
        );

        // Compare password
        const passwordMatches =
          await bcrypt.compare(
            password,
            user.password
          );

        console.log(
          "[LOGIN DEBUG] Password matches:",
          passwordMatches
        );

        // Invalid password
        if (!passwordMatches) {
          return res.status(401).json({
            error:
              "Invalid credentials"
          });
        }

        // Email not verified
        if (!user.email_verified) {
          return res.status(403).json({
            error:
              "Please verify your email address before logging in."
          });
        }

        // Generate JWT
        const token =
          jwt.sign(
            {
              id: user.id
            },
            secret,
            {
              expiresIn: "1d"
            }
          );

        console.log(
          "[LOGIN DEBUG] Login successful:",
          user.email
        );

        return res.status(200).json({
          token,
          name: user.name,
          email: user.email,
          userId: user.id
        });

      } catch (err) {
        console.error(
          "[LOGIN ERROR]",
          err
        );

        return res.status(500).json({
          error:
            "Database error"
        });
      }
    },


    // =====================================================
    // FORGOT PASSWORD
    // =====================================================
    async forgotPassword(req, res) {
      const { email } = req.body;

      if (
        !email ||
        typeof email !== "string"
      ) {
        return res.status(400).json({
          error:
            "Email required"
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      console.log(
        `[DEBUG] Checking if email exists: ${normalizedEmail}`
      );

      try {
        const [rows] =
          await userRepository
            .findEmailAndNameByEmail(
              normalizedEmail
            );

        const user = rows[0];

        console.log(
          "[DEBUG] Database query result:",
          user
        );

        if (!user) {
          return res.status(400).json({
            error:
              "This email is not registered in our system."
          });
        }

        // Generate six-digit OTP
        const otp =
          Math.floor(
            100000 +
            Math.random() * 900000
          ).toString();

        otpStore[normalizedEmail] = {
          otp,
          timestamp: Date.now(),
          verified: false
        };

        // OTP expires after 10 minutes
        setTimeout(() => {
          delete otpStore[
            normalizedEmail
          ];
        }, 10 * 60 * 1000);

        // Email content
        const mailOptions = {
          from:
            process.env.EMAIL_USER,

          to:
            normalizedEmail,

          subject:
            "MindEase Password Reset Code",

          text:
            `Your password reset code is: ${otp}\n\n` +
            `This code will expire in 10 minutes.\n\n` +
            `If you didn't request this, please ignore this email.`
        };

        await transporter.sendMail(
          mailOptions
        );

        console.log(
          "[DEBUG] Password reset OTP sent to:",
          normalizedEmail
        );

        return res.status(200).json({
          message:
            "Reset code sent to your email"
        });

      } catch (error) {
        console.error(
          "Forgot password error:",
          error
        );

        return res.status(500).json({
          error:
            "Server error"
        });
      }
    },


    // =====================================================
    // VERIFY OTP
    // =====================================================
    verifyOtp(req, res) {
      const {
        email,
        otp
      } = req.body;

      if (
        !email ||
        !otp
      ) {
        return res.status(400).json({
          error:
            "Email and OTP required"
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const storedData =
        otpStore[
          normalizedEmail
        ];

      // OTP doesn't exist
      if (!storedData) {
        return res.status(400).json({
          error:
            "Invalid or expired code"
        });
      }

      // Wrong OTP
      if (
        storedData.otp !== otp
      ) {
        return res.status(400).json({
          error:
            "Invalid code"
        });
      }

      // Check expiry
      if (
        Date.now() -
          storedData.timestamp >
        10 * 60 * 1000
      ) {
        delete otpStore[
          normalizedEmail
        ];

        return res.status(400).json({
          error:
            "Code expired"
        });
      }

      // Mark OTP as verified
      storedData.verified = true;

      console.log(
        "[DEBUG] OTP verified:",
        normalizedEmail
      );

      return res.status(200).json({
        message:
          "OTP verified successfully"
      });
    },


    // =====================================================
    // RESET PASSWORD
    // =====================================================
    async resetPassword(req, res) {
      const {
        email,
        otp,
        newPassword
      } = req.body;

      // Validate fields
      if (
        !email ||
        !otp ||
        !newPassword
      ) {
        return res.status(400).json({
          error:
            "All fields required"
        });
      }

      // Validate password length
      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters long"
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const storedData =
        otpStore[
          normalizedEmail
        ];

      // OTP must be verified
      if (
        !storedData ||
        !storedData.verified
      ) {
        return res.status(400).json({
          error:
            "OTP not verified"
        });
      }

      // Make sure OTP matches
      if (
        storedData.otp !== otp
      ) {
        return res.status(400).json({
          error:
            "Invalid OTP"
        });
      }

      try {
        // Hash new password
        const hashedPassword =
          await bcrypt.hash(
            newPassword,
            10
          );

        // Update password
        await userRepository
          .updatePasswordByEmail(
            hashedPassword,
            normalizedEmail
          );

        // Delete OTP after successful reset
        delete otpStore[
          normalizedEmail
        ];

        console.log(
          "[DEBUG] Password updated:",
          normalizedEmail
        );

        return res.status(200).json({
          message:
            "Password updated successfully"
        });

      } catch (err) {
        console.error(
          "Reset password error:",
          err
        );

        return res.status(500).json({
          error:
            "Failed to update password"
        });
      }
    }

  };
}

module.exports = createAuthService;