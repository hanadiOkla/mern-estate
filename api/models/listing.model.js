import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    furnished: {
      type: Boolean,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      required: true,
    },
    imageUrls: {
      type: Array,
      required: true,
    },
    userRef: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_approval", "active", "rejected"],
      default: "pending_approval", // الحالة الافتراضية لأي عقار جديد
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ربط مباشر مع موديل المستخدم لجلب اسمه وصورته لاحقاً
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
