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
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Category', CategorySchema);