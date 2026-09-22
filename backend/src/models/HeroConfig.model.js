// backend/src/models/HeroConfig.model.js
import mongoose from 'mongoose';

const HeroConfigSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
    unique: true,
    index: true,
  },

  // ============================================================
  // 1. Splash Screen
  // ============================================================
  splashScreen: {
    enabled: { type: Boolean, default: true },
    duration: { type: Number, default: 3500 },
    logo: { type: String, default: '' },
    text: { type: String, default: 'منصة ارتقاء' },
    bgColor: { type: String, default: '#0f0f23' },
  },

  // ============================================================
  // 2. Hero Layout
  // ============================================================
  layout: {
    type: String,
    enum: ['cinematic', 'split', 'carousel', 'magazine', 'interactive', 'minimal'],
    default: 'cinematic',
  },

  // ============================================================
  // 3. Main Content
  // ============================================================
  mainContent: {
    title: { type: String, default: 'منصة ارتقاء' },
    titleHighlight: { type: String, default: 'ارتقاء' },
    description: {
      type: String,
      default: 'تقدم خدمات متخصصة تجمع بين الخبرة والجودة في بيئة رقمية متكاملة، صُممت لتواكب احتياجاتك.',
    },
    image: { type: String, default: '' },
    imagePosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'right',
    },
  },

  // ============================================================
  // 4. CTAs (2-4 أزرار)
  // ============================================================
  ctas: [{
    text: { type: String, required: true },
    link: { type: String, required: true },
    variant: {
      type: String,
      enum: ['primary', 'secondary', 'outline', 'ghost'],
      default: 'primary',
    },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  }],

  // ============================================================
  // 5. Badges
  // ============================================================
  badges: [{
    text: { type: String, required: true },
    icon: { type: String, default: '' },
    color: { type: String, default: '#7c3aed' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],

  // ============================================================
  // 6. Background
  // ============================================================
  background: {
    type: {
      type: String,
      enum: ['solid', 'gradient', 'image', 'video', 'animated'],
      default: 'animated',
    },
    value: { type: String, default: '' },
    gradientColors: [{ type: String }],
    overlayColor: { type: String, default: '#000000' },
    overlayOpacity: { type: Number, default: 0.5, min: 0, max: 1 },
    starsEnabled: { type: Boolean, default: true },
    particlesEnabled: { type: Boolean, default: false },
    parallaxEnabled: { type: Boolean, default: true },
  },

  // ============================================================
  // 7. Announcements
  // ============================================================
  announcements: {
    topBar: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '' },
      link: { type: String, default: '' },
      bgColor: { type: String, default: '#7c3aed' },
      textColor: { type: String, default: '#ffffff' },
      dismissible: { type: Boolean, default: true },
      marquee: { type: Boolean, default: false },
      speed: { type: Number, default: 30 },
      isActive: { type: Boolean, default: true },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    midBanner: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      link: { type: String, default: '' },
      ctaText: { type: String, default: '' },
      bgColor: { type: String, default: '#f3f4f6' },
      isActive: { type: Boolean, default: true },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    sideBanner: {
      enabled: { type: Boolean, default: false },
      image: { type: String, default: '' },
      link: { type: String, default: '' },
      position: { type: String, enum: ['left', 'right'], default: 'right' },
      isActive: { type: Boolean, default: true },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    popup: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      ctaText: { type: String, default: '' },
      ctaLink: { type: String, default: '' },
      showAfter: { type: Number, default: 5000 },
      showOnce: { type: Boolean, default: true },
      bgColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#1f2937' },
      isActive: { type: Boolean, default: true },
      startDate: { type: Date },
      endDate: { type: Date },
    },
  },

  // ============================================================
  // 8. Carousel Slides
  // ============================================================
  slides: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    bgColor: { type: String, default: '#7c3aed' },
    cta: {
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },
    duration: { type: Number, default: 5000 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],

  // ============================================================
  // 9. Live Stats
  // ============================================================
  liveStats: {
    enabled: { type: Boolean, default: true },
    items: [{
      label: { type: String, required: true },
      icon: { type: String, default: '' },
      isDynamic: { type: Boolean, default: false },
      dynamicKey: {
        type: String,
        enum: ['users', 'requests', 'services', 'rating', 'custom'],
        default: 'custom',
      },
      staticValue: { type: String, default: '' },
      suffix: { type: String, default: '' },
      color: { type: String, default: '#7c3aed' },
      order: { type: Number, default: 0 },
    }],
  },

  // ============================================================
  // 10. Sections Visibility
  // ============================================================
  sections: {
    promotions: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    partners: { type: Boolean, default: true },
    stats: { type: Boolean, default: true },
    latestNews: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: true },
    faq: { type: Boolean, default: false },
  },

  // ============================================================
  // 11. Animations
  // ============================================================
  animations: {
    type: {
      type: String,
      enum: ['stars', 'particles', 'parallax', 'none'],
      default: 'stars',
    },
    intensity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const HeroConfig = mongoose.models.HeroConfig ||
  mongoose.model('HeroConfig', HeroConfigSchema);