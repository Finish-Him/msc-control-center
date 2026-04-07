import { Router } from "express";
import authRouter from "./auth.js";
import vpsRouter from "./vps.js";
import dockerRouter from "./docker.js";
import githubRouter from "./github.js";
import gradioRouter from "./gradio.js";
import servicesRouter from "./services.js";
import dashboardRouter from "./dashboard.js";
import filesRouter from "./files.js";
import spacesRouter from "./spaces.js";
import localRouter from "./localprojects.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/vps", vpsRouter);
router.use("/docker", dockerRouter);
router.use("/github", githubRouter);
router.use("/gradio", gradioRouter);
router.use("/services", servicesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/files", filesRouter);
router.use("/spaces", spacesRouter);
router.use("/local", localRouter);

export default router;
