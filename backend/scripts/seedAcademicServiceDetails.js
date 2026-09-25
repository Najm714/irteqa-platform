// backend/scripts/seedAcademicServiceDetails.js
// ============================================================
// 🚀 إضافة ServiceDetail لكل خدمة أكاديمية
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/seedAcademicServiceDetails.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from '../src/models/Service.model.js';
import { ServiceDetail } from '../src/models/ServiceDetail.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ============================================================
// 📋 بيانات ServiceDetail لكل خدمة أكاديمية (حسب slug)
// ============================================================
const SERVICE_DETAILS_DATA = {
  // ============================================================
  // 🔬 القسم 1: بحث علمي (12 خدمة)
  // ============================================================
  'academic-consulting': {
    overviewAr:
      'استشارات أكاديمية متخصصة لمساعدتك في جميع مراحل بحثك العلمي',
    whatIsServiceAr:
      'خدمة متخصصة في تقديم الاستشارات الأكاديمية للباحثين والطلاب في مختلف المجالات، تشمل التوجيه البحثي، حل المشكلات الأكاديمية، وتقديم النصائح المهنية.',
    whoBenefitsAr:
      'طلاب الدراسات العليا، الباحثون، أعضاء هيئة التدريس، والطلاب الجامعيون',
    methodologiesAr:
      'التوجيه الأكاديمي، المراجعة العلمية، تحليل المشكلات، التخطيط البحثي',
    requestTypes: [
      { type: 'online', label: 'استشارة عامة', labelAr: 'استشارة عامة', isActive: true },
      { type: 'online', label: 'توجيه بحثي', labelAr: 'توجيه بحثي', isActive: true },
      { type: 'online', label: 'مراجعة أكاديمية', labelAr: 'مراجعة أكاديمية', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مجالات الاستشارات الأكاديمية؟',
        answerAr: 'تشمل جميع التخصصات الأكاديمية والعلمية.',
        question: 'What fields are covered?',
        answer: 'All academic and scientific disciplines.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق الجلسة الاستشارية؟',
        answerAr: 'تتراوح بين 30-60 دقيقة حسب الموضوع.',
        question: 'How long does a session take?',
        answer: '30-60 minutes depending on the topic.',
        order: 1,
      },
    ],
  },

  'thesis-titles-suggestion': {
    overviewAr: 'نقدم لك عناوين بحثية مبتكرة وأصيلة في تخصصك الأكاديمي',
    whatIsServiceAr:
      'خدمة متخصصة في اقتراح عناوين رسائل ماجستير ودكتوراه مبتكرة، تعتمد على تحليل الاتجاهات البحثية الحديثة والفجوات المعرفية في التخصص.',
    whoBenefitsAr: 'طلاب الماجستير، طلاب الدكتوراه، والباحثون الجدد',
    methodologiesAr:
      'تحليل الاتجاهات البحثية، دراسة الفجوات المعرفية، تحليل الكلمات المفتاحية',
    requestTypes: [
      { type: 'online', label: 'اقتراح عناوين', labelAr: 'اقتراح عناوين', isActive: true },
      { type: 'online', label: 'تحسين عنوان', labelAr: 'تحسين عنوان', isActive: true },
      { type: 'online', label: 'تطوير فكرة', labelAr: 'تطوير فكرة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'كم عدد العناوين المقترحة؟',
        answerAr: 'يتم اقتراح 5-10 عناوين مبتكرة.',
        question: 'How many titles are suggested?',
        answer: '5-10 innovative titles.',
        order: 0,
      },
      {
        questionAr: 'هل العناوين مقترحة حسب التخصص؟',
        answerAr: 'نعم، حسب تخصص العميل ومجال اهتمامه.',
        question: 'Are titles field-specific?',
        answer: 'Yes, based on client specialty.',
        order: 1,
      },
    ],
  },

  'research-proposal-preparation': {
    overviewAr: 'خطة بحثية متكاملة وفق أعلى المعايير الأكاديمية',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد المقترحات البحثية (Research Proposals) وفق المعايير الأكاديمية المعتمدة، تشمل الإطار النظري، المنهجية، والمراجع.',
    whoBenefitsAr:
      'طلاب الماجستير، طلاب الدكتوراه، والباحثون المتقدمون للمنح',
    methodologiesAr:
      'تطوير الإطار النظري، تصميم المنهجية، صياغة الأهداف',
    requestTypes: [
      { type: 'online', label: 'إعداد مقترح', labelAr: 'إعداد مقترح', isActive: true },
      { type: 'online', label: 'مراجعة مقترح', labelAr: 'مراجعة مقترح', isActive: true },
      { type: 'online', label: 'تطوير خطة بحث', labelAr: 'تطوير خطة بحث', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات المقترح البحثي؟',
        answerAr: 'المقدمة، مشكلة البحث، الأهداف، المنهجية، والمراجع.',
        question: 'What are the components?',
        answer: 'Introduction, problem, objectives, methodology, references.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية الإعداد؟',
        answerAr: 'تتراوح بين 5-10 أيام حسب تعقيد الموضوع.',
        question: 'How long does it take?',
        answer: '5-10 days depending on complexity.',
        order: 1,
      },
    ],
  },

  'previous-studies-collection': {
    overviewAr: 'جمع وتحليل الدراسات العربية والعالمية في مجال تخصصك',
    whatIsServiceAr:
      'خدمة متخصصة في جمع الدراسات السابقة من مصادر عربية وعالمية، مع تحليل شامل وتصنيف حسب المنهجية والنتائج.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'البحث المنهجي، تحليل المحتوى، تصنيف الدراسات',
    requestTypes: [
      { type: 'online', label: 'جمع دراسات', labelAr: 'جمع دراسات', isActive: true },
      { type: 'online', label: 'تحليل أدبيات', labelAr: 'تحليل أدبيات', isActive: true },
      { type: 'online', label: 'مراجعة منهجية', labelAr: 'مراجعة منهجية', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هو عدد الدراسات التي يتم جمعها؟',
        answerAr: 'يتم جمع 15-30 دراسة حسب الموضوع.',
        question: 'How many studies?',
        answer: '15-30 studies depending on topic.',
        order: 0,
      },
      {
        questionAr: 'هل تشمل الدراسات الأجنبية؟',
        answerAr: 'نعم، تشمل الدراسات العربية والأجنبية.',
        question: 'Does it include foreign studies?',
        answer: 'Yes, Arabic and foreign.',
        order: 1,
      },
    ],
  },

  'scientific-material-collection': {
    overviewAr:
      'جمع المادة العلمية من مصادر موثوقة وتوثيقها بشكل احترافي',
    whatIsServiceAr:
      'خدمة متخصصة في جمع وتوثيق المادة العلمية من مصادر موثوقة، مع تنظيمها وتصنيفها حسب الموضوع والتسلسل المنطقي.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'جمع المصادر، توثيق المراجع، تنظيم المحتوى',
    requestTypes: [
      { type: 'online', label: 'جمع مادة علمية', labelAr: 'جمع مادة علمية', isActive: true },
      { type: 'online', label: 'توثيق مراجع', labelAr: 'توثيق مراجع', isActive: true },
      { type: 'online', label: 'تنظيم محتوى', labelAr: 'تنظيم محتوى', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنظمة التوثيق المستخدمة؟',
        answerAr: 'APA, MLA, Chicago, Harvard حسب الطلب.',
        question: 'What citation styles?',
        answer: 'APA, MLA, Chicago, Harvard on request.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التوثيق؟',
        answerAr: 'تستغرق 2-4 أيام حسب حجم المادة.',
        question: 'How long does it take?',
        answer: '2-4 days depending on material.',
        order: 1,
      },
    ],
  },

  'academic-critique': {
    overviewAr: 'نقد علمي بناء من خبراء متخصصين في مجال البحث',
    whatIsServiceAr:
      'خدمة متخصصة في تقديم نقد أكاديمي بناء للأبحاث والرسائل العلمية، تشمل تحليل المحتوى، تقييم المنهجية، واقتراح التحسينات.',
    whoBenefitsAr:
      'طلاب الدراسات العليا، الباحثون، والكتاب الأكاديميون',
    methodologiesAr: 'التحليل النقدي، تقييم المحتوى، مراجعة المنهجية',
    requestTypes: [
      { type: 'online', label: 'نقد بحث', labelAr: 'نقد بحث', isActive: true },
      { type: 'online', label: 'مراجعة نقدية', labelAr: 'مراجعة نقدية', isActive: true },
      { type: 'online', label: 'تقييم أكاديمي', labelAr: 'تقييم أكاديمي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي جوانب النقد؟',
        answerAr: 'المحتوى، المنهجية، التحليل، والاستنتاجات.',
        question: 'What aspects are critiqued?',
        answer: 'Content, methodology, analysis, conclusions.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية النقد؟',
        answerAr: 'تستغرق 3-7 أيام حسب حجم العمل.',
        question: 'How long does it take?',
        answer: '3-7 days depending on work.',
        order: 1,
      },
    ],
  },

  'thesis-formatting': {
    overviewAr: 'تنسيق الرسائل العلمية وفق دليل الجامعة بدقة احترافية',
    whatIsServiceAr:
      'خدمة متخصصة في تنسيق الرسائل العلمية (ماجستير/دكتوراه) وفق دليل الجامعة المعتمد، تشمل التنسيق الكامل للهوامش والعناوين والمراجع.',
    whoBenefitsAr: 'طلاب الماجستير، طلاب الدكتوراه، والباحثون',
    methodologiesAr: 'تنسيق النصوص، تنظيم الهيكل، توحيد التنسيق',
    requestTypes: [
      { type: 'online', label: 'تنسيق رسالة', labelAr: 'تنسيق رسالة', isActive: true },
      { type: 'online', label: 'مراجعة تنسيق', labelAr: 'مراجعة تنسيق', isActive: true },
      { type: 'online', label: 'تحسين الهيكل', labelAr: 'تحسين الهيكل', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنظمة التنسيق المتاحة؟',
        answerAr: 'جميع أدلة الجامعات العربية والأجنبية.',
        question: 'What formatting styles?',
        answer: 'All Arabic and foreign university guides.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التنسيق؟',
        answerAr: 'تستغرق 2-5 أيام حسب حجم الرسالة.',
        question: 'How long does it take?',
        answer: '2-5 days depending on thesis size.',
        order: 1,
      },
    ],
  },

  'results-discussion': {
    overviewAr: 'تفسير علمي دقيق للنتائج وربطها بالأدبيات السابقة',
    whatIsServiceAr:
      'خدمة متخصصة في مناقشة نتائج البحث العلمي، تشمل تفسير النتائج، ربطها بالأدبيات السابقة، واقتراح التوصيات.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تفسير النتائج، تحليل العلاقات، صياغة التوصيات',
    requestTypes: [
      { type: 'online', label: 'مناقشة نتائج', labelAr: 'مناقشة نتائج', isActive: true },
      { type: 'online', label: 'تفسير بيانات', labelAr: 'تفسير بيانات', isActive: true },
      { type: 'online', label: 'توصيات بحثية', labelAr: 'توصيات بحثية', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي عناصر مناقشة النتائج؟',
        answerAr: 'تفسير النتائج، المقارنة مع الدراسات السابقة، والتوصيات.',
        question: 'What are the elements?',
        answer: 'Interpretation, comparison with literature, recommendations.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: 'تستغرق 3-5 أيام حسب حجم النتائج.',
        question: 'How long?',
        answer: '3-5 days.',
        order: 1,
      },
    ],
  },

  'conceptual-framework': {
    overviewAr: 'بناء تصور أو نموذج بحثي مبتكر لدراستك',
    whatIsServiceAr:
      'خدمة متخصصة في بناء التصورات والنماذج البحثية، تشمل تطوير الإطار النظري، تحديد المتغيرات، وبناء العلاقات بينها.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، ومصممو الدراسات',
    methodologiesAr: 'تطوير النماذج، تحليل العلاقات، بناء التصورات',
    requestTypes: [
      { type: 'online', label: 'بناء تصور', labelAr: 'بناء تصور', isActive: true },
      { type: 'online', label: 'تطوير نموذج', labelAr: 'تطوير نموذج', isActive: true },
      { type: 'online', label: 'تصميم إطار', labelAr: 'تصميم إطار', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات التصور المقترح؟',
        answerAr: 'المتغيرات، العلاقات، والافتراضات.',
        question: 'What are the components?',
        answer: 'Variables, relationships, assumptions.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: 'تستغرق 3-7 أيام حسب التعقيد.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'science-mapping-analysis': {
    overviewAr:
      'تحليل ورسم خرائط علمية باستخدام أحدث البرامج والتقنيات',
    whatIsServiceAr:
      'خدمة متخصصة في تحليل ورسم الخرائط العلمية (Science Mapping) باستخدام برامج مثل VOSviewer و CiteSpace، لتحديد الاتجاهات البحثية.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والمكتبيون الأكاديميون',
    methodologiesAr: 'تحليل الشبكات، رسم الخرائط، تحليل الاتجاهات',
    requestTypes: [
      { type: 'online', label: 'رسم خريطة', labelAr: 'رسم خريطة', isActive: true },
      { type: 'online', label: 'تحليل شبكات', labelAr: 'تحليل شبكات', isActive: true },
      { type: 'online', label: 'تحليل اتجاهات', labelAr: 'تحليل اتجاهات', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي البرامج المستخدمة؟',
        answerAr: 'VOSviewer, CiteSpace, Gephi وغيرها.',
        question: 'What software?',
        answer: 'VOSviewer, CiteSpace, Gephi.',
        order: 0,
      },
      {
        questionAr: 'ما هي مدة التحليل؟',
        answerAr: 'تستغرق 3-5 أيام حسب حجم البيانات.',
        question: 'How long?',
        answer: '3-5 days.',
        order: 1,
      },
    ],
  },

  'quick-consulting-sessions': {
    overviewAr:
      'جلسات استشارية سريعة مع خبراء لحل مشكلاتك البحثية',
    whatIsServiceAr:
      'خدمة جلسات استشارية سريعة (30-60 دقيقة) مع خبراء متخصصين لحل المشكلات البحثية الطارئة وتقديم التوجيه الفوري.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'الاستشارة السريعة، حل المشكلات، التوجيه الفوري',
    requestTypes: [
      { type: 'online', label: 'استشارة سريعة', labelAr: 'استشارة سريعة', isActive: true },
      { type: 'online', label: 'حل مشكلة', labelAr: 'حل مشكلة', isActive: true },
      { type: 'online', label: 'توجيه فوري', labelAr: 'توجيه فوري', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مدة الجلسة؟',
        answerAr: 'تتراوح بين 30-60 دقيقة.',
        question: 'Session duration?',
        answer: '30-60 minutes.',
        order: 0,
      },
      {
        questionAr: 'هل الجلسة عبر الإنترنت؟',
        answerAr: 'نعم، عبر Zoom أو Teams أو أي منصة أخرى.',
        question: 'Is it online?',
        answer: 'Yes, via Zoom, Teams, etc.',
        order: 1,
      },
    ],
  },

  'research-grants-preparation': {
    overviewAr:
      'إعداد مقترحات احترافية للحصول على تمويل بحثي ومنح دراسية',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد مقترحات الحصول على التمويل البحثي والمنح الدراسية، تشمل صياغة المقترح، تحديد الميزانية، وتقديم خطة العمل.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والمؤسسات الأكاديمية',
    methodologiesAr:
      'إعداد المقترحات، تخطيط الميزانية، صياغة خطط العمل',
    requestTypes: [
      { type: 'online', label: 'إعداد مقترح تمويل', labelAr: 'إعداد مقترح تمويل', isActive: true },
      { type: 'online', label: 'تخطيط ميزانية', labelAr: 'تخطيط ميزانية', isActive: true },
      { type: 'online', label: 'تقديم منحة', labelAr: 'تقديم منحة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي جهات التمويل المستهدفة؟',
        answerAr: 'الجامعات، المؤسسات البحثية، والمنظمات الدولية.',
        question: 'Target funding bodies?',
        answer: 'Universities, research institutions, international organizations.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية الإعداد؟',
        answerAr: 'تستغرق 5-14 يوم حسب تعقيد المقترح.',
        question: 'How long?',
        answer: '5-14 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 📊 القسم 2: التحليل الإحصائي (9 خدمات)
  // ============================================================
  'spss-statistical-analysis': {
    overviewAr:
      'تحليل إحصائي احترافي باستخدام SPSS مع مناقشة النتائج',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل الإحصائي باستخدام برنامج SPSS، تشمل تحليل البيانات، تفسير النتائج، وإعداد التقارير الإحصائية.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تحليل البيانات، الاختبارات الإحصائية، تفسير النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل SPSS', labelAr: 'تحليل SPSS', isActive: true },
      { type: 'online', label: 'تفسير نتائج', labelAr: 'تفسير نتائج', isActive: true },
      { type: 'online', label: 'تقرير إحصائي', labelAr: 'تقرير إحصائي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي الاختبارات المتاحة؟',
        answerAr: 'جميع اختبارات SPSS الإحصائية.',
        question: 'What tests are available?',
        answer: 'All SPSS statistical tests.',
        order: 0,
      },
      {
        questionAr: 'هل يتم تقديم تفسير للنتائج؟',
        answerAr: 'نعم، تفسير مفصل باللغة العربية.',
        question: 'Is interpretation provided?',
        answer: 'Yes, in Arabic.',
        order: 1,
      },
    ],
  },

  'meta-analysis': {
    overviewAr:
      'تحليل تلوي متقدم باستخدام أحدث البرامج الإحصائية',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل التلوي (Meta-analysis)، تشمل جمع الدراسات، حساب حجم الأثر، وتحليل النتائج باستخدام برامج متخصصة.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'جمع الدراسات، حساب حجم الأثر، تحليل النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل تلوي', labelAr: 'تحليل تلوي', isActive: true },
      { type: 'online', label: 'حجم الأثر', labelAr: 'حجم الأثر', isActive: true },
      { type: 'online', label: 'تقرير تحليل', labelAr: 'تقرير تحليل', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي البرامج المستخدمة؟',
        answerAr: 'CMA, R, Stata وغيرها.',
        question: 'What software?',
        answer: 'CMA, R, Stata.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تستغرق 5-10 أيام حسب عدد الدراسات.',
        question: 'How long?',
        answer: '5-10 days.',
        order: 1,
      },
    ],
  },

  'medical-research-statistics': {
    overviewAr:
      'تحليل إحصائي متخصص للبحوث الطبية والسريرية',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل الإحصائي للبحوث الطبية والسريرية، تشمل تحليل البيانات الطبية، الاختبارات الإحصائية المتخصصة، وتفسير النتائج.',
    whoBenefitsAr:
      'الباحثون الطبيون، طلاب الطب، والكتاب الأكاديميون',
    methodologiesAr:
      'تحليل البيانات الطبية، الاختبارات الإحصائية، تفسير النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل طبي', labelAr: 'تحليل طبي', isActive: true },
      { type: 'online', label: 'تفسير نتائج', labelAr: 'تفسير نتائج', isActive: true },
      { type: 'online', label: 'تقرير إحصائي', labelAr: 'تقرير إحصائي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي الاختبارات المتاحة للبحوث الطبية؟',
        answerAr: 'اختبارات خاصة بالبحوث السريرية والوبائية.',
        question: 'Available tests?',
        answer: 'Clinical and epidemiological tests.',
        order: 0,
      },
      {
        questionAr: 'هل يتم تقديم تفسير طبي؟',
        answerAr: 'نعم، تفسير متوافق مع المعايير الطبية.',
        question: 'Medical interpretation?',
        answer: 'Yes, medical standards-compliant.',
        order: 1,
      },
    ],
  },

  'amos-statistical-analysis': {
    overviewAr:
      'تحليل المسار ونمذجة المعادلات الهيكلية باستخدام AMOS',
    whatIsServiceAr:
      'خدمة متخصصة في تحليل المسار ونمذجة المعادلات الهيكلية (SEM) باستخدام برنامج AMOS، تشمل بناء النموذج، تقدير المعاملات، وتقييم جودة النموذج.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr:
      'نمذجة المعادلات الهيكلية، تحليل المسار، تقييم النموذج',
    requestTypes: [
      { type: 'online', label: 'تحليل AMOS', labelAr: 'تحليل AMOS', isActive: true },
      { type: 'online', label: 'SEM', labelAr: 'SEM', isActive: true },
      { type: 'online', label: 'تقييم نموذج', labelAr: 'تقييم نموذج', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مؤشرات جودة النموذج؟',
        answerAr: 'CFI, RMSEA, SRMR وغيرها.',
        question: 'Fit indices?',
        answer: 'CFI, RMSEA, SRMR.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تستغرق 3-7 أيام حسب تعقيد النموذج.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'qualitative-statistical-analysis': {
    overviewAr:
      'تحليل نوعي باستخدام NVivo وأدوات متخصصة',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل النوعي للبيانات باستخدام برامج مثل NVivo، تشمل تحليل المحتوى، الترميز، وتفسير النتائج.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تحليل المحتوى، الترميز، تفسير النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل نوعي', labelAr: 'تحليل نوعي', isActive: true },
      { type: 'online', label: 'ترميز', labelAr: 'ترميز', isActive: true },
      { type: 'online', label: 'تقرير تحليل', labelAr: 'تقرير تحليل', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي برامج التحليل النوعي؟',
        answerAr: 'NVivo, Atlas.ti, MAXQDA وغيرها.',
        question: 'Software?',
        answer: 'NVivo, Atlas.ti, MAXQDA.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تستغرق 3-10 أيام حسب حجم البيانات.',
        question: 'How long?',
        answer: '3-10 days.',
        order: 1,
      },
    ],
  },

  'eviews-statistical-analysis': {
    overviewAr: 'تحليل اقتصادي قياسي باستخدام E-Views',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل الاقتصادي القياسي باستخدام برنامج E-Views، تشمل تحليل السلاسل الزمنية، نماذج الانحدار، والتنبؤ.',
    whoBenefitsAr:
      'الباحثون الاقتصاديون، طلاب الاقتصاد، والكتاب الأكاديميون',
    methodologiesAr:
      'تحليل السلاسل الزمنية، نماذج الانحدار، التنبؤ',
    requestTypes: [
      { type: 'online', label: 'تحليل E-Views', labelAr: 'تحليل E-Views', isActive: true },
      { type: 'online', label: 'تنبؤ', labelAr: 'تنبؤ', isActive: true },
      { type: 'online', label: 'تقرير اقتصادي', labelAr: 'تقرير اقتصادي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي نماذج E-Views المتاحة؟',
        answerAr: 'VAR, VECM, ARIMA وغيرها.',
        question: 'Models?',
        answer: 'VAR, VECM, ARIMA.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية التحليل؟',
        answerAr: 'تستغرق 3-7 أيام حسب تعقيد النموذج.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'sas-statistical-analysis': {
    overviewAr: 'تحليل إحصائي متقدم باستخدام SAS',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل الإحصائي المتقدم باستخدام برنامج SAS، تشمل تحليل البيانات الضخمة، النمذجة الإحصائية، وتفسير النتائج.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr:
      'تحليل البيانات الضخمة، النمذجة الإحصائية، تفسير النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل SAS', labelAr: 'تحليل SAS', isActive: true },
      { type: 'online', label: 'نموذج إحصائي', labelAr: 'نموذج إحصائي', isActive: true },
      { type: 'online', label: 'تقرير متقدم', labelAr: 'تقرير متقدم', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي قدرات SAS؟',
        answerAr: 'تحليل البيانات الضخمة، النمذجة، والتنبؤ.',
        question: 'SAS capabilities?',
        answer: 'Big data analysis, modeling, forecasting.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '3-7 أيام حسب حجم البيانات.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'smart-pls-statistical-analysis': {
    overviewAr: 'تحليل PLS-SEM باستخدام Smart PLS',
    whatIsServiceAr:
      'خدمة متخصصة في تحليل نمذجة المعادلات الهيكلية بطريقة المربعات الصغرى الجزئية (PLS-SEM) باستخدام برنامج Smart PLS.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'PLS-SEM، تحليل المسار، تقييم النموذج',
    requestTypes: [
      { type: 'online', label: 'تحليل PLS', labelAr: 'تحليل PLS', isActive: true },
      { type: 'online', label: 'SEM', labelAr: 'SEM', isActive: true },
      { type: 'online', label: 'تقييم نموذج', labelAr: 'تقييم نموذج', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مؤشرات جودة النموذج في PLS؟',
        answerAr: 'R², Q², SRMR وغيرها.',
        question: 'Fit indices?',
        answer: 'R², Q², SRMR.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '3-7 أيام حسب تعقيد النموذج.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  'stata-statistical-analysis': {
    overviewAr: 'تحليل إحصائي متقدم باستخدام STATA',
    whatIsServiceAr:
      'خدمة متخصصة في التحليل الإحصائي المتقدم باستخدام برنامج STATA، تشمل تحليل البيانات، النمذجة الإحصائية، وتفسير النتائج.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تحليل البيانات، النمذجة الإحصائية، تفسير النتائج',
    requestTypes: [
      { type: 'online', label: 'تحليل STATA', labelAr: 'تحليل STATA', isActive: true },
      { type: 'online', label: 'نموذج إحصائي', labelAr: 'نموذج إحصائي', isActive: true },
      { type: 'online', label: 'تقرير متقدم', labelAr: 'تقرير متقدم', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي قدرات STATA؟',
        answerAr: 'تحليل البيانات، النمذجة، والتنبؤ.',
        question: 'STATA capabilities?',
        answer: 'Data analysis, modeling, forecasting.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '3-7 أيام حسب حجم البيانات.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 🌐 القسم 3: الترجمة (خدمتان)
  // ============================================================
  'academic-translation': {
    overviewAr: 'ترجمة دقيقة واحترافية بين العربية والإنجليزية',
    whatIsServiceAr:
      'خدمة متخصصة في الترجمة الأكاديمية بين العربية والإنجليزية، تشمل ترجمة الأبحاث، الرسائل، والمقالات العلمية بدقة واحترافية.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'الترجمة الدقيقة، المراجعة اللغوية، التدقيق',
    requestTypes: [
      { type: 'online', label: 'ترجمة أكاديمية', labelAr: 'ترجمة أكاديمية', isActive: true },
      { type: 'online', label: 'مراجعة ترجمة', labelAr: 'مراجعة ترجمة', isActive: true },
      { type: 'online', label: 'تدقيق لغوي', labelAr: 'تدقيق لغوي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي اللغات المتاحة؟',
        answerAr: 'العربية والإنجليزية بشكل أساسي.',
        question: 'Available languages?',
        answer: 'Arabic and English.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق عملية الترجمة؟',
        answerAr: 'تستغرق 2-5 أيام حسب حجم النص.',
        question: 'How long?',
        answer: '2-5 days.',
        order: 1,
      },
    ],
  },

  'statement-of-purpose': {
    overviewAr:
      'كتابة وترجمة خطاب الغرض من الدراسة (SOP) احترافي',
    whatIsServiceAr:
      'خدمة متخصصة في كتابة وترجمة خطابات الغرض من الدراسة (Statement of Purpose) للقبول في الجامعات والبرامج الأكاديمية.',
    whoBenefitsAr:
      'الطلاب المتقدمون للدراسات العليا، الباحثون، والراغبون في الالتحاق ببرامج أكاديمية',
    methodologiesAr: 'كتابة SOP، ترجمة SOP، مراجعة SOP',
    requestTypes: [
      { type: 'online', label: 'كتابة SOP', labelAr: 'كتابة SOP', isActive: true },
      { type: 'online', label: 'ترجمة SOP', labelAr: 'ترجمة SOP', isActive: true },
      { type: 'online', label: 'مراجعة SOP', labelAr: 'مراجعة SOP', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات SOP الناجحة؟',
        answerAr: 'الأهداف الأكاديمية، الخبرات، والأسباب.',
        question: 'Components?',
        answer: 'Academic goals, experiences, reasons.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق كتابة SOP؟',
        answerAr: 'تستغرق 3-7 أيام حسب المتطلبات.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // ✍️ القسم 4: التحرير (3 خدمات)
  // ============================================================
  'proofreading': {
    overviewAr:
      'تدقيق لغوي وإملائي احترافي للنصوص الأكاديمية',
    whatIsServiceAr:
      'خدمة متخصصة في التدقيق اللغوي والإملائي للنصوص الأكاديمية، تشمل تصحيح الأخطاء اللغوية، الإملائية، والنحوية.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'التدقيق اللغوي، التصحيح الإملائي، المراجعة النحوية',
    requestTypes: [
      { type: 'online', label: 'تدقيق لغوي', labelAr: 'تدقيق لغوي', isActive: true },
      { type: 'online', label: 'تصحيح إملائي', labelAr: 'تصحيح إملائي', isActive: true },
      { type: 'online', label: 'مراجعة نحوية', labelAr: 'مراجعة نحوية', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي جوانب التدقيق؟',
        answerAr: 'الإملاء، النحو، الصرف، والأسلوب.',
        question: 'Aspects?',
        answer: 'Spelling, grammar, morphology, style.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: 'تستغرق 2-4 أيام حسب حجم النص.',
        question: 'How long?',
        answer: '2-4 days.',
        order: 1,
      },
    ],
  },

  'academic-style-enhancement': {
    overviewAr:
      'تحسين الأسلوب العلمي مع الحفاظ على المحتوى الأصلي',
    whatIsServiceAr:
      'خدمة تحسّن الأسلوب العلمي للنصوص مع الحفاظ على المحتوى الأصلي. ملاحظة: لا تُستخدم لتفادي كشف التشابه، بل لتحسين الجودة اللغوية.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تحسين الأسلوب، ضبط اللغة، تنظيم الأفكار',
    requestTypes: [
      { type: 'online', label: 'تحسين أسلوب', labelAr: 'تحسين أسلوب', isActive: true },
      { type: 'online', label: 'ضبط لغوي', labelAr: 'ضبط لغوي', isActive: true },
      { type: 'online', label: 'تنظيم أفكار', labelAr: 'تنظيم أفكار', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'هل يبقى المحتوى كما هو؟',
        answerAr: 'نعم، تحسين لغوي فقط.',
        question: 'Content preserved?',
        answer: 'Yes, linguistic improvement only.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-5 أيام.',
        question: 'How long?',
        answer: '2-5 days.',
        order: 1,
      },
    ],
  },

  'comprehensive-academic-review': {
    overviewAr:
      'مراجعة شاملة للأبحاث قبل التقييم النهائي',
    whatIsServiceAr:
      'خدمة تراجع الأبحاث بشكل شامل، تشمل الجوانب المنهجية، اللغوية، والتنسيقية، مع تقديم تقرير بالتحسينات.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'مراجعة شاملة، تقييم الجوانب، تقديم توصيات',
    requestTypes: [
      { type: 'online', label: 'مراجعة شاملة', labelAr: 'مراجعة شاملة', isActive: true },
      { type: 'online', label: 'تقييم أكاديمي', labelAr: 'تقييم أكاديمي', isActive: true },
      { type: 'online', label: 'توصيات تحسين', labelAr: 'توصيات تحسين', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما جوانب المراجعة؟',
        answerAr: 'المنهجية، اللغة، والتنسيق.',
        question: 'Aspects?',
        answer: 'Methodology, language, formatting.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '3-7 أيام.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 🎨 القسم 5: التصميم (4 خدمات)
  // ============================================================
  'academic-cv-design': {
    overviewAr:
      'تصميم سيرة ذاتية احترافية للمجال الأكاديمي',
    whatIsServiceAr:
      'خدمة متخصصة في تصميم السير الذاتية الأكاديمية (Academic CV) بشكل احترافي، تشمل تنظيم المحتوى، التصميم البصري، وتنسيق المعلومات.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والراغبون في العمل الأكاديمي',
    methodologiesAr: 'تصميم CV، تنظيم المحتوى، تنسيق بصري',
    requestTypes: [
      { type: 'online', label: 'تصميم CV', labelAr: 'تصميم CV', isActive: true },
      { type: 'online', label: 'تحديث CV', labelAr: 'تحديث CV', isActive: true },
      { type: 'online', label: 'تنسيق أكاديمي', labelAr: 'تنسيق أكاديمي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات السيرة الذاتية الأكاديمية؟',
        answerAr: 'المؤهلات، الخبرات، الأبحاث، والمهارات.',
        question: 'Components?',
        answer: 'Qualifications, experience, research, skills.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-4 أيام.',
        question: 'How long?',
        answer: '2-4 days.',
        order: 1,
      },
    ],
  },

  'training-packages-preparation': {
    overviewAr:
      'إعداد حقائب تدريبية متكاملة وفق المعايير العالمية',
    whatIsServiceAr:
      'خدمة متخصصة في إعداد الحقائب التدريبية المتكاملة، تشمل تصميم المحتوى، الأنشطة، ووسائل التقييم.',
    whoBenefitsAr: 'المدربون، المؤسسات التعليمية، والخبراء',
    methodologiesAr: 'تصميم الحقيبة، إعداد المحتوى، تطوير الأنشطة',
    requestTypes: [
      { type: 'online', label: 'إعداد حقيبة', labelAr: 'إعداد حقيبة', isActive: true },
      { type: 'online', label: 'تطوير محتوى', labelAr: 'تطوير محتوى', isActive: true },
      { type: 'online', label: 'تصميم تدريبي', labelAr: 'تصميم تدريبي', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات الحقيبة التدريبية؟',
        answerAr: 'المادة العلمية، الأنشطة، ووسائل التقييم.',
        question: 'Components?',
        answer: 'Content, activities, evaluation.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '5-10 أيام حسب حجم الحقيبة.',
        question: 'How long?',
        answer: '5-10 days.',
        order: 1,
      },
    ],
  },

  'academic-presentation-design': {
    overviewAr: 'تصميم عروض تقديمية أكاديمية احترافية',
    whatIsServiceAr:
      'خدمة متخصصة في تصميم العروض التقديمية الأكاديمية (PowerPoint/Google Slides) بشكل احترافي، تشمل التصميم البصري وتنظيم المحتوى.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والمحاضرون',
    methodologiesAr: 'تصميم العروض، تنظيم المحتوى، التصميم البصري',
    requestTypes: [
      { type: 'online', label: 'تصميم عرض', labelAr: 'تصميم عرض', isActive: true },
      { type: 'online', label: 'تطوير عرض', labelAr: 'تطوير عرض', isActive: true },
      { type: 'online', label: 'تنسيق بصري', labelAr: 'تنسيق بصري', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أفضل ممارسات تصميم العروض؟',
        answerAr: 'الوضوح، التوازن، والجاذبية البصرية.',
        question: 'Best practices?',
        answer: 'Clarity, balance, visual appeal.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-5 أيام.',
        question: 'How long?',
        answer: '2-5 days.',
        order: 1,
      },
    ],
  },

  'research-poster-design': {
    overviewAr:
      'تصميم بوسترات بحثية احترافية للمؤتمرات العلمية',
    whatIsServiceAr:
      'خدمة متخصصة في تصميم البوسترات البحثية (Research Posters) للمؤتمرات العلمية، تشمل التصميم البصري وتنظيم المعلومات.',
    whoBenefitsAr:
      'الباحثون، طلاب الدراسات العليا، والمشاركون في المؤتمرات',
    methodologiesAr: 'تصميم البوسترات، تنظيم المعلومات، التصميم البصري',
    requestTypes: [
      { type: 'online', label: 'تصميم بوستر', labelAr: 'تصميم بوستر', isActive: true },
      { type: 'online', label: 'تطوير بوستر', labelAr: 'تطوير بوستر', isActive: true },
      { type: 'online', label: 'تنسيق بصري', labelAr: 'تنسيق بصري', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي مكونات البوستر البحثي؟',
        answerAr: 'العنوان، المقدمة، النتائج، والاستنتاجات.',
        question: 'Components?',
        answer: 'Title, intro, results, conclusions.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-4 أيام.',
        question: 'How long?',
        answer: '2-4 days.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 📰 القسم 6: النشر (3 خدمات)
  // ============================================================
  'academic-support-publication': {
    overviewAr:
      'دعم أكاديمي لإعداد البحث للنشر في مجلات محكمة',
    whatIsServiceAr:
      'خدمة تقدم دعماً أكاديمياً في إعداد البحث للنشر، تشمل تحسين الجودة واختيار المجلة. ملاحظة: لا تُقدَّم أي ضمانات للقبول.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'إعداد البحث، اختيار المجلة، تحسين الجودة',
    requestTypes: [
      { type: 'online', label: 'دعم نشر', labelAr: 'دعم نشر', isActive: true },
      { type: 'online', label: 'تحسين البحث', labelAr: 'تحسين البحث', isActive: true },
      { type: 'online', label: 'اختيار مجلة', labelAr: 'اختيار مجلة', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'هل يوجد ضمان القبول؟',
        answerAr: 'لا، القرار للمجلة.',
        question: 'Acceptance guarantee?',
        answer: 'No, decision is with journal.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: 'حسب المجلة.',
        question: 'How long?',
        answer: 'Depends on journal.',
        order: 1,
      },
    ],
  },

  'journal-recommendation': {
    overviewAr: 'ترشيح مجلات علمية مناسبة لنشر أبحاثك',
    whatIsServiceAr:
      'خدمة متخصصة في ترشيح المجلات العلمية المناسبة لنشر الأبحاث، بناءً على تحليل موضوع البحث ومعايير النشر.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'تحليل الموضوع، تقييم المجلات، تقديم التوصيات',
    requestTypes: [
      { type: 'online', label: 'ترشيح مجلات', labelAr: 'ترشيح مجلات', isActive: true },
      { type: 'online', label: 'تقييم مجلة', labelAr: 'تقييم مجلة', isActive: true },
      { type: 'online', label: 'توصيات نشر', labelAr: 'توصيات نشر', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي معايير الترشيح؟',
        answerAr: 'التخصص، معامل التأثير، وسرعة النشر.',
        question: 'Criteria?',
        answer: 'Specialty, impact factor, publication speed.',
        order: 0,
      },
      {
        questionAr: 'كم عدد المجلات المقترحة؟',
        answerAr: 'يتم اقتراح 5-10 مجلات مناسبة.',
        question: 'How many journals?',
        answer: '5-10 journals.',
        order: 1,
      },
    ],
  },

  'academic-ebook': {
    overviewAr:
      'تصميم ونشر كتاب إلكتروني أكاديمي احترافي',
    whatIsServiceAr:
      'خدمة متخصصة في تصميم ونشر الكتب الإلكترونية الأكاديمية، تشمل كتابة المحتوى، التصميم، والتنسيق للنشر الإلكتروني.',
    whoBenefitsAr:
      'الباحثون، الكتاب الأكاديميون، والمؤسسات التعليمية',
    methodologiesAr: 'كتابة المحتوى، التصميم، النشر الإلكتروني',
    requestTypes: [
      { type: 'online', label: 'كتابة كتاب', labelAr: 'كتابة كتاب', isActive: true },
      { type: 'online', label: 'تصميم كتاب', labelAr: 'تصميم كتاب', isActive: true },
      { type: 'online', label: 'نشر إلكتروني', labelAr: 'نشر إلكتروني', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي صيغ النشر المتاحة؟',
        answerAr: 'PDF, EPUB, MOBI وغيرها.',
        question: 'Formats?',
        answer: 'PDF, EPUB, MOBI.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-4 أسابيع حسب حجم الكتاب.',
        question: 'How long?',
        answer: '2-4 weeks.',
        order: 1,
      },
    ],
  },

  // ============================================================
  // 📚 القسم 7: المراجع (3 خدمات)
  // ============================================================
  'scientific-references-provision': {
    overviewAr:
      'توفير مراجع علمية موثقة من مصادر معتمدة',
    whatIsServiceAr:
      'خدمة متخصصة في توفير المراجع العلمية الموثقة من مصادر معتمدة، مع تلخيص شامل للدراسات السابقة في مجال البحث.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr:
      'البحث في قواعد البيانات، تحليل الدراسات السابقة، تلخيص المراجع',
    requestTypes: [
      { type: 'online', label: 'توفير مراجع', labelAr: 'توفير مراجع', isActive: true },
      { type: 'online', label: 'تلخيص دراسات', labelAr: 'تلخيص دراسات', isActive: true },
      { type: 'online', label: 'تحليل مراجع', labelAr: 'تحليل مراجع', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي المصادر المستخدمة؟',
        answerAr: 'قواعد بيانات علمية معتمدة.',
        question: 'Sources?',
        answer: 'Trusted academic databases.',
        order: 0,
      },
      {
        questionAr: 'كم عدد المراجع؟',
        answerAr: '20-50 مرجع حسب الطلب.',
        question: 'How many?',
        answer: '20-50 references.',
        order: 1,
      },
    ],
  },

  'references-romanization': {
    overviewAr:
      'تحويل المراجع العربية إلى كتابة لاتينية وفق المعايير',
    whatIsServiceAr:
      'خدمة متخصصة في رومنة (تحويل) المراجع العربية إلى الكتابة اللاتينية وفق المعايير الأكاديمية المعتمدة.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'الرومنة، التوثيق، المراجعة',
    requestTypes: [
      { type: 'online', label: 'رومنة مراجع', labelAr: 'رومنة مراجع', isActive: true },
      { type: 'online', label: 'توثيق عربي', labelAr: 'توثيق عربي', isActive: true },
      { type: 'online', label: 'تحويل لاتيني', labelAr: 'تحويل لاتيني', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما هي أنظمة الرومنة المستخدمة؟',
        answerAr: 'ALA-LC والمعايير الدولية.',
        question: 'Systems?',
        answer: 'ALA-LC and international standards.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '2-3 أيام حسب عدد المراجع.',
        question: 'How long?',
        answer: '2-3 days.',
        order: 1,
      },
    ],
  },

  'books-references-summarization': {
    overviewAr:
      'تلخيص الكتب والمراجع العلمية بالعربية والإنجليزية',
    whatIsServiceAr:
      'خدمة متخصصة في تلخيص الكتب والمراجع العلمية باللغتين العربية والإنجليزية، تشمل استخراج النقاط الرئيسية والأفكار الأساسية.',
    whoBenefitsAr: 'الباحثون، طلاب الدراسات العليا، والكتاب الأكاديميون',
    methodologiesAr: 'القراءة التحليلية، استخراج الأفكار، التلخيص',
    requestTypes: [
      { type: 'online', label: 'تلخيص كتاب', labelAr: 'تلخيص كتاب', isActive: true },
      { type: 'online', label: 'تلخيص مرجع', labelAr: 'تلخيص مرجع', isActive: true },
      { type: 'online', label: 'استخراج أفكار', labelAr: 'استخراج أفكار', isActive: true },
    ],
    faqs: [
      {
        questionAr: 'ما حجم الملخص؟',
        answerAr: '2-5 صفحات حسب حجم الكتاب.',
        question: 'Summary size?',
        answer: '2-5 pages depending on book.',
        order: 0,
      },
      {
        questionAr: 'كم تستغرق العملية؟',
        answerAr: '3-7 أيام.',
        question: 'How long?',
        answer: '3-7 days.',
        order: 1,
      },
    ],
  },
};

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const seedAcademicServiceDetails = async () => {
  try {
    console.log('🚀 Starting academic ServiceDetails seed...\n');

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;
    let notFound = 0;

    for (const [slug, detailData] of Object.entries(SERVICE_DETAILS_DATA)) {
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

      const serviceDetail = new ServiceDetail({
        portalId: PORTAL_ID,
        sectionId: service.sectionId,
        serviceId: service._id,
        overview: detailData.overview || detailData.overviewAr || '',
        overviewAr: detailData.overviewAr || '',
        whatIsService:
          detailData.whatIsService || detailData.whatIsServiceAr || '',
        whatIsServiceAr: detailData.whatIsServiceAr || '',
        whoBenefits:
          detailData.whoBenefits || detailData.whoBenefitsAr || '',
        whoBenefitsAr: detailData.whoBenefitsAr || '',
        methodologies:
          detailData.methodologies || detailData.methodologiesAr || '',
        methodologiesAr: detailData.methodologiesAr || '',
        gallery: detailData.gallery || [],
        requestTypes: detailData.requestTypes || [],
        faqs: detailData.faqs || [],
        isPublished: true,
      });

      await serviceDetail.save();
      created++;
      console.log(`  ✅ Created: ${slug}`);

      if (created % 10 === 0) {
        console.log(`  📊 Progress: ${created} created...`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Created: ${created} ServiceDetails`);
    console.log(`  ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`  ⚠️  Not found: ${notFound} services`);
    console.log(`\n🎉 Academic ServiceDetails seed completed!`);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAcademicServiceDetails();