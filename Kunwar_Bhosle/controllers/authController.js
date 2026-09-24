const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseConfig');

// Helper to generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(
    { id: user.uid, email: user.email, role: user.role },
    secret,
    { expiresIn }
  );
};

// Helper for email format validation
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Register Student
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (!existingUserSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const createdAt = new Date().toISOString();
    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student',
      createdAt
    };

    const docRef = await usersRef.add(newUser);
    const userPayload = {
      uid: docRef.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    const token = generateToken(userPayload);

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (error) {
    next(error);
  }
};

// Register Librarian
exports.registerLibrarian = async (req, res, next) => {
  try {
    const { name, email, password, secretKey } = req.body;

    const expectedSecretKey = process.env.LIBRARIAN_SECRET_KEY;
    if (!secretKey || secretKey !== expectedSecretKey) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid or missing librarian secret key.'
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (!existingUserSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const createdAt = new Date().toISOString();
    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'librarian',
      createdAt
    };

    const docRef = await usersRef.add(newUser);
    const userPayload = {
      uid: docRef.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    const token = generateToken(userPayload);

    return res.status(201).json({
      success: true,
      message: 'Librarian account registered successfully.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', normalizedEmail).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userPayload = {
      uid: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt
    };

    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const userData = userDoc.data();
    // Exclude password from output
    const userPayload = {
      uid: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt
    };

    return res.status(200).json({
      success: true,
      data: userPayload
    });
  } catch (error) {
    next(error);
  }
};
