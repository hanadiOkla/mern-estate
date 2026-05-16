import exporess from "express";
import { creatListing, deleteListing, updateListing, getListing, getListings } from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = exporess.Router();

router.post('/create', verifyToken ,creatListing );
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id' , verifyToken , updateListing);
router.get('/get/:id', getListing);
router.get('/get', getListings);
export default router;