import express from "express"; // Fixed typo from exporess to express
import { 
  createListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  generateAIDescription,
  getAIValuation 
} from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";
import { aiLimiter } from "../utils/rateLimiter.js"; // ✨ استيراد محدد الاستهلاك الذكي

const router = express.Router();

// Core CRUD Operations
router.post('/create', verifyToken, createListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing);
router.get('/get', getListings);

// AI Features (✨ محمية بالـ Token والـ Rate Limiter معاً لضمان أمان مالي وهندسي)
router.post('/generate-ai', verifyToken, aiLimiter, generateAIDescription);
router.post('/evaluate-ai', verifyToken, aiLimiter, getAIValuation);


export default router;