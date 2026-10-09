import http from "http";
import app from "./app.js";
import db from "./db/pool.js";
import { initializeWebSocketServer, shutdownWebSocketServer } from "./ws/index.js";
import { startSessionExpiryCron, stopSessionExpiryCron } from "./services/session-expiry.service.js";

const server = http.createServer(app);

initializeWebSocketServer(server);
startSessionExpiryCron();

/**
 * `PORT` first, because every PaaS (Render, Northflank, Koyeb, Fly) assigns the
 * port and tells the process about it through the environment. Hardcoding 3000
 * meant the container listened somewhere nothing was routing to, and the deploy
 * looked like a mystery connection refusal.
 */
const port = Number(process.env.PORT) || 3000;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

/**
 * Graceful shutdown.
 *
 * Hosted platforms do not kill a process; they send `SIGTERM` and wait. Render
 * gives 30 seconds, then `SIGKILL`s whatever is left. Without a handler the
 * default behaviour is to exit **immediately**, which means:
 *
 * - in-flight HTTP requests are cut off mid-response and the client sees a 502;
 * - every open WebSocket is severed with no close frame, so the editor's Yjs
 *   provider and the event socket both wait out their full backoff before
 *   retrying;
 * - Postgres connections are dropped while still in use.
 *
 * So the order matters. Stop taking new work first, let in-flight requests
 * finish, *then* tear down the sockets and the pool. Closing the HTTP server
 * before the sockets would reject the very reconnects we are trying to make
 * graceful.
 *
 * The hard timer is the escape hatch: if a client refuses to let go, we still
 * exit rather than sit until the platform kills us.
 */
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