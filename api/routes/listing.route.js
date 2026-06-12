import express from "express"; // Fixed typo from exporess to express
import { 
  creatListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  generateAIDescription,
  getAIValuation 
} from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// Core CRUD Operations
router.post('/create', verifyToken, creatListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing);
router.get('/get', getListings);

// AI Features
router.post('/generate-ai', verifyToken, generateAIDescription);
router.post('/evaluate-ai', verifyToken, getAIValuation); // Added verifyToken for security, you can remove it if route is public

export default router;