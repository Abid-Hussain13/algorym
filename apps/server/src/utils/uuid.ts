import AppError from "./AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const assertValidUuid = (id: string, entity = "Resource"): void => {
    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
        throw new AppError(`Invalid ${entity} id format`, 400);
    }
};