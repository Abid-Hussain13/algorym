import http from "http";
import app from "./app.js";
import { initializeWebSocketServer } from "./ws/index.js";
import { initializeCollabServer } from "./collab/index.js";
import { startSessionExpiryCron } from "./services/session-expiry.service.js";

const server = http.createServer(app);

initializeWebSocketServer(server);
initializeCollabServer(server);
startSessionExpiryCron();

const port = 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
