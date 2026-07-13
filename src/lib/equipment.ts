import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { withAuthContext } from "../db/client";
import { adminMiddleware, authMiddleware } from "./auth";
import { assignEquipment } from "./equipment-domain";

/* ── Schémas d'entrée (validation runtime Zod, issue #14) ─────────
 * Même exigence que loginFn : jamais de simple cast TypeScript sur une
 * server function. Défauts et normalisation à null vivent dans le schéma —
 * le handler consomme des données déjà sûres. */

export const equipmentTypeSchema = z.enum(["pc", "screen", "printer", "other"]);
export const equipmentStatusSchema = z.enum([
	"available",
	"assigned",
	"broken",
	"maintenance",
]);

const optionalText = (max: number) =>
	z
		.string()
		.max(max)
		.nullish()
		.transform((v) => (v?.trim() ? v.trim() : null));

export const newEquipmentSchema = z.object({
	name: z
		.string("Le nom est requis")
		.trim()
		.min(1, "Le nom est requis")
		.max(200),
	type: equipmentTypeSchema,
	status: equipmentStatusSchema.default("available"),
	brand: optionalText(200),
	model: optionalText(200),
	serial_number: optionalText(200),
	notes: optionalText(2000),
	assigned_to: optionalText(100),
});

export const equipmentIdSchema = z.object({ id: z.string().trim().min(1) });

export const updateEquipmentStatusSchema = z.object({
	id: z.string().trim().min(1),
	status: equipmentStatusSchema,
});

export const assignEquipmentSchema = z.object({
	id: z.string().trim().min(1),
	userId: z.string().trim().min(1).nullable(),
});

export type NewEquipmentInput = z.input<typeof newEquipmentSchema>;

export const getEquipments = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return withAuthContext(context.user, (trx) =>
			trx
				.selectFrom("equipment")
				.selectAll()
				.orderBy("created_at", "desc")
				.execute(),
		);
	});

export const getEquipmentById = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => equipmentIdSchema.parse(data))
	.handler(async ({ data, context }) => {
		const row = await withAuthContext(context.user, (trx) =>
			trx
				.selectFrom("equipment")
				.selectAll()
				.where("id", "=", data.id)
				.executeTakeFirst(),
		);
		return row ?? null;
	});

export const createEquipmentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => newEquipmentSchema.parse(data))
	.handler(async ({ data, context }) => {
		const id = uuidv4();
		const qr_code = uuidv4();
		const now = new Date().toISOString();

		// data est déjà normalisé par le schéma (défauts + null).
		await withAuthContext(context.user, (trx) =>
			trx
				.insertInto("equipment")
				.values({ ...data, id, qr_code, created_at: now, updated_at: now })
				.execute(),
		);

		return { id, qr_code };
	});

export const updateEquipmentStatus = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => updateEquipmentStatusSchema.parse(data))
	.handler(async ({ data, context }) => {
		await withAuthContext(context.user, (trx) =>
			trx
				.updateTable("equipment")
				.set({ status: data.status, updated_at: new Date().toISOString() })
				.where("id", "=", data.id)
				.execute(),
		);
		return { success: true };
	});

/**
 * Réservé admin : la policy RLS `users_select` ne laisse un rôle technician
 * voir que sa propre ligne — un technicien ne peut structurellement pas
 * obtenir la liste de ses collègues pour choisir à qui réassigner.
 */
export const getAssignableUsersFn = createServerFn({ method: "GET" })
	.middleware([adminMiddleware])
	.handler(async ({ context }) => {
		return withAuthContext(context.user, (trx) =>
			trx
				.selectFrom("users")
				.select(["id", "name", "role"])
				.orderBy("name")
				.execute(),
		);
	});

/**
 * `userId` : id de l'utilisateur à assigner, ou `null` pour désassigner.
 * Un technicien ne peut s'assigner qu'à lui-même ou désassigner — choisir un
 * collègue précis est réservé à l'admin (seul rôle dont `users_select` voit
 * tout le monde, cf. `getAssignableUsersFn`).
 */
export const assignEquipmentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => assignEquipmentSchema.parse(data))
	.handler(async ({ data, context }) => {
		if (
			data.userId !== null &&
			data.userId !== context.user.id &&
			context.user.role !== "admin"
		) {
			const { AuthError } = await import("./auth-core");
			throw new AuthError("FORBIDDEN");
		}

		return withAuthContext(context.user, async (trx) => {
			const row = await trx
				.selectFrom("equipment")
				.selectAll()
				.where("id", "=", data.id)
				.executeTakeFirst();

			const result = Effect.runSync(
				Effect.either(assignEquipment(data.id, row ?? null, data.userId)),
			);
			if (result._tag === "Left") {
				throw new Error(
					result.left._tag === "EquipmentNotFoundError"
						? "Équipement introuvable"
						: "Cet équipement n'est pas disponible pour assignation",
				);
			}

			const updated = result.right;
			await trx
				.updateTable("equipment")
				.set({
					status: updated.status,
					assigned_to: updated.assigned_to,
					updated_at: updated.updated_at,
				})
				.where("id", "=", data.id)
				.execute();

			return {
				id: data.id,
				status: updated.status,
				assigned_to: updated.assigned_to,
			};
		});
	});
