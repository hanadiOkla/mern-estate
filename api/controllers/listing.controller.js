import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export const creatListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only delete your own listings!"));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json("Listing has been Delete!");
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only update your own listings!"));
  }

  try {
    const updateListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json(updateListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    let offer = req.query.offer;
    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;
    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;
    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({
        [sort]: order,
      })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};



// تهيئة مكتبة OpenAI (ستقرأ المفتاح تلقائياً من ملف .env الموجود في الجذر)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 1. توليد وصف ذكي للعقار (AI Description)
 * تم تحديثها لتعيد JSON مهيكل ومنظم باللغتين لمنع تشوه واجهات المستخدم
 */
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

  // التحقق من وجود البيانات الأساسية اللازمة
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
        },
        "description": {
          "en": "Emotional and professional marketing text in English with bullet points for key features and relevant hashtags.",
          "ar": "نص تسويقي احترافي ومؤثر باللغة العربية الفصحى يتضمن نقاطاً بارزة لأهم الميزات والهاشتاقات العقارية المناسبة."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      // ✨ إجبار الموديل على إخراج JSON نظيف لمعالجة النصوص بشكل احترافي
      response_format: { type: "json_object" }, 
    });

    let rawContent = response.choices[0].message.content.trim();
    
    // ✨ Response Parsing المعالجة والتنظيف المتقدم
    rawContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
    const parsedDescription = JSON.parse(rawContent);

    res.status(200).json({
      success: true,
      data: parsedDescription, // يعيد كائن يحتوي على title و description باللغتين
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. التقييم المالي الذكي للعقار (AI Valuation)
 * مجهزة ومنظفة بالكامل للاستخدام الآمن في الإنتاج الفعلي
 */
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    let rawContent = response.choices[0].message.content.trim();
    
    // ✨ Response Parsing التنظيف والتحقق من سلامة البيانات
    rawContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
    const valuationData = JSON.parse(rawContent);

    res.status(200).json({
      success: true,
      valuation: valuationData,
    });
  } catch (error) {
    console.error("AI Valuation Error:", error);
    next(error);
  }
};
