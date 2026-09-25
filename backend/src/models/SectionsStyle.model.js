// backend/src/models/SectionsStyle.model.js
import mongoose from 'mongoose';

const SectionsStyleSchema = new mongoose.Schema(
  {
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
      unique: true,
      index: true,
    },

    // ============================================================
    // 1. Header (عنوان القسم)
    // ============================================================
    header: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'الخدمات الأكاديمية' },
      title: { type: String, default: 'الأقسام' },
      titleHighlight: { type: String, default: 'الرئيسية' },
      description: {
        type: String,
        default:
          'اختر القسم المناسب لاحتياجاتك واستكشف الخدمات المتخصصة المقدمة من منصة ارتقاء',
      },
      alignment: {
        type: String,
        enum: ['right', 'center', 'left'],
        default: 'center',
      },
      showLine: { type: Boolean, default: true },
      showEyebrowDot: { type: Boolean, default: true },
    },

    // ============================================================
    // 2. Colors (الألوان)
    // ============================================================
    colors: {
      primary: { type: String, default: '#7c3aed' },
      secondary: { type: String, default: '#ec4899' },
      accent: { type: String, default: '#a855f7' },

      // الخلفيات
      sectionBg: { type: String, default: 'transparent' },
      cardBg: { type: String, default: '#ffffff' },
      cardBgDark: { type: String, default: '#111827' },

      // النصوص
      titleColor: { type: String, default: '#111827' },
      titleColorDark: { type: String, default: '#f9fafb' },
      descriptionColor: { type: String, default: '#6b7280' },
      descriptionColorDark: { type: String, default: '#9ca3af' },

      // الحدود
      borderColor: { type: String, default: '#e5e7eb' },
      borderColorDark: { type: String, default: '#374151' },

      // التدرجات
      gradientStart: { type: String, default: '#7c3aed' },
      gradientEnd: { type: String, default: '#ec4899' },
    },

    // ============================================================
    // 3. Background (خلفية القسم)
    // ============================================================
    background: {
      type: {
        type: String,
        enum: ['none', 'solid', 'gradient', 'image', 'pattern'],
        default: 'none',
      },
      value: { type: String, default: '' },
      gradientColors: [{ type: String }],
      opacity: { type: Number, default: 1, min: 0, max: 1 },
      pattern: {
        type: String,
        enum: ['dots', 'lines', 'grid', 'waves', 'circles', 'none'],
        default: 'none',
      },
    },

    // ============================================================
    // 4. Card Style (نمط البطاقات)
    // ============================================================
    card: {
      style: {
        type: String,
        enum: ['elevated', 'flat', 'outlined', 'gradient', 'glass'],
        default: 'elevated',
      },
      borderRadius: { type: Number, default: 24, min: 0, max: 48 },
      shadow: {
        type: String,
        enum: ['none', 'sm', 'md', 'lg', 'xl'],
        default: 'lg',
      },
      hoverEffect: {
        type: String,
        enum: ['lift', 'scale', 'glow', 'border', 'none'],
        default: 'lift',
      },
      borderWidth: { type: Number, default: 1, min: 0, max: 4 },
      padding: { type: Number, default: 28, min: 12, max: 64 },
    },

    // ============================================================
    // 5. Layout
    // ============================================================
    layout: {
      gridColumns: { type: Number, default: 3, min: 1, max: 4 },
      gap: { type: Number, default: 16, min: 0, max: 64 },
      maxWidth: { type: Number, default: 1200 },
      paddingVertical: { type: Number, default: 80 },
      showDecorCircles: { type: Boolean, default: true },
    },

    // ============================================================
    // 6. Icons (الأيقونات)
    // ============================================================
    icons: {
      size: {
        type: String,
        enum: ['sm', 'md', 'lg', 'xl'],
        default: 'md',
      },
      style: {
        type: String,
        enum: ['emoji', 'circle', 'square', 'rounded'],
        default: 'rounded',
      },
      background: { type: String, default: 'gradient' },
    },

    // ============================================================
    // 7. Typography
    // ============================================================
    typography: {
      titleSize: { type: Number, default: 24, min: 16, max: 48 },
      descriptionSize: { type: Number, default: 15, min: 12, max: 24 },
      fontFamily: { type: String, default: 'inherit' },
      titleWeight: { type: Number, default: 800, min: 400, max: 900 },
    },

    // ============================================================
    // 8. Animations
    // ============================================================
    animations: {
      enabled: { type: Boolean, default: true },
      type: {
        type: String,
        enum: ['fade', 'slide', 'zoom', 'none'],
        default: 'fade',
      },
      duration: { type: Number, default: 500 },
      stagger: { type: Boolean, default: true },
    },

    // ============================================================
    // 9. Presets (قوالب جاهزة)
    // ============================================================
    preset: {
      type: String,
      enum: ['default', 'dark', 'light', 'minimal', 'vibrant', 'ocean', 'sunset'],
      default: 'default',
    },
  },
  { timestamps: true }
);

export const SectionsStyle =
  mongoose.models.SectionsStyle ||
  mongoose.model('SectionsStyle', SectionsStyleSchema);