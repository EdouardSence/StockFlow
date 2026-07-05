import { Data, Effect } from "effect";
import type { IncidentsTable } from "../db/types";

/**
 * Noyau fonctionnel pur du cycle de vie des incidents. Aucune I/O ici — la
 * coquille (src/lib/incidents.ts) persiste le résultat via Kysely.
 */

export class InvalidIncidentTransitionError extends Data.TaggedError(
	"InvalidIncidentTransitionError",
)<{
	from: IncidentsTable["status"];
	to: IncidentsTable["status"];
}> {}

const NEXT_STATUS: Record<
	IncidentsTable["status"],
	IncidentsTable["status"] | null
> = {
	open: "in_progress",
	in_progress: "resolved",
	resolved: null,
};

/** Cycle linéaire strict open → in_progress → resolved, pas de saut ni retour. */
export function nextIncidentStatus(
	status: IncidentsTable["status"],
): IncidentsTable["status"] | null {
	return NEXT_STATUS[status];
}

export function transitionIncident(
	incident: IncidentsTable,
	targetStatus: IncidentsTable["status"],
): Effect.Effect<IncidentsTable, InvalidIncidentTransitionError> {
	if (NEXT_STATUS[incident.status] !== targetStatus) {
		return Effect.fail(
			new InvalidIncidentTransitionError({
				from: incident.status,
				to: targetStatus,
			}),
		);
	}
	return Effect.succeed({
		...incident,
		status: targetStatus,
		resolved_at:
			targetStatus === "resolved"
				? new Date().toISOString()
				: incident.resolved_at,
	});
}
