import Listing from "../models/listing.model.js";
import User from '../models/user.model.js';
import { errorHandler } from "../utils/error.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Helper Functions --- 

/**
 * Helper function to safely clean and parse OpenAI response into a JSON object
 */
const parseAIJsonResponse = (rawContent) => {
  const cleaned = rawContent.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
};


/**
 * Helper function to call GPT model and reduce code repetition
 */
const requestAIChatCompletion = async (prompt, temperature = 0.5) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature,
    response_format: { type: "json_object" },
  });
  return parseAIJsonResponse(response.choices[0].message.content);
};


// --- Core Listing Controllers ---

// 1. إنشاء عقار جديد (يدخل تلقائياً بحالة pending_approval)
export const createListing = async (req, res, next) => {
  try {
    const listingData = {
      ...req.body,
      // حماية: فرس الحقول الأمنية لمنع التلاعب وتحديد حالة الانتظار
      status: 'pending_approval',
      isApproved: false,
    };

    const listing = await Listing.create(listingData);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return next(errorHandler(404, "Listing not found!"));
    if (req.user.id !== listing.userRef) {
      return next(errorHandler(401, "You can only delete your own listings!"));
    }

    await listing.deleteOne(); 
    res.status(200).json("Listing has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return next(errorHandler(404, "Listing not found!"));
    if (req.user.id !== listing.userRef) {
      return next(errorHandler(401, "You can only update your own listings!"));
    }
    
    // عند تحديث العقار، يفضل إعادته لحالة المراجعة لضمان عدم قيام المستخدم بتعديل المحتوى لشيء مخالف بعد الموافقة
    const updateData = {
      ...req.body,
      status: req.user.role === 'admin' ? (req.body.status || 'active') : 'pending_approval',
      approvedBy: req.user.role === 'admin' ? req.body.approvedBy : null,
      approvedAt: req.user.role === 'admin' ? req.body.approvedAt : null,
    };

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('approvedBy', 'username email avatar'); // جلب بيانات المشرف الذي وافق على العقار
    
    if (!listing) return next(errorHandler(404, "Listing not found!"));

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// جلب العقارات العامة (تعديل: الفلترة التلقائية لعرض العقارات النشطة فقط)
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    const offer = req.query.offer === undefined || req.query.offer === "false" ? { $in: [false, true] } : req.query.offer;
    const furnished = req.query.furnished === undefined || req.query.furnished === "false" ? { $in: [false, true] } : req.query.furnished;
    const parking = req.query.parking === undefined || req.query.parking === "false" ? { $in: [false, true] } : req.query.parking;
    const type = req.query.type === undefined || req.query.type === "all" ? { $in: ["sale", "rent"] } : req.query.type;

    const searchTerm = req.query.searchTerm || "";
    const sort = req.query.sort || "createdAt";
    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
      status: "active" // 🛡️ حماية: الزوار والبحث العام يعرض فقط العقارات المقبولة والمعتمدة
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};


// --- Admin-Only Controllers (لوحة تحكم المشرفين) ---

// 1. جلب كافة العقارات المعلقة بانتظار المراجعة
export const getPendingListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = parseInt(req.query.startIndex) || 0;

    const pendingListings = await Listing.find({ status: "pending_approval" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    res.status(200).json(pendingListings);
  } catch (error) {
    next(error);
  }
};

// 2. الموافقة على العقار أو رفضه وتوثيق المشرف المسؤول
export const approveListing = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
// 💡 التحقق إما عن طريق role === 'admin' أو isAdmin === true حسب الموديل لديكِ
    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.isAdmin)) {
      return next(errorHandler(403, "غير مصرح لك ببدء هذه العملية!"));
    }
    
    const { id } = req.params;
    const { action } = req.body; // نمرر 'approve' للموافقة أو 'reject' للرفض

    let updateFields = {};

    if (action === 'approve') {
      updateFields = {
        status: 'active',
        isApproved: true, // 👈 إضافة الحقل لتسهيل الفلترة مستقبلاً
        approvedBy: req.user.id,
        approvedAt: new Date()
      };
    } else if (action === 'reject') {
      updateFields = {
        status: 'rejected',
        isApproved: false, // 👈 جعلها false عند الرفض
        approvedBy: req.user.id,
        approvedAt: new Date()
      };
    } else {
      return next(errorHandler(400, "Invalid action! Use 'approve' or 'reject'."));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('approvedBy', 'username email avatar');

    if (!updatedListing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    res.status(200).json({
      success: true,
      message: action === 'approve' ? "تمت الموافقة على الإعلان بنجاح" : "تم رفض الإعلان بنجاح",
      listing: updatedListing
    });
  } catch (error) {
    next(error);
  }
};


