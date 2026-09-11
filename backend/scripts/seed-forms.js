// backend/scripts/seed-forms.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Portal } from '../src/models/Portal.model.js'
import { Form } from '../src/models/Form.model.js'

dotenv.config()

const seedForms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const portal = await Portal.findOne({ slug: 'academic' })
    if (!portal) {
      console.log('❌ Portal not found')
      process.exit(1)
    }

    const forms = [
      {
        name: 'نموذج الاستشارة الأكاديمية',
        slug: 'academic-consulting-form',
        description: 'نموذج طلب استشارة أكاديمية',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'الاسم الكامل',
            required: true,
            order: 1,
          },
          {
            id: 'email',
            type: 'email',
            label: 'البريد الإلكتروني',
            required: true,
            order: 2,
          },
          {
            id: 'topic',
            type: 'select',
            label: 'موضوع الاستشارة',
            required: true,
            options: [
              { value: 'research', label: 'بحث علمي' },
              { value: 'statistics', label: 'تحليل إحصائي' },
              { value: 'translation', label: 'ترجمة' },
            ],
            order: 3,
          },
          {
            id: 'description',
            type: 'textarea',
            label: 'وصف الطلب',
            required: true,
            order: 4,
          },
        ],
      },
      {
        name: 'نموذج طلب التحليل الإحصائي',
        slug: 'statistics-request-form',
        description: 'نموذج طلب تحليل إحصائي',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'الاسم الكامل',
            required: true,
            order: 1,
          },
          {
            id: 'email',
            type: 'email',
            label: 'البريد الإلكتروني',
            required: true,
            order: 2,
          },
          {
            id: 'dataType',
            type: 'select',
            label: 'نوع البيانات',
            required: true,
            options: [
              { value: 'quantitative', label: 'كمية' },
              { value: 'qualitative', label: 'نوعية' },
              { value: 'mixed', label: 'مختلطة' },
            ],
            order: 3,
          },
          {
            id: 'description',
            type: 'textarea',
            label: 'وصف البيانات والتحليل المطلوب',
            required: true,
            order: 4,
          },
        ],
      },
    ]

    for (const form of forms) {
      const existing = await Form.findOne({ portalId: portal._id, slug: form.slug })
      if (!existing) {
        await Form.create({ ...form, portalId: portal._id })
        console.log(`✅ Form created: ${form.name}`)
      }
    }

    console.log('🎉 Forms seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedForms()