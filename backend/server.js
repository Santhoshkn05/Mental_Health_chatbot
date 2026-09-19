require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./config/database');
const transporter = require('./config/mail');
const requestLogger = require('./middlewares/logger.middleware');
const createAuthenticateToken = require('./middlewares/auth.middleware');
const createAuthenticateAdmin = require('./middlewares/admin.middleware');
const errorHandler = require('./middlewares/error.middleware');
const createUserRepository = require('./repositories/user.repository');
const createChatRepository = require('./repositories/chat.repository');
const createAccountRepository = require('./repositories/account.repository');
const createAdminRepository = require('./repositories/admin.repository');
const createAuthService = require('./services/auth.service');
const createChatService = require('./services/chat.service');
const createAccountService = require('./services/account.service');
const createAdminService = require('./services/admin.service');
const createAuthController = require('./controllers/auth.controller');
const createChatController = require('./controllers/chat.controller');
const createAccountController = require('./controllers/account.controller');
const createAdminController = require('./controllers/admin.controller');
const createAuthRoutes = require('./routes/auth.routes');
const createChatRoutes = require('./routes/chat.routes');
const createAccountRoutes = require('./routes/account.routes');
const createAdminRoutes = require('./routes/admin.routes');

const app = express();
const SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';
const PORT = process.env.PORT || 3001;
const otpStore = {};

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(requestLogger);

initializeDatabase();

const authenticateToken = createAuthenticateToken(SECRET);
const authenticateAdmin = createAuthenticateAdmin(SECRET);

const userRepository = createUserRepository(pool);
const chatRepository = createChatRepository(pool);
const accountRepository = createAccountRepository(pool);
const adminRepository = createAdminRepository(pool);

const authService = createAuthService({ userRepository, transporter, otpStore, secret: SECRET });
const chatService = createChatService(chatRepository);
const accountService = createAccountService(accountRepository);
const adminService = createAdminService({ adminRepository, secret: SECRET });

const authController = createAuthController(authService);
const chatController = createChatController(chatService);
const accountController = createAccountController(accountService);
const adminController = createAdminController(adminService);

app.use('/api', createAuthRoutes(authController));
app.use('/api', createChatRoutes(chatController, authenticateToken));
app.use('/api', createAccountRoutes(accountController, authenticateToken));
app.use('/api', createAdminRoutes(adminController, authenticateAdmin));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
