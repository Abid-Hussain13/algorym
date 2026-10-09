import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import healthRoute from "./routes/health.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";

const app = express();
dotenv.config();
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Request logging is a development aid. In production it is noise that also
// records query strings, so it is off unless explicitly enabled.
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// At the root, not under /api: this is the path a platform health probe or a
// keep-alive ping expects to find.
app.use("/", healthRoute);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
