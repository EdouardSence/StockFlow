import { createServerFn } from '@tanstack/react-start'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/client'
import type { EquipmentTable } from '../db/types'

export type NewEquipmentInput = {
  name: string
  type: EquipmentTable['type']
  status?: EquipmentTable['status']
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  notes?: string | null
  assigned_to?: string | null
}

export function validateNewEquipmentInput(input: Partial<NewEquipmentInput>): string | null {
  if (!input.name || input.name.trim().length === 0) return 'Le nom est requis'
  if (!input.type) return 'Le type est requis'
  const validTypes: EquipmentTable['type'][] = ['pc', 'laptop', 'screen', 'printer', 'phone', 'other']
  if (!validTypes.includes(input.type)) return `Type invalide: ${input.type}`
  return null
}

export function applyEquipmentDefaults(input: NewEquipmentInput) {
  return {
    ...input,
    status: input.status ?? ('available' as const),
    brand: input.brand ?? null,
    model: input.model ?? null,
    serial_number: input.serial_number ?? null,
    notes: input.notes ?? null,
    assigned_to: input.assigned_to ?? null,
  }
}

export const getEquipments = createServerFn({ method: 'GET' }).handler(async () => {
  return db.selectFrom('equipment').selectAll().orderBy('created_at', 'desc').execute()
})

export const getEquipmentById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => data as { id: string })
  .handler(async ({ data }) => {
    const row = await db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', data.id)
      .executeTakeFirst()
    return row ?? null
  })

export const createEquipmentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data as NewEquipmentInput)
  .handler(async ({ data }) => {
    const id = uuidv4()
    const qr_code = uuidv4()
    const now = new Date().toISOString()

    await db
      .insertInto('equipment')
      .values({
        id,
        qr_code,
        name: data.name,
        type: data.type,
        status: data.status ?? 'available',
        brand: data.brand ?? null,
        model: data.model ?? null,
        serial_number: data.serial_number ?? null,
        notes: data.notes ?? null,
        assigned_to: data.assigned_to ?? null,
        created_at: now,
        updated_at: now,
      })
      .execute()

    return { id, qr_code }
  })

export const updateEquipmentStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data as { id: string; status: EquipmentTable['status'] })
  .handler(async ({ data }) => {
    await db
      .updateTable('equipment')
      .set({ status: data.status, updated_at: new Date().toISOString() })
      .where('id', '=', data.id)
      .execute()
    return { success: true }
  })
