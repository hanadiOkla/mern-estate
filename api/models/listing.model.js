import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    attributesMap: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
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
      default: 0, // 👈 جعلناه اختياري بقيمة افتراضية 0
    },

    // 🟢 تم إزالة required: true عن حقول العقار حتى لا تعطل السيارات والأجهزة
    bathrooms: {
      type: Number,
      default: 0,
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    furnished: {
      type: Boolean,
      default: false,
    },
    parking: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      required: true, // rent / sale
    },
    offer: {
      type: Boolean,
      default: false,
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
      default: "pending_approval",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;