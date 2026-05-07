import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createEquipmentFn } from '../../lib/equipment'
import type { EquipmentTable } from '../../db/types'

export const Route = createFileRoute('/equipment/new')({
  component: NewEquipmentPage,
})

function NewEquipmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState<EquipmentTable['type']>('pc')
  const [status, setStatus] = useState<EquipmentTable['status']>('available')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    setPending(true)
    setError(null)
    try {
      await createEquipmentFn({ data: { name: name.trim(), type, status } })
      await navigate({ to: '/equipment' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setPending(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Ajouter un équipement</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: MacBook Pro 14 — Bureau 3"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as EquipmentTable['type'])}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="pc">PC / Ordinateur</option>
            <option value="screen">Écran</option>
            <option value="printer">Imprimante</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EquipmentTable['status'])}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="available">Disponible</option>
            <option value="assigned">Attribué</option>
            <option value="maintenance">Maintenance</option>
            <option value="broken">En panne</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/equipment' })}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
