import mongoose from 'mongoose';

const AttributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'rooms', 'mileage', 'brand'
  label: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['number', 'text', 'select', 'boolean'],
    required: true
  },
  options: [{ type: String }], // يُستخدم في حال كان النوع 'select'
  required: { type: Boolean, default: false }
});

const CategorySchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true }
    },
    slug: { type: String, required: true, unique: true }, // e.g., 'real-estate', 'vehicles', 'electronics'
    icon: { type: String }, // اسم الأيقونة لاستخدامها بالـ Frontend
    attributes: [AttributeSchema],
    isActive: { type: Boolean, default: true },
    // الفئة الأب (null = فئة رئيسية). يسمح بتداخل غير محدود (Cars -> Luxury Cars -> Brand Name)
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    // سلسلة كل الأجداد من الجذر إلى الأب المباشر، تُحسب تلقائياً وتُستخدم لفحص الحلقات
    // (circular references) وحذف الفروع الفرعية بكفاءة دون الحاجة لاستعلامات متكررة
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
  },
  { timestamps: true }
);

CategorySchema.index({ parentId: 1 });

// إعادة حساب سلسلة الأجداد كلما تغيّر الأب، ومنع اختيار الفئة نفسها
// أو أحد فروعها كأب لها (circular reference)
// ملاحظة: Mongoose 9 لم يعد يدعم نمط الـ callback (next) في hooks، لذا يُستخدم
// async/await فقط - إرجاع الدالة أو رمي استثناء بدلاً من استدعاء next()
CategorySchema.pre('save', async function () {
  if (!this.isModified('parentId')) return;

  if (!this.parentId) {
    this.ancestors = [];
    return;
  }

  if (this.parentId.equals(this._id)) {
    throw new Error('لا يمكن أن تكون الفئة أباً لنفسها');
  }

  const parent = await this.constructor.findById(this.parentId);
  if (!parent) {
    throw new Error('الفئة الأب غير موجودة');
  }

  if (parent.ancestors.some((ancestorId) => ancestorId.equals(this._id))) {
    throw new Error('لا يمكن اختيار فئة فرعية كأب (مرجعية دائرية)');
  }

  this.ancestors = [...parent.ancestors, parent._id];
});

export default mongoose.model('Category', CategorySchema);