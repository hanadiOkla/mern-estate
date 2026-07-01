import Listing from "../models/listing.model.js";
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
 *  Helper function to safely clean and parse OpenAI response into a JSON object
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
export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
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
    if (!listing) return next(errorHandler(404, "Listing not found!"));

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

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
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  }catch (error) {
    next(error);
  }
};
export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only delete your own account!'));
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
// 1. دالة تحديث بيانات المستخدم
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// 2. دالة جلب العقارات الخاصة بالمستخدم (وهي المسببة للخطأ الحالي)
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only get your own listings!'));
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
      description: combinedDescription, // سيعود نص واحد يحتوي العربي وتحته الإنجليزي
      title: combinedTitle,            // سيعود العنوانين معاً كـ نص واحد
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
