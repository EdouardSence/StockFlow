import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { v4 as uuidv4 } from "uuid";
import { withAuthContext } from "../db/client";
import { adminMiddleware, authMiddleware } from "./auth";
import { nextIncidentStatus, transitionIncident } from "./incidents-domain";

export type NewIncidentInput = {
	equipment_id: string;
	description?: string | null;
};

export function validateNewIncidentInput(
	input: Partial<NewIncidentInput>,
): string | null {
	if (!input.equipment_id || input.equipment_id.trim().length === 0)
		return "L'équipement est requis";
	if (input.description != null && input.description.length > 2000)
		return "Description trop longue (2000 caractères max)";
	return null;
}

/** Description vide/blanche normalisée à null. */
export function normalizeIncidentDescription(
	description: string | null | undefined,
): string | null {
	const trimmed = description?.trim();
	return trimmed ? trimmed : null;
}

export const createIncidentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => {
		const input = data as NewIncidentInput;
		const error = validateNewIncidentInput(input);
		if (error) throw new Error(error);
		return input;
	})
	.handler(async ({ data, context }) => {
		const id = uuidv4();
		const now = new Date().toISOString();
		await withAuthContext(context.user, (trx) =>
			trx
				.insertInto("incidents")
				.values({
					id,
					equipment_id: data.equipment_id,
					reported_by: context.user.id,
					description: normalizeIncidentDescription(data.description),
					status: "open",
					created_at: now,
					resolved_at: null,
				})
				.execute(),
		);
		return { id };
	});

/**
 * Réservé admin : la policy RLS `users_select` (id = app_user_id() OR
 * role = admin) ne laisse un technicien voir que sa propre ligne. Une jointure
 * vers `users` pour le nom du déclarant masquerait silencieusement (via RLS)
 * les incidents déclarés par d'autres techniciens pour un non-admin — cette
 * vue consolidée n'a donc de sens que pour l'admin, qui voit tout le monde.
 */
export const listIncidentsFn = createServerFn({ method: "GET" })
	.middleware([adminMiddleware])
	.handler(async ({ context }) => {
		return withAuthContext(context.user, (trx) =>
			trx
				.selectFrom("incidents")
				.innerJoin("equipment", "equipment.id", "incidents.equipment_id")
				.innerJoin("users", "users.id", "incidents.reported_by")
				.select([
					"incidents.id as id",
					"incidents.equipment_id as equipment_id",
					"incidents.description as description",
					"incidents.status as status",
					"incidents.created_at as created_at",
					"incidents.resolved_at as resolved_at",
					"equipment.name as equipment_name",
					"equipment.brand as equipment_brand",
					"equipment.model as equipment_model",
					"users.name as reported_by_name",
				])
				.orderBy("incidents.created_at", "desc")
				.execute(),
		);
	});

/** Transition ouverte à technician et admin — pas de restriction de rôle ici. */
export const advanceIncidentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => data as { id: string })
	.handler(async ({ data, context }) => {
		return withAuthContext(context.user, async (trx) => {
			const incident = await trx
				.selectFrom("incidents")
				.selectAll()
				.where("id", "=", data.id)
				.executeTakeFirst();
			if (!incident) throw new Error("Incident introuvable");

			const target = nextIncidentStatus(incident.status);
			if (!target) throw new Error("Cet incident est déjà résolu");

			const result = Effect.runSync(
				Effect.either(transitionIncident(incident, target)),
			);
			if (result._tag === "Left") throw new Error("Transition invalide");

			await trx
				.updateTable("incidents")
				.set({
					status: result.right.status,
					resolved_at: result.right.resolved_at,
				})
				.where("id", "=", data.id)
				.execute();

			return {
				id: data.id,
				status: result.right.status,
				resolved_at: result.right.resolved_at,
			};
		});
	});

/**
 * Nombre d'incidents non résolus par équipement. Ouvert aux deux rôles :
 * les policies incidents_select / equipment_select filtrent par rôle, pas
 * par propriété — un technicien voit les mêmes comptes qu'un admin.
 */
export const getOpenIncidentCountsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const rows = await withAuthContext(context.user, (trx) =>
			trx
				.selectFrom("incidents")
				.select(["equipment_id"])
				.select((eb) => eb.fn.countAll<string>().as("count"))
				.where("status", "!=", "resolved")
				.groupBy("equipment_id")
				.execute(),
		);
		return rows.map((r) => ({
			equipment_id: r.equipment_id,
			count: Number(r.count),
		}));
	});
