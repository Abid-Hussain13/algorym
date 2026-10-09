/**
 * Where the database connection settings come from.
 *
 * Lives in one place because `pool.ts` and the `db:setup` / `db:seed` scripts
 * all need the same answer, and three copies of "is this local or hosted?" is
 * exactly how a script and the app end up disagreeing about which database they
 * are talking to.
 *
 * Two ways to configure, because local and hosted are genuinely different:
 *
 * - **`DATABASE_URL`** — what Supabase and every hosted provider hands you.
 * - **Discrete `DB_*` vars** — local development.
 *
 * `DATABASE_URL` wins when both are set.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function hostFromUrl(connectionString: string): string {
    try {
        return new URL(connectionString).hostname;
    } catch {
        return "";
    }
}

/**
 * TLS decision.
 *
 * Managed Postgres requires it and presents a certificate Node does not trust by
 * default, hence `rejectUnauthorized: false` — the connection is still
 * encrypted, it simply skips CA verification, which is the standard Supabase
 * pooler configuration.
 *
 * A local server usually has no certificate at all and will refuse the
 * handshake, so it is detected and left off. `DB_SSL=false` forces it off, for
 * the awkward cases (a tunnel, a container) where the hostname looks remote but
 * the database is not.
 */
function shouldUseSsl(connectionString: string | undefined, host: string | undefined): boolean {
    if (process.env.DB_SSL) return process.env.DB_SSL !== "false";
    if (connectionString) return !LOCAL_HOSTS.has(hostFromUrl(connectionString));
    return !LOCAL_HOSTS.has(host ?? "");
}

/**
 * Capped deliberately: hosted free tiers allow only a few concurrent
 * connections, and Postgres refuses the surplus rather than queueing. A low
 * ceiling turns a would-be hang into a visible error.
 */
function poolMax(): number {
    return Number(process.env.DB_POOL_MAX) || 10;
}

export interface DbTarget {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: { rejectUnauthorized: false };
    /** Pool-only; a single Client has no ceiling to set. */
    max?: number;
}

/** Config for `new Pool(...)`. */
export function buildPoolConfig(): DbTarget {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
        return {
            connectionString,
            ssl: shouldUseSsl(connectionString, undefined) ? { rejectUnauthorized: false } : undefined,
            max: poolMax(),
        };
    }

    return {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_DATABASE,
        ssl: shouldUseSsl(undefined, process.env.DB_HOST) ? { rejectUnauthorized: false } : undefined,
        max: poolMax(),
    };
}

/**
 * Config for `new Client(...)`. `max` is meaningless on a single client, so it
 * is left off.
 */
export function buildClientConfig(): DbTarget {
    const { max: _max, ...rest } = buildPoolConfig();
    return rest;
}

/** True when nothing at all has been configured. */
export function hasDatabaseConfig(): boolean {
    return Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
}

/**
 * A description of the target for logging, with the password masked. Printing a
 * connection string verbatim puts credentials in the deploy logs.
 */
export function describeTarget(config: DbTarget): string {
    if (config.connectionString) {
        return config.connectionString.replace(/\/\/([^:]*):[^@]*@/, "//$1:***@");
    }
    return `${config.user}@${config.host}:${config.port}/${config.database}`;
}