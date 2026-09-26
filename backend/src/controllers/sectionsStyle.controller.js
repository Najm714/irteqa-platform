// backend/src/controllers/sectionsStyle.controller.js
import { SectionsStyle } from '../models/SectionsStyle.model.js';

// ============================================================
// ✅ Presets — محدّثة وكاملة
// ============================================================
const PRESETS = {
  default: {
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#a855f7',
      cardBg: '#ffffff',
      cardBgDark: '#111827',
      titleColor: '#111827',
      titleColorDark: '#f9fafb',
      descriptionColor: '#6b7280',
      descriptionColorDark: '#9ca3af',
      borderColor: '#e5e7eb',
      borderColorDark: '#374151',
      gradientStart: '#7c3aed',
      gradientEnd: '#ec4899',
    },
    background: { type: 'none', value: '', gradientColors: [], opacity: 1 },
    card: {
      style: 'elevated',
      shadow: 'lg',
      hoverEffect: 'lift',
      borderRadius: 24,
      borderWidth: 1,
      padding: 28,
    },
  },

  dark: {
    colors: {
      primary: '#a78bfa',
      secondary: '#f472b6',
      accent: '#c4b5fd',
      cardBg: '#1f2937',
      cardBgDark: '#0f172a',
      titleColor: '#f9fafb',
      titleColorDark: '#f1f5f9',
      descriptionColor: '#9ca3af',
      descriptionColorDark: '#cbd5e1',
      borderColor: '#374151',
      borderColorDark: '#1e293b',
      gradientStart: '#a78bfa',
      gradientEnd: '#f472b6',
    },
    background: { type: 'solid', value: '#0f0f23', opacity: 1 },
    card: {
      style: 'glass',
      shadow: 'xl',
      hoverEffect: 'glow',
      borderRadius: 24,
      borderWidth: 1,
      padding: 28,
    },
  },

  light: {
    colors: {
      primary: '#4f46e5',
      secondary: '#db2777',
      accent: '#6366f1',
      cardBg: '#f9fafb',
      cardBgDark: '#ffffff',
      titleColor: '#111827',
      titleColorDark: '#0f172a',
      descriptionColor: '#6b7280',
      descriptionColorDark: '#475569',
      borderColor: '#e5e7eb',
      borderColorDark: '#e2e8f0',
      gradientStart: '#4f46e5',
      gradientEnd: '#db2777',
    },
    background: { type: 'solid', value: '#ffffff', opacity: 1 },
    card: {
      style: 'outlined',
      shadow: 'sm',
      hoverEffect: 'border',
      borderRadius: 16,
      borderWidth: 2,
      padding: 24,
    },
  },

  minimal: {
    colors: {
      primary: '#111827',
      secondary: '#374151',
      accent: '#6b7280',
      cardBg: '#ffffff',
      cardBgDark: '#f9fafb',
      titleColor: '#111827',
      titleColorDark: '#111827',
      descriptionColor: '#6b7280',
      descriptionColorDark: '#4b5563',
      borderColor: '#f3f4f6',
      borderColorDark: '#e5e7eb',
      gradientStart: '#111827',
      gradientEnd: '#374151',
    },
    background: { type: 'none', value: '', opacity: 1 },
    card: {
      style: 'flat',
      shadow: 'none',
      hoverEffect: 'none',
      borderRadius: 12,
      borderWidth: 0,
      padding: 24,
    },
  },

  vibrant: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b',
      cardBg: '#ffffff',
      cardBgDark: '#1e1b4b',
      titleColor: '#111827',
      titleColorDark: '#f9fafb',
      descriptionColor: '#6b7280',
      descriptionColorDark: '#c4b5fd',
      borderColor: '#e9d5ff',
      borderColorDark: '#4c1d95',
      gradientStart: '#8b5cf6',
      gradientEnd: '#ec4899',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#fef3c7', '#fce7f3', '#ede9fe'],
      opacity: 1,
    },
    card: {
      style: 'gradient',
      shadow: 'lg',
      hoverEffect: 'scale',
      borderRadius: 20,
      borderWidth: 0,
      padding: 28,
    },
  },

  ocean: {
    colors: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      cardBg: '#ffffff',
      cardBgDark: '#082f49',
      titleColor: '#0f172a',
      titleColorDark: '#f0f9ff',
      descriptionColor: '#475569',
      descriptionColorDark: '#bae6fd',
      borderColor: '#cffafe',
      borderColorDark: '#075985',
      gradientStart: '#0891b2',
      gradientEnd: '#06b6d4',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#cffafe', '#e0f2fe', '#f0f9ff'],
      opacity: 1,
    },
    card: {
      style: 'elevated',
      shadow: 'lg',
      hoverEffect: 'lift',
      borderRadius: 20,
      borderWidth: 1,
      padding: 28,
    },
  },

  sunset: {
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      accent: '#fbbf24',
      cardBg: '#ffffff',
      cardBgDark: '#1c1917',
      titleColor: '#1c1917',
      titleColorDark: '#fef3c7',
      descriptionColor: '#78716c',
      descriptionColorDark: '#fed7aa',
      borderColor: '#fed7aa',
      borderColorDark: '#9a3412',
      gradientStart: '#f97316',
      gradientEnd: '#ef4444',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#fed7aa', '#fecaca', '#fef3c7'],
      opacity: 1,
    },
    card: {
      style: 'gradient',
      shadow: 'lg',
      hoverEffect: 'glow',
      borderRadius: 20,
      borderWidth: 0,
      padding: 28,
    },
  },
};

