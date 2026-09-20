import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import { validate } from "../middlewares/validate.js";
import { changePasswordSchema, updatePreferencesSchema } from "../utils/validation.js";
import { changePassword, getPreferences, updatePreferences, deleteAccount } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.use(protect);

userRoute.patch("/password", validate(changePasswordSchema), changePassword);
userRoute.get("/preferences", getPreferences);
userRoute.put("/preferences", validate(updatePreferencesSchema), updatePreferences);
userRoute.delete("/", deleteAccount);

export default userRoute;
