import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portal } from '../src/models/Portal.model.js';
import { Account } from '../src/models/Account.model.js';
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js';
import { Section } from '../src/models/Section.model.js';
import { Service } from '../src/models/Service.model.js';
import { config } from '../src/config/env.js';
import bcrypt from 'bcrypt';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional)
    // await Promise.all([
    //   Portal.deleteMany({}),
    //   Account.deleteMany({}),
    //   CustomerIdentity.deleteMany({}),
    //   Section.deleteMany({}),
    //   Service.deleteMany({}),
    // ]);

    // Create Portals
    const portalA = new Portal({
      name: 'البوابة الأكاديمية',
      slug: 'academic',
      url: 'http://localhost:5173',
      description: 'بوابة الخدمات الأكاديمية',
      isActive: true,
      settings: {
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultRole: 'customer',
      },
      theme: {
        primaryColor: '#2563eb',
        secondaryColor: '#7c3aed',
        accentColor: '#f59e0b',
      },
    });

    const portalB = new Portal({
      name: 'البوابة المهنية',
      slug: 'professional',
      url: 'http://localhost:5174',
      description: 'بوابة الخدمات المهنية',
      isActive: true,
      settings: {
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultRole: 'customer',
      },
      theme: {
        primaryColor: '#059669',
        secondaryColor: '#0d9488',
        accentColor: '#f97316',
      },
    });

    await portalA.save();
    await portalB.save();
    console.log('✅ Portals created');

    // Create Super Admin Identity
    const adminIdentity = new CustomerIdentity({
      email: 'admin@irteqa.com',
      fullName: 'Super Admin',
      isActive: true,
    });
    await adminIdentity.save();
    console.log('✅ Admin identity created');

    // Create Super Admin Account for both portals
    const adminPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    for (const portal of [portalA, portalB]) {
      const adminAccount = new Account({
        portalId: portal._id,
        identityId: adminIdentity._id,
        username: `admin_${portal.slug}`,
        email: `admin@${portal.slug}.com`,
        passwordHash: hashedPassword,
        role: 'super_admin',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        profile: {
          fullName: `Super Admin - ${portal.name}`,
        },
      });
      await adminAccount.save();

      adminIdentity.linkedAccounts.push({
        portalId: portal._id,
        accountId: adminAccount._id,
      });
    }
    await adminIdentity.save();
    console.log('✅ Super Admin accounts created');

    // Create Sample Sections
    const sections = [];
    for (const portal of [portalA, portalB]) {
      const academicSection = new Section({
        portalId: portal._id,
        name: portal.slug === 'academic' ? 'الخدمات الأكاديمية' : 'الخدمات المهنية',
        slug: portal.slug === 'academic' ? 'academic-services' : 'professional-services',
        description: `خدمات ${portal.name}`,
        isPublished: true,
        order: 1,
      });
      await academicSection.save();
      sections.push(academicSection);

      const consultingSection = new Section({
        portalId: portal._id,
        name: 'الاستشارات',
        slug: 'consulting',
        description: 'خدمات الاستشارات المتخصصة',
        isPublished: true,
        order: 2,
      });
      await consultingSection.save();
      sections.push(consultingSection);
    }
    console.log('✅ Sections created');

    // Create Sample Services
    const services = [];
    for (const section of sections) {
      const service = new Service({
        portalId: section.portalId,
        sectionId: section._id,
        name: `${section.name} - خدمة نموذجية`,
        slug: `${section.slug}-sample`,
        description: 'خدمة نموذجية للاختبار',
        details: 'تفاصيل الخدمة النموذجية',
        whatItIncludes: ['تقديم استشارة', 'تقرير مفصل', 'متابعة'],
        isPublished: true,
        order: 1,
        pricing: {
          type: 'fixed',
          amount: 500,
          currency: 'SAR',
        },
        estimatedDuration: '3-5 أيام',
        requirements: ['معلومات أساسية', 'وثائق مطلوبة'],
      });
      await service.save();
      services.push(service);
    }
    console.log('✅ Services created');

    console.log('🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${await Portal.countDocuments()} portals`);
    console.log(`   - ${await Account.countDocuments()} accounts`);
    console.log(`   - ${await Section.countDocuments()} sections`);
    console.log(`   - ${await Service.countDocuments()} services`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();