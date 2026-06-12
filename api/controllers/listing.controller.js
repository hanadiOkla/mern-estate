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

export const generateAIDescription = async (req, res, next) => {
  // استقبال البيانات المطابقة تماماً للـ Schema الخاصة بكِ من الـ Frontend
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

  // التحقق من وجود البيانات الأساسية اللازمة لصياغة نص تسويقي ذكي
  if (!name || !type || !address) {
    return res.status(400).json({
      success: false,
      message: "الرجاء إدخال اسم العقار، النوع، والعنوان أولاً لتوليد الوصف.",
    });
  }

  try {
    // صياغة الـ Prompt بناءً على حقول الـ Schema الفعلية
    const prompt = `
        You are an expert real estate marketer. Based on the following property details, 
        generate a professional, highly engaging, and SEO‑optimized description in BOTH Arabic and English.

        Property Details:
        - Property Name: ${name}
        - Deal Type: ${type} (e.g., For Rent, For Sale)
        - Location: ${address}
        - Specifications: ${bedrooms} bedrooms, ${bathrooms} bathrooms
        - Features: ${furnished ? "Fully Furnished" : "Unfurnished"}, ${parking ? "Private Parking Available" : "No Private Parking"}
        - Special Offer: ${offer ? "Includes a special discount or promotional offer" : "Standard pricing"}

        Requirements:
        1. Provide a catchy architectural-style title for the property in both Arabic and English.
        2. Write an emotional yet professional marketing description (first Arabic, then English).
        3. Add a bullet‑point list highlighting the key selling features.
        4. End with relevant real estate hashtags.
        5. Do NOT include placeholders; output clean, ready‑to‑publish text only.
        6. Keep the tone premium, clear, and appealing for buyers and renters.
        `;

    // الاتصال بالـ API باستخدام النموذج الموفر والسريع gpt-4o-mini
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiGeneratedText = response.choices[0].message.content;

    // إرجاع النص الجاهز للـ Frontend ليوضع مباشرة في حقل description
    res.status(200).json({
      success: true,
      description: aiGeneratedText,
    });
  } catch (error) {
    // تمرير الخطأ لـ Middleware معالجة الأخطاء الخاص بمشروعك
    next(error);
  }
};

export const getAIValuation = async (req, res, next) => {
  // استقبال البيانات المتاحة للعقار من الـ Frontend
  const { name, type, address, bedrooms, bathrooms, furnished, parking, regularPrice } = req.body;

  if (!address || !type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please select the address and property type first to get your smart valuation.' 
    });
  }

  try {

   /*  // 💡 كود تجريبي مؤقت لتفادي مشكلة الرصيد واختبار الواجهة
    const mockValuation = {
      estimatedMinPrice: 850000,
      estimatedMaxPrice: 950000,
      priceStatus: "Good Deal",
      marketTrend: "تشهد المنطقة نمواً مستمراً بنسبة 8% سنوياً بسبب المشاريع البنيوية الجديدة المقامة بالقرب من الموقع.",
      investmentAdvice: "السعر الحالي يعتبر لُقطة ومناسب جداً للشراء كفرصة استثمارية طويلة الأجل."
    };

    return res.status(200).json({
      success: true,
      valuation: mockValuation
    }); */
    // صياغة الـ Prompt وهندسته ليُرجع النتيجة بصيغة JSON حصراً
    const prompt = `
    You are an expert real estate financial analyst and certified property appraiser.
    Analyze the following property details and generate a precise valuation in RAW JSON format only.

    Property Context:
    - Name/Title: ${name || 'N/A'}
    - Property Type: ${type}
    - Location/Address: ${address}
    - Specs: ${bedrooms} Bedrooms, ${bathrooms} Bathrooms
    - Amenities: ${furnished ? 'Furnished' : 'Unfurnished'}, ${parking ? 'Has Parking' : 'No Private Parking'}
    - Listed Price by Owner: ${regularPrice ? regularPrice : 'Not provided'}

    STRICT OUTPUT RULES:
    1. You MUST respond ONLY with a raw JSON object. Do not wrap it in markdown block tags like \`\`\`json or \`\`\`. No text before or after. The entire output must be valid for JSON.parse().
    2. All price values MUST be numbers only (no commas, no currency symbols).
    3. "estimatedMinPrice" MUST be lower than "estimatedMaxPrice".
    4. If no listed price is provided, set "priceStatus" to "Unknown".
    5. IMPORTANT FOR ARABIC TEXT: "marketTrend" and "investmentAdvice" MUST be single-line strings. Never use unescaped double quotes (") inside the text.
    6. PRICE COMPARISON LOGIC (MANDATORY):
    - If listed price < estimatedMinPrice → "Good Deal"
    - If listed price is between min and max → "Fair Price"
    - If listed price > estimatedMaxPrice → "Overpriced"
    - If no listed price → "Unknown"

    The JSON object MUST strictly follow this schema:
    {
    "estimatedMinPrice": Number,
    "estimatedMaxPrice": Number,
    "priceStatus": "Good Deal" | "Fair Price" | "Overpriced" | "Unknown",
    "marketTrend": "String (Write in Arabic)",
    "investmentAdvice": "String (Write in Arabic)"
    }
    `;

    // الاتصال بـ OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // حرارة منخفضة لضمان دقة التحليل المالي والالتزام بـ JSON
    });

    // استخراج النص وتحويله مباشرة لكائن JavaScript (JSON)
    let rawContent = response.choices[0].message.content.trim();
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```json|```$/g, "").trim();
    }
    
    const valuationData = JSON.parse(rawContent);

    // إرسال البيانات المنظمة والتحليلات للـ Frontend
    res.status(200).json({
      success: true,
      valuation: valuationData
    });

  } catch (error) {
    console.error("AI Valuation Error:", error);
    // إذا فشل الـ Parsing أو الـ API، نمرر الخطأ للميدل وير
    next(error);
  }
};

