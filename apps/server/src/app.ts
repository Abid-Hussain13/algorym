import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";

import pool from "./db/pool.js";
import demo_route from "./routes/demoPage.route.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import AppError from "./utils/AppError.js";

// middlewares
const app = express();
dotenv.config();
app.use(express.json());
app.use(morgan('dev'));

// routes

app.use("/api/demo", demo_route);


app.use(notFound);

//errorHandler
app.use(errorHandler);

export default app;
