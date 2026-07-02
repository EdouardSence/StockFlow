export interface UsersTable {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician'
  created_at: string
}

export interface EquipmentTable {
  id: string
  name: string
  type: 'pc' | 'screen' | 'printer' | 'other'
  brand: string | null
  model: string | null
  serial_number: string | null
  qr_code: string
  status: 'available' | 'assigned' | 'broken' | 'maintenance'
  assigned_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IncidentsTable {
  id: string
  equipment_id: string
  reported_by: string
  description: string | null
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  resolved_at: string | null
}

export interface Database {
  users: UsersTable
  equipment: EquipmentTable
  incidents: IncidentsTable
}