// ============================================================
// ✅ Helper: بناء $set مع dot notation
// ============================================================
const buildUpdateQuery = (updates, preserveFields = []) => {
  const query = {};

  Object.keys(updates).forEach((key) => {
    // ✅ تجاهل حقول لا نريد تحديثها
    if (preserveFields.includes(key)) return;

    const value = updates[key];

    // ✅ كائن متداخل (ليس مصفوفة)
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      Object.keys(value).forEach((subKey) => {
        query[`${key}.${subKey}`] = value[subKey];
      });
    } else {
      // ✅ قيمة مباشرة أو مصفوفة أو Date
      query[key] = value;
    }
  });

  return query;
};

// ============================================================
// ✅ جلب الإعدادات
// ============================================================
export const getSectionsStyle = async (req, res) => {
  try {
    const portalId = req.portalId;
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    let config = await SectionsStyle.findOne({ portalId });

    if (!config) {
      config = new SectionsStyle({ portalId });
      await config.save();
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('❌ Get sections style error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sections style',
    });
  }
};

// ============================================================
// ✅ تحديث الإعدادات — مع dot notation
// ============================================================
export const updateSectionsStyle = async (req, res) => {
  try {
    const portalId = req.portalId;
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    const updates = req.body || {};

    // ✅ حماية: لا نسمح بتحديث portalId أو _id
    delete updates._id;
    delete updates.portalId;

    // ✅ بناء query بـ dot notation
    const updateQuery = buildUpdateQuery(updates);

    // ✅ التحقق من وجود شيء للتحديث
    if (Object.keys(updateQuery).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد حقول للتحديث',
      });
    }

    const config = await SectionsStyle.findOneAndUpdate(
      { portalId },
      { $set: updateQuery },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Sections style updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('❌ Update sections style error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update sections style',
    });
  }
};

// ============================================================
// ✅ تطبيق Preset — لا يحذف الحقول المخصصة
// ============================================================
export const applyPreset = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { preset } = req.params;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!PRESETS[preset]) {
      return res.status(400).json({
        success: false,
        message: 'Preset غير موجود',
      });
    }

    // ✅ بناء query مع dot notation للحفاظ على الحقول غير المُحدَّثة
    const presetData = { ...PRESETS[preset], preset };
    const updateQuery = buildUpdateQuery(presetData);

    const config = await SectionsStyle.findOneAndUpdate(
      { portalId },
      { $set: updateQuery },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `تم تطبيق قالب "${preset}" بنجاح`,
      data: config,
    });
  } catch (error) {
    console.error('❌ Apply preset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply preset',
    });
  }
};

// ============================================================
// ✅ إعادة تعيين
// ============================================================
export const resetSectionsStyle = async (req, res) => {
  try {
    const portalId = req.portalId;
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    await SectionsStyle.deleteOne({ portalId });

    res.status(200).json({
      success: true,
      message: 'Sections style reset successfully',
    });
  } catch (error) {
    console.error('❌ Reset sections style error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset sections style',
    });
  }
};

export default {
  getSectionsStyle,
  updateSectionsStyle,
  applyPreset,
  resetSectionsStyle,
};