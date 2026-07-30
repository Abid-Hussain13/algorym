import http from "http";
import app from "./app.js";
import { initializeWebSocketServer } from "./ws/index.js";

const server = http.createServer(app);

initializeWebSocketServer(server);

const port = 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
