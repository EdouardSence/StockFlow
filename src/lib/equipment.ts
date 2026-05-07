import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client';
import type { EquipmentTable } from '../db/types';

type NewEquipment = Omit<EquipmentTable, 'id' | 'qr_code' | 'created_at' | 'updated_at' | 'status'> & {
  status?: EquipmentTable['status'];
};

export async function createEquipment(data: NewEquipment) {
  const id = uuidv4();
  const qr_code = uuidv4();
  const now = new Date().toISOString();

  await db
    .insertInto('equipment')
    .values({
      ...data,
      id,
      qr_code,
      status: data.status ?? 'available',
      created_at: now,
      updated_at: now,
    })
    .execute();

  return { id, qr_code };
}

export async function listEquipment() {
  return db.selectFrom('equipment').selectAll().orderBy('created_at', 'desc').execute();
}

export async function getEquipmentByQr(qr_code: string) {
  return db.selectFrom('equipment').selectAll().where('qr_code', '=', qr_code).executeTakeFirst();
}
