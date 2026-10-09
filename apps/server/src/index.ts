import http from "http";
import app from "./app.js";
import { initializeWebSocketServer } from "./ws/index.js";
import { startSessionExpiryCron } from "./services/session-expiry.service.js";

const server = http.createServer(app);

initializeWebSocketServer(server);
startSessionExpiryCron();

/**
 * `PORT` first, because every PaaS (Northflank, Render, Koyeb, Fly) assigns the
 * port and tells the process about it through the environment. Hardcoding 3000
 * meant the container listened somewhere nothing was routing to, and the deploy
 * looked like a mystery connection refusal.
 */
const port = Number(process.env.PORT) || 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
