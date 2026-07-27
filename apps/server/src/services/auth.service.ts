import bcrypt from "bcrypt";

import db from "../db/pool.js";
import type { User } from "@algorym/shared-types";
import AppError from "../utils/AppError.js";

type createUserParam = Pick<User, 'name' | 'email' | 'password_hash'>;

export const registerUser = async ({ name, email, password_hash }: createUserParam): Promise<Omit<User, 'password_hash'>> => {
    const existing = await db.query("Select * from users where email = $1", [email]);

    if (existing.rows.length > 0)
        throw new AppError("User with this email is already registered", 409);

    const hash_password = await bcrypt.hash(password_hash, 10);

    const queryString2 = "Insert into users(name, email, password_hash) values ($1, $2, $3) Returning id, name, email, created_at";
    const user = await db.query(queryString2, [name, email, hash_password]);
    return user.rows[0];
}

type createLoginParam = Pick<User, 'email' | 'password_hash'>;
export const loginUser = async ({ email, password_hash }: createLoginParam): Promise<Omit<User, 'password_hash'>> => {
    const user = await db.query("Select * from users where email = $1", [email]);
    if (!user.rows.length)
        throw new AppError("invalid email or password", 401);
    const hashedPassword = await bcrypt.compare(password_hash, user.rows[0].password_hash);
    if (!hashedPassword)
        throw new AppError("invalid email or password", 401);
    return user.rows[0];
}
