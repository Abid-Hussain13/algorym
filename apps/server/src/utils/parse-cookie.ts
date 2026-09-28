export const parseCookieHeader = (header: string | undefined): Record<string, string> => {
    if (!header) return {};

    const jar: Record<string, string> = {};

    for (const part of header.split(";")) {
        const separator = part.indexOf("=");
        if (separator < 1) continue;

        const name = part.slice(0, separator).trim();
        if (!name || name in jar) continue;

        const value = part.slice(separator + 1).trim();
        try {
            jar[name] = decodeURIComponent(value);
        } catch {
            jar[name] = value;
        }
    }

    return jar;
};
