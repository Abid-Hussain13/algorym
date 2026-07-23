import express, { Request, Response } from "express";

const demo_route = express.Router();

demo_route.get('/', (req: Request, res: Response): void => {
    res.send("hi");
})

demo_route.get("/data", (req, res) => {
    res.send("this is u data");
})

export default demo_route;
