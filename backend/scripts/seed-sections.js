// backend/scripts/seed-sections.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Portal } from '../src/models/Portal.model.js'
import { Section } from '../src/models/Section.model.js'

dotenv.config()

const seedSections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const portal = await Portal.findOne({ slug: 'academic' })
    if (!portal) {
      console.log('❌ Portal not found')
      process.exit(1)
    }

    const sections = [
      { name: 'الخدمات الأكاديمية', slug: 'academic-services', icon: 'fa-graduation-cap', order: 1 },
      { name: 'خدمات البحث العلمي', slug: 'research-services', icon: 'fa-flask', order: 2 },
      { name: 'الخدمات المهنية', slug: 'professional-services', icon: 'fa-briefcase', order: 3 },
    ]

    for (const section of sections) {
      const existing = await Section.findOne({ portalId: portal._id, slug: section.slug })
      if (!existing) {
        await Section.create({ ...section, portalId: portal._id })
        console.log(`✅ Section created: ${section.name}`)
      }
    }

    console.log('🎉 Sections seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedSections()