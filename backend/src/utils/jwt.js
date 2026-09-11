// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// ✅ استخدام config.jwtSecret مباشرة
const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn || '7d';

export const generateToken = (payload) => {
  // ✅ التحقق من وجود JWT_SECRET
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined!');
    throw new Error('JWT_SECRET is not defined');
  }
  
  console.log('🔄 Generating token for user:', payload.id || payload._id);
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  console.log('✅ Token generated successfully');
  return token;
};

export const verifyToken = (token) => {
  try {
    // ✅ التحقق من وجود JWT_SECRET
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in verifyToken!');
      return null;
    }
    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully for user:', decoded.id || decoded._id);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Token decode failed:', error.message);
    return null;
  }
};

export const generateRefreshToken = (payload) => {
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined!');
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: config.jwtRefreshExpiresIn || '30d',
  });
};

export const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = verifyToken(token);
    return decoded !== null;
  } catch (error) {
    return false;
  }
};

export const getTokenData = (token) => {
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenValid,
  getTokenData,
};