// سكربت لتعبئة قاعدة البيانات بشجرة تصنيفات تجريبية (Cars -> Luxury Cars -> Brand Name)
// للتحقق من دعم التداخل غير المحدود (unlimited nested categories).
// تشغيل: npm run seed:categories
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.js';

dotenv.config();

// كل عقدة قد تحتوي children لأي عمق؛ لا حد أقصى للتداخل
const CATEGORY_TREE = [
  {
    name: { ar: 'عقارات', en: 'Real Estate' },
    slug: 'real-estate',
    children: [
      { name: { ar: 'شقق للإيجار', en: 'Apartments for Rent' }, slug: 'apartments-for-rent' },
      { name: { ar: 'شقق للبيع', en: 'Apartments for Sale' }, slug: 'apartments-for-sale' },
    ],
  },
  {
    name: { ar: 'سيارات', en: 'Cars' },
    slug: 'cars',
    children: [
      {
        name: { ar: 'سيارات فاخرة', en: 'Luxury Cars' },
        slug: 'luxury-cars',
        children: [
          { name: { ar: 'مرسيدس', en: 'Mercedes-Benz' }, slug: 'mercedes-benz' },
          { name: { ar: 'بي إم دبليو', en: 'BMW' }, slug: 'bmw' },
        ],
      },
      { name: { ar: 'سيارات اقتصادية', en: 'Economy Cars' }, slug: 'economy-cars' },
    ],
  },
  {
    name: { ar: 'إلكترونيات', en: 'Electronics' },
    slug: 'electronics',
    children: [
      { name: { ar: 'هواتف', en: 'Mobile Phones' }, slug: 'mobile-phones' },
    ],
  },
];

async function upsertNode(node, parentId) {
  // نستخدم find + save (بدل findOneAndUpdate) عمداً حتى يعمل الـ pre('save') hook
  // في الموديل الذي يحسب سلسلة الأجداد (ancestors) ويمنع المرجعية الدائرية
  let category = await Category.findOne({ slug: node.slug });
  if (!category) {
    category = new Category({ name: node.name, slug: node.slug });
  } else {
    category.name = node.name;
  }
  category.parentId = parentId || null;
  await category.save();

  for (const child of node.children || []) {
    await upsertNode(child, category._id);
  }

  return category;
}

async function run() {
  if (!process.env.MONGO) {
    throw new Error('MONGO env variable is not set');
  }

  await mongoose.connect(process.env.MONGO);
  console.log('Connected to MongoDB successfully! 🎉');

  for (const rootNode of CATEGORY_TREE) {
    await upsertNode(rootNode, null);
  }

  console.log('Seeded nested categories successfully ✅');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Seeding categories failed ❌:', error.message);
  process.exit(1);
});
