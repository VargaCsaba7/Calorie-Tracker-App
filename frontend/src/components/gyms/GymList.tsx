import type { Gym } from '../../api/types'
import { directionsUrl, formatDistance } from '../../lib/geo'

interface GymListProps {
  gyms: Gym[]
  selectedId: string | null
  onSelect: (gym: Gym) => void
}

export function GymList({ gyms, selectedId, onSelect }: GymListProps) {
  return (
    <ul className="space-y-2">
      {gyms.map((gym) => {
        const isSelected = gym.id === selectedId
        return (
          <li key={gym.id}>
            <article
              className={`rounded-xl border p-3 transition ${
                isSelected ? 'border-brand-600 bg-brand-50' : 'border-black/5 bg-white hover:border-brand-500/30'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(gym)}
                aria-pressed={isSelected}
                className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-plate-blue"
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-tight font-semibold">{gym.name}</span>
                  {gym.address && <span className="block text-sm text-slate-500">{gym.address}</span>}
                </span>
                <span className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatDistance(gym.distance_m)}</span>
              </button>

              {gym.opening_hours && (
                <p className="mt-1.5 text-xs text-slate-600">
                  <span className="font-medium">Opening hours:</span> {gym.opening_hours}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a
                  href={directionsUrl(gym.lat, gym.lon)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-600 underline decoration-brand-100 decoration-2 underline-offset-4 hover:decoration-brand-600"
                >
                  Directions
                </a>
                {gym.website && (
                  <a
                    href={gym.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-600 underline decoration-brand-100 decoration-2 underline-offset-4 hover:decoration-brand-600"
                  >
                    Website
                  </a>
                )}
                {gym.phone && (
                  <a href={`tel:${gym.phone}`} className="text-slate-600 hover:underline">
                    {gym.phone}
                  </a>
                )}
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
