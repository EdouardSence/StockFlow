import { Data, Effect } from "effect";
import type { EquipmentTable } from "../db/types";

/**
 * Noyau fonctionnel pur des règles d'assignation équipement. Aucune I/O —
 * l'équipement est passé déjà résolu par l'appelant (`null` si introuvable),
 * ce qui garde la fonction testable sans base de données.
 */

export class EquipmentNotFoundError extends Data.TaggedError(
	"EquipmentNotFoundError",
)<{ id: string }> {}

export class EquipmentUnavailableError extends Data.TaggedError(
	"EquipmentUnavailableError",
)<{ id: string; status: EquipmentTable["status"] }> {}

/**
 * `userId` non-null → assignation/réassignation, uniquement permise depuis
 * `available` ou `assigned` (pas `broken`/`maintenance`).
 * `userId` null → désassignation, toujours permise ; repasse à `available`
 * sauf si l'équipement est `broken`/`maintenance` (statut préservé, pas écrasé).
 */
export function assignEquipment(
	equipmentId: string,
	equipment: EquipmentTable | null,
	userId: string | null,
): Effect.Effect<
	EquipmentTable,
	EquipmentNotFoundError | EquipmentUnavailableError
> {
	if (!equipment) {
		return Effect.fail(new EquipmentNotFoundError({ id: equipmentId }));
	}

	const updated_at = new Date().toISOString();

	if (userId === null) {
		const status =
			equipment.status === "broken" || equipment.status === "maintenance"
				? equipment.status
				: ("available" as const);
		return Effect.succeed({
			...equipment,
			status,
			assigned_to: null,
			updated_at,
		});
	}

	if (equipment.status !== "available" && equipment.status !== "assigned") {
		return Effect.fail(
			new EquipmentUnavailableError({
				id: equipment.id,
				status: equipment.status,
			}),
		);
	}
	return Effect.succeed({
		...equipment,
		status: "assigned",
		assigned_to: userId,
		updated_at,
	});
}
