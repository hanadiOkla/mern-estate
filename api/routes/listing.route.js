import exporess from "express";
import { creatListing, deleteListing } from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = exporess.Router();

router.post('/create', verifyToken ,creatListing );
router.delete('/delete/:id', verifyToken, deleteListing);

export default router;