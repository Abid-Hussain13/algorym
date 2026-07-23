import express from "express";
import dotenv from "dotenv";
import { demoPage } from "./routes/demoPage.route.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import AppError from "./utils/AppError.js";

// configs
const app = express();
dotenv.config();

//middlewares
app.use(express.json());

// routes

app.use("/api/demo", demoPage);


app.use(notFound);
//errorHandler
app.use(errorHandler);

export default app;
