import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { optionalVerifyJWT } from "../middlewares/optionalAuth.middleware.js";
import { createTweet, getUserTweets, deleteTweet, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()
// router.use(verifyJWT)

router.route("/").post(verifyJWT, upload.array("image",4), createTweet)
router.route("/:userId").get(optionalVerifyJWT, getUserTweets)
router.route("/:tweetId").delete(verifyJWT, deleteTweet).patch(verifyJWT,upload.array("image",4), updateTweet)

export default router