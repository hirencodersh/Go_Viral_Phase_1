import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { profilePhotoUpload } from "../middleware/profileUpload";
import { validateBody } from "../validators/auth.validation";
import { profileUpdateSchema, rolesUpdateSchema } from "../validators/profile.validation";
import { getProfile, updateProfile, updateRoles, uploadProfilePhoto } from "../controllers/user.controller";

const router = Router();

router.use(authenticate);
router.get("/profile", getProfile);
router.put("/profile", validateBody(profileUpdateSchema), updateProfile);
router.patch("/roles", validateBody(rolesUpdateSchema), updateRoles);
router.post("/profile/photo", profilePhotoUpload, uploadProfilePhoto);

export default router;
