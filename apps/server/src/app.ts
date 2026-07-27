import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoute from "./routes/auth.routes.js";

import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import questionRoute from "./routes/questions.routes.js";

// middlewares
const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded(({ extended: true })));
app.use(cookieParser());
app.use(morgan('dev'));

// routes

app.use("/api/auth", authRoute);
app.use("/api/question", questionRoute);


app.use(notFound);

//errorHandler
app.use(errorHandler);

export default app;
