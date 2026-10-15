/** Where the database connection settings come from. . */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function hostFromUrl(connectionString: string): string {
    try {
        return new URL(connectionString).hostname;
    } catch {
        return "";
    }
}

/** TLS decision. */
function shouldUseSsl(connectionString: string | undefined, host: string | undefined): boolean {
    if (process.env.DB_SSL) return process.env.DB_SSL !== "false";
    if (connectionString) return !LOCAL_HOSTS.has(hostFromUrl(connectionString));
    return !LOCAL_HOSTS.has(host ?? "");
}

/** Capped deliberately: hosted free tiers allow only a few concurrent . */
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
    /** Pool-only; a single Client has no ceiling to set. . */
    max?: number;
}

/** Config for `new Pool(...)`. . */
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

/** Config for `new Client(...)`. . */
export function buildClientConfig(): DbTarget {
    const { max: _max, ...rest } = buildPoolConfig();
    return rest;
}

/** True when nothing at all has been configured. . */
export function hasDatabaseConfig(): boolean {
    return Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
}

/** A description of the target for logging, with the password masked. . */
export function describeTarget(config: DbTarget): string {
    if (config.connectionString) {
        return config.connectionString.replace(/\/\/([^:]*):[^@]*@/, "//$1:***@");
    }
    return `${config.user}@${config.host}:${config.port}/${config.database}`;
}