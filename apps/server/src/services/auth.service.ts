import bcrypt from "bcrypt";

import db from "../db/pool.js";
import type { User } from "@algorym/shared-types";
import AppError from "../utils/AppError.js";

type createUserParam = Pick<User, 'name' | 'email' | 'password_hash'>;

export const registerUser = async ({ name, email, password_hash }: createUserParam): Promise<Omit<User, 'hash_password'>> => {
    const existing = await db.query("Select * from users where email = $1", [email]);

    if (existing.rows.length > 0) throw new AppError("User with this email is already registered", 409);

    const hash_password = await bcrypt.hash(password_hash, 10);

    const user = await db.query("Insert into users(name, email, password_hash) values ($1, $2, $3) Returning id, name, email, created_at", [name, email, hash_password]);
    return user.rows[0];
}
