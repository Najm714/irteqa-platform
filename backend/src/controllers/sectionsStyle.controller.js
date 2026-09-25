// backend/src/controllers/sectionsStyle.controller.js
import { SectionsStyle } from '../models/SectionsStyle.model.js';

// ============================================================
// ✅ Presets جاهزة
// ============================================================
const PRESETS = {
  default: {
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#a855f7',
      cardBg: '#ffffff',
      titleColor: '#111827',
      descriptionColor: '#6b7280',
    },
    background: { type: 'none' },
    card: { style: 'elevated', hoverEffect: 'lift' },
  },
  dark: {
    colors: {
      primary: '#a78bfa',
      secondary: '#f472b6',
      accent: '#c4b5fd',
      cardBg: '#1f2937',
      titleColor: '#f9fafb',
      descriptionColor: '#9ca3af',
      borderColor: '#374151',
    },
    background: { type: 'solid', value: '#0f0f23' },
    card: { style: 'glass', hoverEffect: 'glow' },
  },
  light: {
    colors: {
      primary: '#4f46e5',
      secondary: '#db2777',
      cardBg: '#f9fafb',
      titleColor: '#111827',
      descriptionColor: '#6b7280',
    },
    background: { type: 'solid', value: '#ffffff' },
    card: { style: 'outlined', hoverEffect: 'border' },
  },
  minimal: {
    colors: {
      primary: '#111827',
      secondary: '#374151',
      cardBg: '#ffffff',
      titleColor: '#111827',
      descriptionColor: '#6b7280',
      borderColor: '#f3f4f6',
    },
    background: { type: 'none' },
    card: { style: 'flat', borderRadius: 12, hoverEffect: 'none' },
  },
  vibrant: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b',
      cardBg: '#ffffff',
      titleColor: '#111827',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#fef3c7', '#fce7f3', '#ede9fe'],
    },
    card: { style: 'gradient', hoverEffect: 'scale' },
  },
  ocean: {
    colors: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      cardBg: '#ffffff',
      titleColor: '#0f172a',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#cffafe', '#e0f2fe', '#f0f9ff'],
    },
    card: { style: 'elevated', hoverEffect: 'lift' },
  },
  sunset: {
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      accent: '#fbbf24',
      cardBg: '#ffffff',
      titleColor: '#1c1917',
    },
    background: {
      type: 'gradient',
      gradientColors: ['#fed7aa', '#fecaca', '#fef3c7'],
    },
    card: { style: 'gradient', hoverEffect: 'glow' },
  },
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

    // ✅ إنشاء افتراضي
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
// ✅ تحديث الإعدادات
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

    const config = await SectionsStyle.findOneAndUpdate(
      { portalId },
      { $set: updates },
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
// ✅ تطبيق Preset
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

    const config = await SectionsStyle.findOneAndUpdate(
      { portalId },
      { $set: { ...PRESETS[preset], preset } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `تم تطبيق ${preset}`,
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