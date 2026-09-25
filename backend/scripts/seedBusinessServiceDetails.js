// backend/scripts/seedBusinessServiceDetails.js
// ============================================================
// 🚀 إضافة ServiceDetail لكل خدمة أعمال
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/seedBusinessServiceDetails.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from '../src/models/Service.model.js';
import { ServiceDetail } from '../src/models/ServiceDetail.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ============================================================
// 📋 بيانات ServiceDetail لكل خدمة (حسب slug)
// ============================================================
const SERVICE_DETAILS_DATA = {
  // ============================================================
  // 💼 القسم 1: إدارة الأعمال
  // ============================================================
  'management-case-analysis': {
    overview:
      'تساعدك هذه الخدمة في تطوير وتحسين الحالات الإدارية من خلال تنظيم المعلومات، تحليل عناصر الحالة، وربطها بالمفاهيم والنماذج الإدارية المناسبة.',
    overviewAr:
      'تساعدك هذه الخدمة في تطوير وتحسين الحالات الإدارية من خلال تنظيم المعلومات، تحليل عناصر الحالة، وربطها بالمفاهيم والنماذج الإدارية المناسبة للوصول إلى مخرجات أكثر وضوحًا وجودة.',
    whatIsService:
      'Specialized service in preparing, reviewing, and analyzing case studies related to management and business.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة وتحليل الحالات الدراسية والتطبيقية المرتبطة بمجالات الإدارة والأعمال، تشمل فهم موضوع الحالة، تحديد المحاور الرئيسية، تحليل المعطيات، تطوير المناقشات، وتحسين طريقة عرض الحلول والاستنتاجات وفق متطلبات المقرر أو المشروع.',
    whoBenefits:
      'Business students, graduate students, researchers, and students working on case studies.',
    whoBenefitsAr:
      'طلاب إدارة الأعمال والإدارة، طلاب الدراسات العليا، الباحثون في الدراسات التطبيقية، والطلاب الذين يعملون على مشاريع أو حالات دراسية.',
    methodologies:
      'Case Study Analysis, Problem Analysis, Management Frameworks, SWOT Analysis',
    methodologiesAr:
      'تحليل الحالات الدراسية، تحليل المشكلات، نماذج التحليل الإداري، تحليل البيئة الداخلية والخارجية (SWOT)',
    gallery: [],
    requestTypes: [
      { type: 'online', label: 'تحليل حالة', labelAr: 'تحليل حالة', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        question: 'What types of management cases are covered?',
        questionAr: 'ما هي أنواع الحالات الإدارية التي تشملها الخدمة؟',
        answer: 'Strategic, operational, financial, leadership, and change management cases.',
        answerAr:
          'تشمل الحالات الاستراتيجية، التشغيلية، والمالية، بالإضافة إلى حالات القيادة وإدارة التغيير.',
        order: 0,
      },
      {
        question: 'How long does the analysis take?',
        questionAr: 'كم تستغرق عملية تحليل الحالة؟',
        answer: '3-7 days depending on complexity.',
        answerAr:
          'تتراوح مدة التحليل بين 3-7 أيام حسب تعقيد الحالة وحجم المعلومات المقدمة.',
        order: 1,
      },
    ],
  },

  'management-reports-review': {
    overviewAr:
      'تدعمك هذه الخدمة في إعداد وتطوير التقارير الإدارية من خلال تحسين تنظيم المحتوى، مراجعة جودة التحليل، وتطوير طريقة عرض المعلومات والنتائج.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة التقارير المرتبطة بالمجالات الإدارية والتطبيقية، تشمل تنظيم هيكل التقرير، تحسين ترابط الأفكار، مراجعة المحتوى، تطوير التحليل، وتحسين جودة المخرجات النهائية.',
    whoBenefitsAr:
      'طلاب تخصصات إدارة الأعمال، طلاب المقررات التطبيقية، الباحثون في المجالات الإدارية، وأصحاب المشاريع الدراسية.',
    methodologiesAr:
      'هيكلة التقارير العلمية والتطبيقية، أساليب الكتابة التحليلية، تنظيم وعرض البيانات، مراجعة جودة المحتوى',
    requestTypes: [
      { type: 'online', label: 'إعداد تقرير', labelAr: 'إعداد تقرير', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع التقارير الإدارية المشمولة؟',
        answerAr:
          'تشمل التقارير التنفيذية، تقارير الأداء، تقارير المشاريع، والتقارير التحليلية.',
        question: 'What types of management reports are covered?',
        answer: 'Executive, performance, project, and analytical reports.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد التقرير؟',
        answerAr: 'تتراوح بين 3-7 أيام حسب حجم التقرير وتعقيده.',
        question: 'How long does it take?',
        answer: '3-7 days depending on report size.',
        order: 1,
      },
    ],
  },

  'management-models-application': {
    overviewAr:
      'تساعدك هذه الخدمة في فهم وتطبيق النماذج الإدارية على الحالات والمشاريع التطبيقية لتحسين التحليل وربط المفاهيم النظرية بالتطبيق العملي.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة وتطبيق النماذج والأطر الإدارية المناسبة لتحليل الأعمال والحالات الدراسية، تشمل اختيار النموذج المناسب، تطبيقه على الموضوع، تفسير النتائج، وتطوير المخرجات التحليلية.',
    whoBenefitsAr:
      'طلاب الإدارة والأعمال، الباحثون في الدراسات التطبيقية، أصحاب المشاريع الدراسية، والطلاب الذين يحتاجون إلى تطبيق نماذج إدارية.',
    methodologiesAr:
      "SWOT Analysis, PESTEL Analysis, Porter's Five Forces, Business Analysis Frameworks",
    requestTypes: [
      { type: 'online', label: 'تطبيق نموذج', labelAr: 'تطبيق نموذج', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي النماذج الإدارية المتاحة؟',
        answerAr:
          "تشمل SWOT، PESTEL، Porter's Five Forces، Business Model Canvas، وغيرها.",
        question: 'What models are available?',
        answer: 'SWOT, PESTEL, Five Forces, Business Model Canvas, and others.',
        order: 0,
      },
      {
        questionAr: 'كيف يتم اختيار النموذج المناسب؟',
        answerAr: 'يتم اختيار النموذج بناءً على طبيعة المشروع، أهدافه، والبيانات المتوفرة.',
        question: 'How is the model selected?',
        answer: 'Based on project nature, goals, and available data.',
        order: 1,
      },
    ],
  },

  'project-planning-guidance': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير خطط المشاريع والأعمال من خلال تنظيم فكرة المشروع، بناء مكوناته، وتحسين طريقة عرض أهدافه ومراحل تنفيذه.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة وتحسين خطط المشاريع، تشمل تنظيم فكرة المشروع، تحديد الأهداف، تطوير مراحل التنفيذ، توضيح الموارد والمتطلبات، وتحسين جودة الخطة النهائية.',
    whoBenefitsAr:
      'طلاب إدارة المشاريع، طلاب ريادة الأعمال، أصحاب المشاريع الدراسية، والباحثون في موضوعات المشاريع التطبيقية.',
    methodologiesAr:
      'Project Planning, Work Breakdown Structure (WBS), Project Timeline, Project Management Frameworks',
    requestTypes: [
      { type: 'online', label: 'تطوير خطة', labelAr: 'تطوير خطة', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات خطة المشروع الناجحة؟',
        answerAr: 'تشمل الأهداف الواضحة، الجدول الزمني، الموارد، الميزانية، ومؤشرات الأداء.',
        question: 'What are the components of a successful project plan?',
        answer: 'Clear goals, timeline, resources, budget, and KPIs.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية تطوير الخطة؟',
        answerAr: 'تتراوح بين 5-10 أيام حسب حجم المشروع وتعقيده.',
        question: 'How long does it take?',
        answer: '5-10 days depending on project complexity.',
        order: 1,
      },
    ],
  },

  'feasibility-studies-review': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير دراسات الجدوى للمشاريع من خلال مراجعة مكوناتها وتحسين تنظيمها وتحليل جوانبها المختلفة.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد وتقييم وتحسين دراسات الجدوى للمشاريع والأفكار التطبيقية، تشمل مراجعة فكرة المشروع، تحليل الجوانب التشغيلية والمالية، تنظيم المعلومات، وتحسين جودة المخرجات النهائية.',
    whoBenefitsAr:
      'طلاب ريادة الأعمال، طلاب المشاريع التطبيقية، أصحاب الأفكار والمشاريع، والباحثون في دراسات المشاريع.',
    methodologiesAr:
      'Feasibility Study Framework, Market Analysis, Cost-Benefit Analysis, Financial Evaluation',
    requestTypes: [
      { type: 'online', label: 'إعداد دراسة', labelAr: 'إعداد دراسة', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع دراسات الجدوى؟',
        answerAr: 'تشمل الجدوى السوقية، الفنية، المالية، التنظيمية، والقانونية.',
        question: 'What types of feasibility studies are covered?',
        answer: 'Market, technical, financial, organizational, and legal.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد دراسة الجدوى؟',
        answerAr: 'تتراوح بين 7-14 يومًا حسب حجم المشروع ومدى تعقيده.',
        question: 'How long does it take?',
        answer: '7-14 days depending on project complexity.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 💰 القسم 2: المالية والمحاسبة
  // ============================================================
  'financial-modeling-development': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير النماذج المالية للمشاريع من خلال تنظيم البيانات المالية وتحسين عرض التوقعات والحسابات المرتبطة بالمشروع.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة النماذج المالية للمشاريع، تشمل تنظيم الإيرادات والتكاليف، إعداد الجداول المالية، وتطوير نماذج تساعد على فهم الجانب المالي للمشروع.',
    whoBenefitsAr:
      'طلاب المالية والمحاسبة، طلاب إدارة الأعمال، أصحاب المشاريع التطبيقية، والباحثون في الدراسات المالية.',
    methodologiesAr:
      'Financial Modeling, Forecasting, Scenario Analysis, Spreadsheet Modeling',
    requestTypes: [
      { type: 'online', label: 'تطوير نموذج', labelAr: 'تطوير نموذج', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات النموذج المالي؟',
        answerAr: 'تشمل الإيرادات، التكاليف، التدفقات النقدية، صافي القيمة الحالية، ومعدل العائد الداخلي.',
        question: 'What are the components of a financial model?',
        answer: 'Revenue, costs, cash flows, NPV, and IRR.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة تحليل الحساسية؟',
        answerAr: 'نعم، تشمل تحليل الحساسية وتحليل السيناريوهات.',
        question: 'Does it include sensitivity analysis?',
        answer: 'Yes, includes sensitivity and scenario analysis.',
        order: 1,
      },
    ],
  },

  'financial-statement-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تحليل البيانات والقوائم المالية لفهم المؤشرات المالية واستخلاص النتائج بطريقة منظمة.',
    whatIsServiceAr:
      'خدمة تطبيقية تهدف إلى مراجعة وتحليل البيانات المالية، تشمل دراسة القوائم المالية، استخراج المؤشرات، تفسير النتائج، وتحسين عرض التحليل وفق أهداف الدراسة أو المشروع.',
    whoBenefitsAr:
      'طلاب المالية والمحاسبة، الباحثون في المجالات المالية، الطلاب أصحاب المشاريع التحليلية، وأصحاب الدراسات التطبيقية.',
    methodologiesAr:
      'Financial Ratio Analysis, Trend Analysis, Comparative Analysis, Financial Indicators Analysis',
    requestTypes: [
      { type: 'online', label: 'تحليل مالي', labelAr: 'تحليل مالي', isActive: true },
      { type: 'online', label: 'استخراج مؤشرات', labelAr: 'استخراج مؤشرات', isActive: true },
      { type: 'online', label: 'تفسير', labelAr: 'تفسير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي النسب المالية الأساسية؟',
        answerAr: 'تشمل نسب السيولة، الربحية، الملاءة، والكفاءة التشغيلية.',
        question: 'What are the key financial ratios?',
        answer: 'Liquidity, profitability, solvency, and operational efficiency.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة التحليل الرأسي والأفقي؟',
        answerAr: 'نعم، تشمل كلا النوعين من التحليل.',
        question: 'Does it include vertical and horizontal analysis?',
        answer: 'Yes, includes both.',
        order: 1,
      },
    ],
  },

  'financial-risk-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في فهم الجوانب المالية ودراسة المخاطر المرتبطة بالمشاريع والأعمال من خلال تحليل المعلومات وتقييم العوامل المؤثرة.',
    whatIsServiceAr:
      'خدمة متخصصة في تحليل الأداء المالي ودراسة المخاطر المحتملة المرتبطة بالمشاريع والدراسات التطبيقية، تشمل مراجعة المؤشرات المالية، تحليل السيناريوهات، وتقييم العوامل التي قد تؤثر على النتائج.',
    whoBenefitsAr:
      'طلاب المالية وإدارة الأعمال، الباحثون في المجالات الاقتصادية، أصحاب المشاريع التطبيقية، والطلاب الذين يعملون على دراسات مالية.',
    methodologiesAr:
      'Financial Analysis, Risk Assessment, Sensitivity Analysis, Scenario Analysis',
    requestTypes: [
      { type: 'online', label: 'تحليل مخاطر', labelAr: 'تحليل مخاطر', isActive: true },
      { type: 'online', label: 'تقييم', labelAr: 'تقييم', isActive: true },
      { type: 'online', label: 'استراتيجيات', labelAr: 'استراتيجيات', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع المخاطر المالية؟',
        answerAr: 'تشمل مخاطر السوق، الائتمان، السيولة، التشغيل، والمخاطر النظامية.',
        question: 'What types of financial risks?',
        answer: 'Market, credit, liquidity, operational, and systemic.',
        order: 0,
      },
      {
        questionAr: 'كيف يتم تقييم المخاطر؟',
        answerAr: 'يتم التقييم باستخدام أدوات مثل تحليل الحساسية، تحليل السيناريوهات، وقيمة المخاطرة.',
        question: 'How are risks evaluated?',
        answer: 'Using sensitivity analysis, scenario analysis, and VaR.',
        order: 1,
      },
    ],
  },

  'financial-reports-review': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير التقارير المالية والتحليلية من خلال تنظيم البيانات، تحسين طريقة عرض المعلومات، ومراجعة جودة المخرجات.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد وتطوير ومراجعة التقارير المرتبطة بالبيانات المالية والتحليلية، تشمل تنظيم المؤشرات، عرض النتائج، تحسين التفسير والتحليل، وتطوير التقرير النهائي.',
    whoBenefitsAr:
      'طلاب المالية والمحاسبة، طلاب إدارة الأعمال، الباحثون في الدراسات المالية والاقتصادية، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Financial Reporting Analysis, Data Interpretation, Analytical Reporting, Performance Indicators Analysis',
    requestTypes: [
      { type: 'online', label: 'إعداد تقرير', labelAr: 'إعداد تقرير', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات التقرير المالي؟',
        answerAr: 'تشمل الملخص التنفيذي، التحليل المالي، المؤشرات الرئيسية، التوصيات، والملاحق.',
        question: 'What are the components of a financial report?',
        answer: 'Executive summary, financial analysis, key indicators, recommendations.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد التقرير؟',
        answerAr: 'تتراوح بين 3-7 أيام حسب حجم التقرير وتعقيده.',
        question: 'How long does it take?',
        answer: '3-7 days depending on size.',
        order: 1,
      },
    ],
  },

  'accounting-case-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في فهم وتحليل الحالات المحاسبية التطبيقية من خلال دراسة المعطيات، تفسير العمليات، وربطها بالمفاهيم المحاسبية المناسبة.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة وتحليل الحالات المرتبطة بالمحاسبة، تشمل فهم المشكلة المحاسبية، تحليل المعلومات المتوفرة، تطبيق المعالجات والمفاهيم المناسبة، وتحسين طريقة عرض الحلول والاستنتاجات.',
    whoBenefitsAr:
      'طلاب المحاسبة، طلاب المالية، الباحثون في المجالات المحاسبية، والطلاب الذين يعملون على حالات دراسية تطبيقية.',
    methodologiesAr:
      'Accounting Analysis, Financial Reporting Standards Review, Case Study Analysis, Accounting Treatment Analysis',
    requestTypes: [
      { type: 'online', label: 'تحليل حالة', labelAr: 'تحليل حالة', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تطبيق', labelAr: 'تطبيق', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي المعايير المحاسبية المستخدمة؟',
        answerAr: 'تشمل المعايير الدولية IFRS والمعايير المحلية حسب متطلبات الحالة.',
        question: 'What accounting standards are used?',
        answer: 'IFRS and local standards.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة تحليل القوائم المالية؟',
        answerAr: 'نعم، تشمل تحليل القوائم المالية والكشوفات المحاسبية.',
        question: 'Does it include financial statement analysis?',
        answer: 'Yes, includes financial statements.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 📈 القسم 3: التسويق
  // ============================================================
  'marketing-studies-guidance': {
    overviewAr:
      'تساعدك هذه الخدمة في إعداد وتطوير الدراسات التسويقية من خلال تنظيم المعلومات وتحليل السوق والعملاء والعوامل المؤثرة.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة الدراسات التسويقية المرتبطة بالمشاريع والأعمال، تشمل تحليل السوق، دراسة الفئات المستهدفة، تنظيم المعلومات التسويقية، وتحسين مخرجات الدراسة.',
    whoBenefitsAr:
      'طلاب التسويق وإدارة الأعمال، أصحاب المشاريع التطبيقية، الباحثون في موضوعات التسويق، والطلاب الذين يعملون على دراسات سوقية.',
    methodologiesAr:
      'Market Analysis, Consumer Analysis, Competitor Analysis, Marketing Research Methods',
    requestTypes: [
      { type: 'online', label: 'إعداد دراسة', labelAr: 'إعداد دراسة', isActive: true },
      { type: 'online', label: 'تحليل سوق', labelAr: 'تحليل سوق', isActive: true },
      { type: 'online', label: 'توصيات', labelAr: 'توصيات', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات الدراسة التسويقية؟',
        answerAr: 'تشمل تحليل السوق، تحليل المنافسين، تحليل العملاء، واستراتيجيات التسويق.',
        question: 'What are the components?',
        answer: 'Market analysis, competitor analysis, customer analysis, and strategies.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد الدراسة؟',
        answerAr: 'تتراوح بين 5-10 أيام حسب حجم الدراسة.',
        question: 'How long does it take?',
        answer: '5-10 days.',
        order: 1,
      },
    ],
  },

  'marketing-plans-development': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير الخطط التسويقية من خلال تنظيم الأهداف، تحليل السوق، وتحسين عناصر الخطة التسويقية.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة الخطط التسويقية للمشاريع والدراسات التطبيقية، تشمل تحديد الأهداف، تحليل الفئة المستهدفة، تطوير الأنشطة التسويقية، وتحسين جودة الخطة النهائية.',
    whoBenefitsAr:
      'طلاب التسويق، طلاب إدارة الأعمال، أصحاب المشاريع، والباحثون في الدراسات التسويقية.',
    methodologiesAr:
      'Marketing Mix Analysis, STP Model, Customer Analysis, Marketing Strategy Frameworks',
    requestTypes: [
      { type: 'online', label: 'تطوير خطة', labelAr: 'تطوير خطة', isActive: true },
      { type: 'online', label: 'تحليل سوق', labelAr: 'تحليل سوق', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات الخطة التسويقية؟',
        answerAr: 'تشمل الأهداف، الاستراتيجيات، المزيج التسويقي، الميزانية، ومؤشرات الأداء.',
        question: 'What are the components?',
        answer: 'Goals, strategies, marketing mix, budget, KPIs.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية تطوير الخطة؟',
        answerAr: 'تتراوح بين 5-10 أيام.',
        question: 'How long does it take?',
        answer: '5-10 days.',
        order: 1,
      },
    ],
  },

  'business-model-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير نموذج العمل للمشاريع والأفكار التطبيقية من خلال تنظيم عناصر المشروع وتوضيح طريقة عمله بصورة أكثر وضوحًا.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة نماذج الأعمال، تشمل تحليل مكونات المشروع، القيمة المقدمة، الفئات المستفيدة، الموارد، الأنشطة، والعلاقات الأساسية داخل نموذج العمل.',
    whoBenefitsAr:
      'طلاب ريادة الأعمال، أصحاب المشاريع الدراسية، الطلاب الذين يعملون على أفكار تطبيقية، والباحثون في نماذج الأعمال.',
    methodologiesAr:
      'Business Model Canvas, Value Proposition Design, Business Model Analysis',
    requestTypes: [
      { type: 'online', label: 'تحليل نموذج', labelAr: 'تحليل نموذج', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات Business Model Canvas؟',
        answerAr: 'تشمل 9 مكونات: العملاء، القيمة، القنوات، العلاقات، الإيرادات، الموارد، الأنشطة، الشركاء، والتكاليف.',
        question: 'What are the BMC components?',
        answer: '9 components: customers, value, channels, relationships, revenue, resources, activities, partners, costs.',
        order: 0,
      },
      {
        questionAr: 'كيف يتم تطوير النموذج؟',
        answerAr: 'يتم التطوير من خلال تحليل كل مكون وتحديد العلاقات بينها بشكل متكامل.',
        question: 'How is the model developed?',
        answer: 'By analyzing each component and defining relationships.',
        order: 1,
      },
    ],
  },

  'project-ideas-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في مراجعة أفكار المشاريع وتطويرها من خلال تحليل مكوناتها وتحسين وضوحها وتنظيمها.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة الأفكار التطبيقية وتحليل عناصرها الأساسية، تشمل تحديد نقاط القوة، جوانب التحسين، وتطوير صياغة الفكرة لتصبح أكثر وضوحًا وتنظيمًا.',
    whoBenefitsAr:
      'الطلاب أصحاب المشاريع، طلاب ريادة الأعمال، أصحاب الأفكار التطبيقية، والباحثون في موضوعات الابتكار والمشاريع.',
    methodologiesAr:
      'Idea Evaluation, SWOT Analysis, Feasibility Assessment',
    requestTypes: [
      { type: 'online', label: 'تقييم فكرة', labelAr: 'تقييم فكرة', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي معايير تقييم الأفكار؟',
        answerAr: 'تشمل الجدوى، الإبداع، حجم السوق، الميزة التنافسية، وقابلية التنفيذ.',
        question: 'What are the evaluation criteria?',
        answer: 'Feasibility, creativity, market size, competitive advantage.',
        order: 0,
      },
      {
        questionAr: 'كيف يتم تطوير الفكرة؟',
        answerAr: 'يتم التطوير من خلال تحليل الفجوات وتقديم اقتراحات تحسين مبنية على أسس علمية.',
        question: 'How is the idea developed?',
        answer: 'By analyzing gaps and providing improvements.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 🌍 القسم 4: الاقتصاد
  // ============================================================
  'economic-data-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تحليل البيانات والمؤشرات الاقتصادية لفهم الاتجاهات والتغيرات الاقتصادية وتفسير النتائج بصورة منظمة.',
    whatIsServiceAr:
      'خدمة تطبيقية تهدف إلى دراسة البيانات الاقتصادية وتحليل المؤشرات المرتبطة بها، تشمل تنظيم البيانات، تفسير الاتجاهات، وتحسين عرض النتائج لدعم الدراسات والمشاريع.',
    whoBenefitsAr:
      'طلاب الاقتصاد، الباحثون في المجالات الاقتصادية، طلاب الدراسات التطبيقية، وأصحاب المشاريع البحثية.',
    methodologiesAr:
      'Economic Indicators Analysis, Trend Analysis, Descriptive Analysis, Data Interpretation',
    requestTypes: [
      { type: 'online', label: 'تحليل مؤشرات', labelAr: 'تحليل مؤشرات', isActive: true },
      { type: 'online', label: 'تفسير', labelAr: 'تفسير', isActive: true },
      { type: 'online', label: 'توصيات', labelAr: 'توصيات', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي المؤشرات الاقتصادية الرئيسية؟',
        answerAr: 'تشمل الناتج المحلي الإجمالي، التضخم، البطالة، ميزان المدفوعات، ومؤشرات الثقة.',
        question: 'What are the key economic indicators?',
        answer: 'GDP, inflation, unemployment, balance of payments, confidence indicators.',
        order: 0,
      },
      {
        questionAr: 'ما هي مصادر البيانات الاقتصادية؟',
        answerAr: 'تشمل البنوك المركزية، صندوق النقد الدولي، البنك الدولي، والمنظمات الدولية.',
        question: 'What are the data sources?',
        answer: 'Central banks, IMF, World Bank, and international organizations.',
        order: 1,
      },
    ],
  },

  'economic-studies-review': {
    overviewAr:
      'تدعمك هذه الخدمة في تطوير الدراسات الاقتصادية من خلال تنظيم المحتوى، تحليل المعلومات، وتحسين جودة الدراسة النهائية.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة الدراسات المرتبطة بالموضوعات الاقتصادية، تشمل تنظيم الإطار العام للدراسة، تحليل المعلومات، تطوير المناقشات، وتحسين المخرجات.',
    whoBenefitsAr:
      'طلاب الاقتصاد، طلاب الدراسات العليا، الباحثون في المجالات الاقتصادية، وأصحاب الدراسات التطبيقية.',
    methodologiesAr:
      'Economic Analysis Methods, Literature-Based Analysis, Comparative Analysis, Applied Economic Models',
    requestTypes: [
      { type: 'online', label: 'إعداد دراسة', labelAr: 'إعداد دراسة', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات الدراسة الاقتصادية؟',
        answerAr: 'تشمل المقدمة، الإطار النظري، المنهجية، التحليل، النتائج، والاستنتاجات.',
        question: 'What are the components?',
        answer: 'Introduction, theoretical framework, methodology, analysis, results.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد الدراسة؟',
        answerAr: 'تتراوح بين 7-14 يومًا.',
        question: 'How long does it take?',
        answer: '7-14 days.',
        order: 1,
      },
    ],
  },

  'business-data-statistical-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تحليل بيانات الأعمال وتحويلها إلى نتائج ومؤشرات تساعد على فهم المعلومات ودعم الدراسات التطبيقية.',
    whatIsServiceAr:
      'خدمة متخصصة في تحليل البيانات المرتبطة بالأعمال باستخدام الأساليب الإحصائية المناسبة، تشمل تجهيز البيانات، إجراء التحليلات، تفسير النتائج، وتحسين عرض المخرجات.',
    whoBenefitsAr:
      'طلاب إدارة الأعمال والاقتصاد، طلاب الدراسات العليا، الباحثون، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Descriptive Statistics, Correlation Analysis, Regression Analysis, Statistical Testing',
    requestTypes: [
      { type: 'online', label: 'تحليل إحصائي', labelAr: 'تحليل إحصائي', isActive: true },
      { type: 'online', label: 'تفسير', labelAr: 'تفسير', isActive: true },
      { type: 'online', label: 'توصيات', labelAr: 'توصيات', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أدوات التحليل الإحصائي المستخدمة؟',
        answerAr: 'تشمل SPSS، Excel، R، وPython حسب الحاجة.',
        question: 'What tools are used?',
        answer: 'SPSS, Excel, R, and Python.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة تحليل الانحدار؟',
        answerAr: 'نعم، تشمل تحليل الانحدار، الارتباط، وتحليل التباين.',
        question: 'Does it include regression analysis?',
        answer: 'Yes, includes regression, correlation, and ANOVA.',
        order: 1,
      },
    ],
  },

  'quantitative-models-guidance': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير نماذج كمية تساعد على تحليل المشكلات ودراسة البدائل واتخاذ القرارات بصورة منظمة.',
    whatIsServiceAr:
      'خدمة متخصصة في تطوير وتحليل النماذج الكمية المرتبطة بالمشاريع والدراسات التطبيقية، تشمل تنظيم المتغيرات، بناء النموذج المناسب، وتفسير النتائج لدعم عملية اتخاذ القرار.',
    whoBenefitsAr:
      'طلاب الاقتصاد وإدارة الأعمال، الباحثون في المجالات الكمية، الطلاب الذين لديهم مشاريع تحليلية، وأصحاب الدراسات التطبيقية.',
    methodologiesAr:
      'Quantitative Modeling, Decision Analysis, Optimization Methods, Mathematical Models',
    requestTypes: [
      { type: 'online', label: 'بناء نموذج', labelAr: 'بناء نموذج', isActive: true },
      { type: 'online', label: 'تحليل قرار', labelAr: 'تحليل قرار', isActive: true },
      { type: 'online', label: 'تفسير', labelAr: 'تفسير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع النماذج الكمية؟',
        answerAr: 'تشمل نماذج التحسين، المحاكاة، تحليل القرارات، ونماذج التنبؤ.',
        question: 'What types of quantitative models?',
        answer: 'Optimization, simulation, decision analysis, forecasting.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة تحليل المخاطر؟',
        answerAr: 'نعم، تشمل تحليل المخاطر وتقييم البدائل.',
        question: 'Does it include risk analysis?',
        answer: 'Yes, includes risk analysis and alternatives evaluation.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // ⚙️ القسم 5: العمليات والإنتاج
  // ============================================================
  'operations-process-mapping': {
    overviewAr:
      'تساعدك هذه الخدمة في توضيح وتنظيم العمليات من خلال إعداد خرائط ونماذج تساعد على فهم تسلسل الأنشطة ومراحل العمل.',
    whatIsServiceAr:
      'خدمة متخصصة في تطوير خرائط العمليات المرتبطة بالمشاريع والدراسات التطبيقية، تشمل تحديد خطوات العمل، تنظيم تدفق العمليات، وتحسين طريقة عرض الإجراءات والأنشطة.',
    whoBenefitsAr:
      'طلاب إدارة العمليات، طلاب إدارة الأعمال، الباحثون في الدراسات التطبيقية، وأصحاب المشاريع الدراسية.',
    methodologiesAr:
      'Process Mapping, Flowcharts, Business Process Modeling, Workflow Analysis',
    requestTypes: [
      { type: 'online', label: 'إعداد خريطة', labelAr: 'إعداد خريطة', isActive: true },
      { type: 'online', label: 'تحليل تدفق', labelAr: 'تحليل تدفق', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع خرائط العمليات؟',
        answerAr: 'تشمل خرائط التدفق، خرائط القيمة، خرائط السبب والنتيجة، وخرائط العلاقات.',
        question: 'What types of process maps?',
        answer: 'Flow charts, value stream maps, cause-effect diagrams.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية إعداد الخريطة؟',
        answerAr: 'تتراوح بين 2-5 أيام حسب تعقيد العمليات.',
        question: 'How long does it take?',
        answer: '2-5 days depending on complexity.',
        order: 1,
      },
    ],
  },

  'operations-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في فهم وتحليل العمليات التشغيلية وتطوير تنظيمها من خلال مراجعة خطوات العمل، تحديد فرص التحسين، وتحسين جودة المخرجات.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة وتحليل العمليات المرتبطة بالمشاريع والدراسات التطبيقية، تشمل دراسة تسلسل الأنشطة، تحليل الإجراءات، تحديد نقاط التحسين، وتطوير مقترحات تنظيمية.',
    whoBenefitsAr:
      'طلاب إدارة العمليات، طلاب إدارة الأعمال، الباحثون في الدراسات التطبيقية، وأصحاب المشاريع الدراسية المرتبطة بالعمليات.',
    methodologiesAr:
      'Process Analysis, Process Improvement, Workflow Analysis, Operations Management Tools',
    requestTypes: [
      { type: 'online', label: 'تحليل عمليات', labelAr: 'تحليل عمليات', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أدوات تحليل العمليات؟',
        answerAr: 'تشمل خرائط التدفق، تحليل القيمة، تحليل السبب الجذري، وقياس الأداء.',
        question: 'What tools are used?',
        answer: 'Flow charts, value analysis, root cause analysis.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تتراوح بين 3-7 أيام حسب حجم العمليات.',
        question: 'How long does it take?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'production-planning-models': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير نماذج تساعد على تنظيم وتخطيط العمليات الإنتاجية والتشغيلية من خلال ترتيب الموارد والأنشطة بصورة منهجية.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد وتطوير النماذج المرتبطة بتخطيط العمليات والإنتاج، تشمل تنظيم بيانات الموارد، تحليل القدرة التشغيلية، وتطوير نماذج تساعد على فهم وتنظيم سير العمل.',
    whoBenefitsAr:
      'طلاب إدارة العمليات، طلاب إدارة الأعمال، الباحثون في المجالات التشغيلية، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Production Planning Models, Capacity Analysis, Scheduling Methods, Operations Planning Tools',
    requestTypes: [
      { type: 'online', label: 'تخطيط إنتاج', labelAr: 'تخطيط إنتاج', isActive: true },
      { type: 'online', label: 'تحليل قدرات', labelAr: 'تحليل قدرات', isActive: true },
      { type: 'online', label: 'جدولة', labelAr: 'جدولة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أساليب تخطيط الإنتاج؟',
        answerAr: 'تشمل MRP، ERP، وجدولة الإنتاج المتقدمة.',
        question: 'What are the methods?',
        answer: 'MRP, ERP, advanced production scheduling.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة تحليل الطاقة الإنتاجية؟',
        answerAr: 'نعم، تشمل تحليل القدرات الإنتاجية والموارد.',
        question: 'Does it include capacity analysis?',
        answer: 'Yes, includes capacity and resources analysis.',
        order: 1,
      },
    ],
  },

  'inventory-management-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير وتحليل نماذج إدارة المخزون لفهم تنظيم الموارد ومستويات التخزين واتخاذ قرارات تشغيلية أفضل.',
    whatIsServiceAr:
      'خدمة تطبيقية متخصصة في مراجعة وتطوير نماذج المخزون المرتبطة بالمشاريع والدراسات، تشمل تحليل بيانات الطلب، تنظيم مستويات المخزون، ومراجعة النماذج المستخدمة.',
    whoBenefitsAr:
      'طلاب إدارة العمليات وسلاسل الإمداد، طلاب إدارة الأعمال، الباحثون في المجالات التشغيلية، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Inventory Analysis, Economic Order Quantity (EOQ), Demand Analysis, Inventory Control Models',
    requestTypes: [
      { type: 'online', label: 'تحليل مخزون', labelAr: 'تحليل مخزون', isActive: true },
      { type: 'online', label: 'تطوير نموذج', labelAr: 'تطوير نموذج', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي نماذج إدارة المخزون؟',
        answerAr: 'تشمل EOQ، JIT، ونماذج المراجعة الدورية والمستمرة.',
        question: 'What inventory models?',
        answer: 'EOQ, JIT, periodic and continuous review models.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التطوير؟',
        answerAr: 'تتراوح بين 3-5 أيام حسب حجم المخزون.',
        question: 'How long does it take?',
        answer: '3-5 days.',
        order: 1,
      },
    ],
  },

  'supply-chain-analysis': {
    overviewAr:
      'تساعدك هذه الخدمة في تحليل وتنظيم مكونات سلسلة الإمداد من خلال تطوير نماذج توضح العلاقات بين التوريد والتخزين والتوزيع.',
    whatIsServiceAr:
      'خدمة متخصصة في تطوير نماذج تحليلية مرتبطة بسلاسل الإمداد، تشمل دراسة تدفق المواد والمعلومات، تحليل عناصر السلسلة، وتحسين طريقة عرض العمليات المرتبطة بها.',
    whoBenefitsAr:
      'طلاب إدارة سلاسل الإمداد، طلاب إدارة العمليات، الباحثون في المجالات التشغيلية، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Supply Chain Mapping, Supply Chain Analysis, Logistics Analysis, Process Flow Analysis',
    requestTypes: [
      { type: 'online', label: 'تحليل سلسلة', labelAr: 'تحليل سلسلة', isActive: true },
      { type: 'online', label: 'تطوير نموذج', labelAr: 'تطوير نموذج', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات سلسلة الإمداد؟',
        answerAr: 'تشمل الموردين، التصنيع، التوزيع، والعملاء.',
        question: 'What are the components?',
        answer: 'Suppliers, manufacturing, distribution, customers.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تتراوح بين 5-10 أيام حسب تعقيد السلسلة.',
        question: 'How long does it take?',
        answer: '5-10 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 📊 القسم 6: التقارير والدراسات التطبيقية
  // ============================================================
  'applied-studies-guidance': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير الدراسات التطبيقية المرتبطة بمجالات الأعمال والاقتصاد من خلال تنظيم المحتوى، تحليل المعلومات، وتحسين جودة المخرجات.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد وتطوير الدراسات التي تجمع بين الجانب العلمي والتطبيق العملي، تشمل تنظيم موضوع الدراسة، تحليل المعلومات، تطبيق الأساليب المناسبة، وتحسين عرض النتائج والاستنتاجات.',
    whoBenefitsAr:
      'طلاب الجامعات في مجالات الأعمال والاقتصاد، طلاب الدراسات العليا، الباحثون في الدراسات التطبيقية، وأصحاب المشاريع الدراسية.',
    methodologiesAr:
      'Applied Research Methods, Case Study Approach, Data Analysis Methods, Analytical Frameworks',
    requestTypes: [
      { type: 'online', label: 'إعداد دراسة', labelAr: 'إعداد دراسة', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع الدراسات التطبيقية؟',
        answerAr: 'تشمل دراسات الحالة، الدراسات الميدانية، الدراسات التحليلية، والدراسات المقارنة.',
        question: 'What types of applied studies?',
        answer: 'Case studies, field studies, analytical studies, comparative studies.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية الإعداد؟',
        answerAr: 'تتراوح بين 5-12 يومًا حسب حجم الدراسة.',
        question: 'How long does it take?',
        answer: '5-12 days.',
        order: 1,
      },
    ],
  },

  'applied-reports-review': {
    overviewAr:
      'تساعدك هذه الخدمة في إعداد وتطوير التقارير التطبيقية من خلال تنظيم المحتوى، تحسين التحليل، ومراجعة جودة المخرجات النهائية.',
    whatIsServiceAr:
      'خدمة تهدف إلى دعم إعداد ومراجعة التقارير المرتبطة بالمشاريع والدراسات التطبيقية، تشمل تطوير هيكل التقرير، تنظيم المعلومات، تحسين العرض، ومراجعة جودة المحتوى.',
    whoBenefitsAr:
      'طلاب الجامعات، الباحثون، أصحاب المشاريع الدراسية، والمهتمون بتطوير جودة التقارير.',
    methodologiesAr:
      'Report Structure Development, Analytical Reporting, Content Review, Data Presentation Methods',
    requestTypes: [
      { type: 'online', label: 'إعداد تقرير', labelAr: 'إعداد تقرير', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي معايير جودة التقارير؟',
        answerAr: 'تشمل الدقة، الوضوح، التنظيم، الشمولية، والالتزام بالمعايير الأكاديمية.',
        question: 'What are quality standards?',
        answer: 'Accuracy, clarity, organization, comprehensiveness.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية المراجعة؟',
        answerAr: 'تستغرق 2-4 أيام حسب حجم التقرير.',
        question: 'How long does the review take?',
        answer: '2-4 days.',
        order: 1,
      },
    ],
  },

  'project-presentation-development': {
    overviewAr:
      'تساعدك هذه الخدمة في تطوير عروض المشاريع والدراسات من خلال تنظيم المحتوى وتحسين تسلسل الأفكار وطريقة عرض النتائج.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد ومراجعة وتطوير العروض التقديمية المرتبطة بالمشاريع والأعمال التطبيقية، تشمل تنظيم الشرائح، تحسين وضوح المعلومات، وتطوير طريقة تقديم المحتوى.',
    whoBenefitsAr:
      'طلاب الجامعات، أصحاب المشاريع الدراسية، الباحثون، ومقدمو العروض الأكاديمية والتطبيقية.',
    methodologiesAr:
      'Presentation Design Principles, Information Visualization, Storytelling Techniques, Content Organization',
    requestTypes: [
      { type: 'online', label: 'تصميم عرض', labelAr: 'تصميم عرض', isActive: true },
      { type: 'online', label: 'تنظيم محتوى', labelAr: 'تنظيم محتوى', isActive: true },
      { type: 'online', label: 'تحسين', labelAr: 'تحسين', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أفضل ممارسات تصميم العروض؟',
        answerAr: 'تشمل استخدام ألوان متناسقة، نصوص واضحة، عناصر بصرية جذابة، وتسلسل منطقي.',
        question: 'What are the best practices?',
        answer: 'Consistent colors, clear text, attractive visuals, logical flow.',
        order: 0,
      },
      {
        questionAr: 'كم عدد الشرائح المثالي؟',
        answerAr: 'يتراوح بين 10-20 شريحة حسب الموضوع والوقت المخصص.',
        question: 'How many slides?',
        answer: '10-20 slides depending on topic and time.',
        order: 1,
      },
    ],
  },

  'analytical-templates-development': {
    overviewAr:
      'تساعدك هذه الخدمة في تصميم وتطوير النماذج والجداول التحليلية التي تسهم في تنظيم البيانات وعرض النتائج بطريقة أكثر وضوحًا.',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد وتحسين النماذج والجداول المستخدمة في المشاريع والدراسات التطبيقية، تشمل تنظيم البيانات، تحسين هيكل النموذج، وتطوير طريقة عرض المؤشرات والنتائج.',
    whoBenefitsAr:
      'طلاب الأعمال والاقتصاد، الباحثون، أصحاب المشاريع التطبيقية، والطلاب الذين يحتاجون إلى تنظيم بياناتهم وتحليلاتهم.',
    methodologiesAr:
      'Analytical Modeling, Spreadsheet Development, Data Organization, Dashboard Structures',
    requestTypes: [
      { type: 'online', label: 'تصميم نموذج', labelAr: 'تصميم نموذج', isActive: true },
      { type: 'online', label: 'تطوير جدول', labelAr: 'تطوير جدول', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنواع النماذج التحليلية؟',
        answerAr: 'تشمل نماذج التحليل المالي، الإحصائي، استخراج البيانات، ونماذج التنبؤ.',
        question: 'What types of analytical models?',
        answer: 'Financial, statistical, data mining, forecasting.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الخدمة نماذج Excel؟',
        answerAr: 'نعم، تشمل تصميم نماذج Excel احترافية مع معادلات تحليلية.',
        question: 'Does it include Excel templates?',
        answer: 'Yes, includes professional Excel models.',
        order: 1,
      },
    ],
  },

  'applied-work-review': {
    overviewAr:
      'تساعدك هذه الخدمة في مراجعة وتقييم الأعمال التطبيقية بهدف تحسين جودتها والتأكد من تنظيمها وتوافقها مع المتطلبات.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة المشاريع والتقارير والدراسات التطبيقية، تشمل تقييم جودة المحتوى، مراجعة التنظيم، تحديد نقاط التحسين، وتقديم ملاحظات تطويرية.',
    whoBenefitsAr:
      'طلاب الجامعات، طلاب الدراسات العليا، الباحثون، وأصحاب المشاريع التطبيقية.',
    methodologiesAr:
      'Quality Review, Evaluation Criteria, Content Assessment, Requirement Analysis',
    requestTypes: [
      { type: 'online', label: 'مراجعة أعمال', labelAr: 'مراجعة أعمال', isActive: true },
      { type: 'online', label: 'تقييم', labelAr: 'تقييم', isActive: true },
      { type: 'online', label: 'تحليل', labelAr: 'تحليل', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي معايير التقييم؟',
        answerAr: 'تشمل الجودة، الدقة، الالتزام، الابتكار، والتنظيم.',
        question: 'What are the evaluation criteria?',
        answer: 'Quality, accuracy, compliance, innovation, organization.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية المراجعة؟',
        answerAr: 'تستغرق 2-5 أيام حسب حجم العمل.',
        question: 'How long does the review take?',
        answer: '2-5 days.',
        order: 1,
      },
    ],
  },

  'final-outputs-quality': {
    overviewAr:
      'تساعدك هذه الخدمة في تحسين جودة المخرجات النهائية للمشاريع والتقارير والعروض من خلال المراجعة والتطوير والتنظيم قبل التسليم.',
    whatIsServiceAr:
      'خدمة متخصصة في مراجعة وتحسين المنتجات النهائية المرتبطة بالأعمال والدراسات التطبيقية، تشمل تحسين التنظيم، تطوير العرض، معالجة جوانب الضعف، ورفع جاهزية العمل للتقديم.',
    whoBenefitsAr:
      'طلاب الجامعات، طلاب الدراسات العليا، الباحثون، وأصحاب المشاريع الدراسية والتطبيقية.',
    methodologiesAr:
      'Quality Improvement Methods, Content Enhancement, Final Review Checklist, Presentation Improvement',
    requestTypes: [
      { type: 'online', label: 'تحسين مخرجات', labelAr: 'تحسين مخرجات', isActive: true },
      { type: 'online', label: 'مراجعة', labelAr: 'مراجعة', isActive: true },
      { type: 'online', label: 'تطوير', labelAr: 'تطوير', isActive: true },
      { type: 'online', label: 'استشارة', labelAr: 'استشارة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مجالات التحسين؟',
        answerAr: 'تشمل الجودة، الكفاءة، الفعالية، والمظهر الاحترافي.',
        question: 'What are the improvement areas?',
        answer: 'Quality, efficiency, effectiveness, professional look.',
        order: 0,
      },
      {
        questionAr: 'كيف يتم قياس التحسين؟',
        answerAr: 'يتم القياس باستخدام مؤشرات الأداء الرئيسية ومعايير الجودة.',
        question: 'How is improvement measured?',
        answer: 'Using KPIs and quality standards.',
        order: 1,
      },
    ],
  },
};

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const seedBusinessServiceDetails = async () => {
  try {
    console.log('🚀 Starting business ServiceDetails seed...\n');

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;
    let notFound = 0;

    // ============================================================
    // لكل slug، ابحث عن الخدمة وأنشئ ServiceDetail
    // ============================================================
    for (const [slug, detailData] of Object.entries(SERVICE_DETAILS_DATA)) {
      // ابحث عن الخدمة
      const service = await Service.findOne({
        portalId: PORTAL_ID,
        slug,
        isDeleted: { $ne: true },
      }).select('_id sectionId');

      if (!service) {
        console.warn(`  ⚠️  Service not found: ${slug}`);
        notFound++;
        continue;
      }

      // افحص إن كانت التفاصيل موجودة
      const existing = await ServiceDetail.findOne({
        portalId: PORTAL_ID,
        serviceId: service._id,
        isDeleted: { $ne: true },
      });

      if (existing) {
        console.log(`  ⏭️  ServiceDetail exists: ${slug}`);
        skipped++;
        continue;
      }

      // أنشئ ServiceDetail
      const serviceDetail = new ServiceDetail({
        portalId: PORTAL_ID,
        sectionId: service.sectionId,
        serviceId: service._id,
        overview: detailData.overview || detailData.overviewAr || '',
        overviewAr: detailData.overviewAr || '',
        whatIsService: detailData.whatIsService || detailData.whatIsServiceAr || '',
        whatIsServiceAr: detailData.whatIsServiceAr || '',
        whoBenefits: detailData.whoBenefits || detailData.whoBenefitsAr || '',
        whoBenefitsAr: detailData.whoBenefitsAr || '',
        methodologies: detailData.methodologies || detailData.methodologiesAr || '',
        methodologiesAr: detailData.methodologiesAr || '',
        gallery: detailData.gallery || [],
        requestTypes: detailData.requestTypes || [],
        faqs: detailData.faqs || [],
        isPublished: true,
      });

      await serviceDetail.save();
      created++;
      console.log(`  ✅ Created ServiceDetail: ${slug}`);

      if (created % 10 === 0) {
        console.log(`  📊 Progress: ${created} ServiceDetails created...`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Created: ${created} ServiceDetails`);
    console.log(`  ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`  ⚠️  Not found: ${notFound} services`);
    console.log(`\n🎉 Business ServiceDetails seed completed!`);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedBusinessServiceDetails();