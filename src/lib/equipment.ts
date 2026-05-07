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

export const getEquipments = createServerFn({ method: 'GET' }).handler(async () => {
  return db.selectFrom('equipment').selectAll().orderBy('created_at', 'desc').execute()
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
