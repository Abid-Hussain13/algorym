import http from "http";
import app from "./app.js";
import db from "./db/pool.js";
import { initializeWebSocketServer, shutdownWebSocketServer } from "./ws/index.js";
import { startSessionExpiryCron, stopSessionExpiryCron } from "./services/session-expiry.service.js";

const server = http.createServer(app);

initializeWebSocketServer(server);
startSessionExpiryCron();

/** `PORT` first, because every PaaS (Render, Northflank, Koyeb, Fly) assigns the . */
const port = Number(process.env.PORT) || 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

/** Graceful shutdown. */
let shuttingDown = false;

async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    const forceExitAfterMs = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 25_000;
    // Always armed, even on the happy path, so a wedged handler cannot hang the
    // process past the platform's window.
    const forceExit = setTimeout(() => {
        console.warn(`[shutdown] ${signal}: timed out, exiting anyway`);
        process.exit(1);
    }, forceExitAfterMs);
    forceExit.unref();

    console.log(`[shutdown] ${signal} received, closing gracefully…`);

    try {
        // 1. Stop accepting new connections, but let existing requests drain.
        await new Promise<void>((resolve) => server.close(() => resolve()));
        console.log("[shutdown] http server closed");

        // 2. Tell connected editors why, then close the sockets.
        shutdownWebSocketServer(1001, "Server restarting");
        console.log("[shutdown] websockets closed");

        // 3. The cron would otherwise fire mid-teardown and open a query on a
        //    pool that is about to end.
        stopSessionExpiryCron();

        // 4. Release Postgres last, once nothing can ask it for anything.
        await db.end();
        console.log("[shutdown] database pool ended");
    } catch (err) {
        console.error("[shutdown] error during shutdown:", err);
    }

    clearTimeout(forceExit);
    console.log("[shutdown] complete");
    process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));