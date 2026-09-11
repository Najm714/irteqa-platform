// backend/src/controllers/auth.controller.js
import { Account } from '../models/Account.model.js';
import { CustomerIdentity } from '../models/CustomerIdentity.model.js';
import { Portal } from '../models/Portal.model.js';
import { generateToken } from '../utils/jwt.js';
import mongoose from 'mongoose';

// ============================================================
// ✅ تسجيل الدخول
// ============================================================
export const login = async (req, res) => {
  try {
    const { email, password, portalId } = req.body;

    console.log('🔐 Login attempt:', { email, portalId });

    // ✅ التحقق من وجود البوابة
    let portal;
    try {
      portal = await Portal.findById(portalId);
    } catch (err) {
      portal = await Portal.findOne({ slug: portalId });
    }

    if (!portal) {
      console.log('❌ Portal not found:', portalId);
      return res.status(404).json({
        success: false,
        message: 'Portal not found for this domain.',
      });
    }

    console.log('✅ Portal found:', portal.name);

    // ✅ البحث عن الحساب
    const account = await Account.findOne({
      portalId: portal._id,
      email: email.toLowerCase(),
    }).select('+passwordHash');

    if (!account) {
      console.log('❌ Account not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ✅ التحقق من كلمة المرور
    const isPasswordValid = await account.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ✅ التحقق من الحساب النشط
    if (!account.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // ✅ تحديث آخر تسجيل دخول
    account.lastLogin = new Date();
    await account.save();

    // ✅ إنشاء التوكن
    const token = generateToken({
      id: account._id,
      portalId: account.portalId,
      role: account.role,
    });

    console.log('✅ Login successful for:', email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        account: {
          id: account._id,
          email: account.email,
          username: account.username,
          fullName: account.profile?.fullName || account.fullName || 'User',
          role: account.role,
          portalId: account.portalId,
          isActive: account.isActive,
          isVerified: account.isVerified,
          profile: account.profile || {},
          phone: account.phone || '',
        },
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// ============================================================
// ✅ التسجيل
// ============================================================
export const register = async (req, res) => {
  try {
    const { portalId, email, password, fullName, username, phone } = req.body;

    console.log('📝 Register attempt:', { email, portalId });

    // ✅ التحقق من وجود البوابة
    let portal;
    try {
      portal = await Portal.findById(portalId);
    } catch (err) {
      portal = await Portal.findOne({ slug: portalId });
    }

    if (!portal) {
      console.log('❌ Portal not found:', portalId);
      return res.status(404).json({
        success: false,
        message: 'Portal not found',
      });
    }

    console.log('✅ Portal found:', portal.name);

    // ✅ التحقق من وجود المستخدم
    const existingAccount = await Account.findOne({
      portalId: portal._id,
      email: email.toLowerCase(),
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: 'Account already exists with this email',
      });
    }

    // ✅ إنشاء هوية العميل
    const identity = new CustomerIdentity({
      email: email.toLowerCase(),
      fullName: fullName || username || 'User',
    });
    await identity.save();

    // ✅ إنشاء الحساب
    const account = new Account({
      portalId: portal._id,
      identityId: identity._id,
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash: password,
      fullName: fullName || username || 'User',
      phone: phone || '',
      profile: {
        fullName: fullName || username || 'User',
        bio: '',
        location: '',
        website: '',
        avatar: '',
      },
      role: 'customer',
      isActive: true,
      isVerified: true,
    });

    await account.save();

    console.log('✅ Account created for:', email);

    // ✅ إنشاء التوكن
    const token = generateToken({
      id: account._id,
      portalId: account.portalId,
      role: account.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        account: {
          id: account._id,
          email: account.email,
          username: account.username,
          fullName: account.fullName || account.profile?.fullName,
          role: account.role,
          portalId: account.portalId,
          profile: account.profile || {},
          phone: account.phone || '',
        },
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// ============================================================
// ✅ تسجيل الخروج
// ============================================================
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

// ============================================================
// ✅ جلب بيانات المستخدم الحالي
// ============================================================
export const getMe = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const account = await Account.findById(accountId)
      .populate('portalId', 'name slug')
      .populate('identityId', 'email fullName')
      .select('-passwordHash -__v');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: account._id,
        email: account.email,
        username: account.username,
        fullName: account.fullName || account.profile?.fullName,
        role: account.role,
        portalId: account.portalId,
        phone: account.phone || '',
        profile: account.profile || {},
        isActive: account.isActive,
        isVerified: account.isVerified,
        preferences: account.preferences || {},
        specialistDetails: account.specialistDetails || null,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ GetMe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user data',
    });
  }
};

// ============================================================
// ✅ الحصول على الملف الشخصي
// ============================================================
export const getProfile = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const account = await Account.findById(accountId)
      .populate('portalId', 'name slug')
      .populate('identityId', 'email fullName')
      .select('-passwordHash -__v');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: account._id,
        email: account.email,
        username: account.username,
        fullName: account.fullName || account.profile?.fullName,
        role: account.role,
        portal: account.portalId,
        phone: account.phone || '',
        isActive: account.isActive,
        isVerified: account.isVerified,
        profile: account.profile || {},
        preferences: account.preferences || {},
        specialistDetails: account.specialistDetails || null,
      },
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

// ============================================================
// ✅ تحديث الملف الشخصي
// ============================================================
export const updateProfile = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;
    const { fullName, phone, bio, location, website, avatar, preferences } = req.body;

    console.log('📝 Updating profile for user:', accountId);
    console.log('  - FullName:', fullName);
    console.log('  - Phone:', phone);
    console.log('  - Avatar:', avatar);

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // ✅ تحديث الحقول الأساسية
    if (fullName !== undefined) {
      account.fullName = fullName;
      if (!account.profile) account.profile = {};
      account.profile.fullName = fullName;
    }

    if (phone !== undefined) account.phone = phone;

    // ✅ تحديث profile
    if (!account.profile) {
      account.profile = {};
    }

    if (bio !== undefined) account.profile.bio = bio;
    if (location !== undefined) account.profile.location = location;
    if (website !== undefined) account.profile.website = website;
    if (avatar !== undefined) account.profile.avatar = avatar;

    // ✅ تحديث التفضيلات
    if (preferences) {
      account.preferences = { ...account.preferences, ...preferences };
    }

    await account.save();

    console.log('✅ Profile updated successfully');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: account._id,
        email: account.email,
        username: account.username,
        fullName: account.fullName || account.profile?.fullName,
        role: account.role,
        phone: account.phone || '',
        profile: account.profile || {},
        preferences: account.preferences || {},
        updatedAt: account.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

// ============================================================
// ✅ تغيير كلمة المرور
// ============================================================
export const changePassword = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const account = await Account.findById(accountId).select('+passwordHash');
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // ✅ التحقق من كلمة المرور الحالية
    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // ✅ تحديث كلمة المرور
    account.passwordHash = newPassword;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
};
// backend/src/controllers/auth.controller.js

// ============================================================
// ✅ تحديث إعدادات المستخدم
// ============================================================
export const updateSettings = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;
    const { 
      emailNotifications, 
      pushNotifications, 
      orderUpdates, 
      promotionalEmails, 
      twoFactorAuth, 
      language, 
      theme 
    } = req.body;

    console.log('⚙️ Updating settings for user:', accountId);

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const Account = (await import('../models/Account.model.js')).Account;
    const account = await Account.findById(accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // ✅ تحديث الإعدادات
    if (!account.preferences) {
      account.preferences = {};
    }

    if (emailNotifications !== undefined) account.preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) account.preferences.pushNotifications = pushNotifications;
    if (orderUpdates !== undefined) account.preferences.orderUpdates = orderUpdates;
    if (promotionalEmails !== undefined) account.preferences.promotionalEmails = promotionalEmails;
    if (twoFactorAuth !== undefined) account.preferences.twoFactorAuth = twoFactorAuth;
    if (language !== undefined) account.preferences.language = language;
    if (theme !== undefined) account.preferences.theme = theme;

    await account.save();

    console.log('✅ Settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: account.preferences,
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};

// ============================================================
// ✅ جلب إعدادات المستخدم
// ============================================================
export const getSettings = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const Account = (await import('../models/Account.model.js')).Account;
    const account = await Account.findById(accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // ✅ إعدادات افتراضية إذا لم تكن موجودة
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      promotionalEmails: false,
      twoFactorAuth: false,
      language: 'ar',
      theme: 'auto',
    };

    const settings = {
      ...defaultSettings,
      ...(account.preferences || {}),
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get settings',
    });
  }
};