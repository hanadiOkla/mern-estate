import express from "express"; // Fixed typo from exporess to express
import { 
  createListing, 
  deleteListing, 
  updateListing, 
  getListing, 
  getListings,
  generateAIDescription,
  getAIValuation ,
  approveListing, 
  getPendingListings
} from "../controllers/listing.controller.js";
import { verifyToken, verifyAdmin } from "../utils/verifyUser.js";
import { aiLimiter } from "../utils/rateLimiter.js"; 

const router = express.Router();



// Core CRUD Operations
router.post('/create', verifyToken, createListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);

// Admin-Only Dashboard Operations 
router.get('/pending', verifyToken, verifyAdmin, getPendingListings); 
router.put('/approve/:id', verifyToken, verifyAdmin, approveListing); 
// Public Operations
router.get('/get/:id', getListing);
router.get('/get', getListings);

// AI Features
router.post('/generate-ai', verifyToken, aiLimiter, generateAIDescription);
router.post('/evaluate-ai', verifyToken, aiLimiter, getAIValuation);


export default router;