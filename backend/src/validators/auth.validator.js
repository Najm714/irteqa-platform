// backend/src/validators/auth.validator.js
import validator from 'validator';

// ✅ التحقق من التسجيل
export const validateRegister = (req, res, next) => {
  const { email, password, fullName, portalId } = req.body;

  if (!email || !password || !fullName || !portalId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  next();
};

// ✅ التحقق من تسجيل الدخول
export const validateLogin = (req, res, next) => {
  const { email, password, portalId } = req.body;

  if (!email || !password || !portalId) {
    return res.status(400).json({
      success: false,
      message: 'Email, password and portalId are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  next();
};