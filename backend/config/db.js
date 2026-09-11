const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        // استخدام الصيغة العادية بدلاً من SRV
        const MONGODB_URI = process.env.MONGODB_URI;
        
        console.log('🔄 جاري الاتصال بقاعدة البيانات...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        console.log(`📊 قاعدة البيانات: ${mongoose.connection.db.databaseName}`);
        
    } catch (error) {
        console.error(`❌ فشل الاتصال بقاعدة البيانات: ${error.message}`);
        
        // محاولة استخدام localhost كبديل
        console.log('🔄 محاولة الاتصال بقاعدة بيانات محلية...');
        try {
            await mongoose.connect('mongodb://localhost:27017/irteqa_local');
            console.log('✅ تم الاتصال بقاعدة البيانات المحلية');
        } catch (localError) {
            console.error('❌ فشل الاتصال بقاعدة البيانات المحلية أيضاً');
            process.exit(1);
        }
    }
};

module.exports = connectDB;