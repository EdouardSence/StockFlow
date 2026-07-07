import { createServerFn } from "@tanstack/react-start";
import { sql } from "kysely";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { isPgError, withAuthContext } from "../db/client";
import { adminMiddleware } from "./auth";

export const roleSchema = z.enum(["admin", "technician"]);

export const newUserSchema = z.object({
	name: z
		.string("Le nom est requis")
		.trim()
		.min(1, "Le nom est requis")
		.max(200),
	email: z.string().trim().toLowerCase().email().max(254),
	role: roleSchema,
	password: z.string().min(8, "8 caractères minimum").max(1024),
});

export const userIdSchema = z.object({ id: z.string().trim().min(1) });

interface UserWithStatus {
	id: string;
	name: string;
	email: string;
	role: "admin" | "technician";
	created_at: string;
	active: boolean;
}

export const listUsersFn = createServerFn({ method: "GET" })
	.middleware([adminMiddleware])
	.handler(async ({ context }) => {
		return withAuthContext(context.user, (trx) =>
			sql<UserWithStatus>`SELECT * FROM auth_list_users_with_status()`
				.execute(trx)
				.then((r) => r.rows),
		);
	});

export const createUserFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.inputValidator((data: unknown) => newUserSchema.parse(data))
	.handler(async ({ data, context }) => {
		const { hashPassword } = await import("./auth-core");
		const password_hash = await hashPassword(data.password);
		const id = uuidv4();

		await withAuthContext(context.user, async (trx) => {
			try {
				await trx
					.insertInto("users")
					.values({
						id,
						name: data.name,
						email: data.email,
						role: data.role,
						password_hash,
						created_at: new Date().toISOString(),
					})
					.execute();
			} catch (err) {
				if (isPgError(err) && (err as { code: string }).code === "23505") {
					throw new Error("Cet email est déjà utilisé.");
				}
				throw err;
			}
		});

		return { id };
	});

export const deactivateUserFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.inputValidator((data: unknown) => userIdSchema.parse(data))
	.handler(async ({ data, context }) => {
		if (data.id === context.user.id) {
			throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
		}
		await withAuthContext(context.user, (trx) =>
			trx
				.updateTable("users")
				.set({ password_hash: null })
				.where("id", "=", data.id)
				.execute(),
		);
		return { success: true };
	});