// --- AI Features Controllers ---

export const generateAIDescription = async (req, res, next) => {
  const {
    name,
    type,
    address,
    bedrooms,
    bathrooms,
    furnished,
    parking,
    offer,
  } = req.body;

  if (!name || !type || !address) {
    return res.status(400).json({
      success: false,
      message: "الرجاء إدخال اسم العقار، النوع، والعنوان أولاً لتوليد الوصف.",
    });
  }

  try {
    const prompt = `
      You are an expert real estate marketer. Based on the following property details, 
      generate a professional, highly engaging, and SEO‑optimized description object in RAW JSON format.

      Property Details:
      - Property Name: ${name}
      - Deal Type: ${type} (e.g., rent, sale)
      - Location: ${address}
      - Specifications: ${bedrooms} bedrooms, ${bathrooms} bathrooms
      - Features: ${furnished ? "Fully Furnished" : "Unfurnished"}, ${parking ? "Private Parking Available" : "No Private Parking"}
      - Special Offer: ${offer ? "Includes a special discount or promotional offer" : "Standard pricing"}

      STRICT OUTPUT RULES:
      1. Respond ONLY with a raw JSON object matching the schema below.
      2. Do NOT include markdown code blocks (like \`\`\`json) or conversational text.
      3. Provide a premium marketing description tailored to each language.

      JSON Schema Specification:
      {
        "title": {
          "en": "Catchy architectural-style title in English",
          "ar": "عنوان جذاب بأسلوب معماري راقي باللغة العربية"
        }
      ,
        "description": {
          "en": "Emotional and professional marketing text in English with bullet points for key features and relevant hashtags.",
          "ar": "نص تسويقي احترافي ومؤثر باللغة العربية الفصحى يتضمن نقاطاً بارزة لأهم الميزات والهاشتاقات العقارية المناسبة."
        }
      }
    `;

    const parsedDescription = await requestAIChatCompletion(prompt, 0.7);

    const arabicText = parsedDescription.description?.ar || "";
    const englishText = parsedDescription.description?.en || "";
    const combinedDescription = `${arabicText}\n\n---\n\n${englishText}`;

    const arabicTitle = parsedDescription.title?.ar || "";
    const englishTitle = parsedDescription.title?.en || "";
    const combinedTitle = `${arabicTitle} | ${englishTitle}`;

    res.status(200).json({
      success: true,
      description: combinedDescription, 
      title: combinedTitle,            
    });

  } catch (error) {
    next(error);
  }
};


export const getAIValuation = async (req, res, next) => {
  const { name, type, address, bedrooms, bathrooms, furnished, parking, regularPrice } = req.body;

  if (!address || !type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please select the address and property type first to get your smart valuation.' 
    });
  }

  try {
    const prompt = `
      You are an expert real estate financial analyst. Analyze the following property details and generate a precise valuation in RAW JSON format only.

      Property Context:
      - Name/Title: ${name || "N/A"}
      - Property Type: ${type}
      - Location/Address: ${address}
      - Specs: ${bedrooms} Bedrooms, ${bathrooms} Bathrooms
      - Amenities: ${furnished ? "Furnished" : "Unfurnished"}, ${parking ? "Has Parking" : "No Private Parking"}
      - Listed Price by Owner: ${regularPrice ? regularPrice : "Not provided"}

      STRICT OUTPUT RULES:
      1. Respond ONLY with a raw JSON object. No markdown block tags.
      2. All price values MUST be numbers only.
      3. PRICE COMPARISON LOGIC: Compare Listed price vs Estimated range to determine priceStatus.

      The JSON object MUST strictly follow this bilingual schema:
      {
        "estimatedMinPrice": Number,
        "estimatedMaxPrice": Number,
        "priceStatus": "Good Deal" | "Fair Price" | "Overpriced" | "Unknown",
        "marketTrend": {
          "en": "String in English",
          "ar": "String in professional Arabic (العربية الفصحى)"
        },
        "investmentAdvice": {
          "en": "String in English",
          "ar": "String in professional Arabic (العربية الفصحى)"
        }
      }
    `;

    const valuationData = await requestAIChatCompletion(prompt, 0.3);

    res.status(200).json({
      success: true,
      valuation: valuationData,
    });
  } catch (error) {
    console.error("AI Valuation Error:", error);
    next(error);
  }
};