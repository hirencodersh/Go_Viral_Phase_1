import { Router } from "express";
import {
  createPost,
  getExplorePosts,
  getPosts,
} from "../controllers/post.controller";
import { authenticate } from "../middleware/authenticate";
import { postMediaUpload } from "../middleware/postUpload";

const router = Router();

router.use(authenticate);
router.get("/explore", getExplorePosts);
router.get("/", getPosts);
router.post("/", postMediaUpload, createPost);

export default router;
