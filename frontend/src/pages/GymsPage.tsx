import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { gymsApi } from '../api/gyms'
import type { Gym } from '../api/types'
import { GymList } from '../components/gyms/GymList'
import { GymMap, type LatLon } from '../components/gyms/GymMap'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { distanceM } from '../lib/geo'

const BUDAPEST: LatLon = [47.4979, 19.0402]
const RADII = [1000, 3000, 5000, 10000]

export function GymsPage() {
  const [searchCenter, setSearchCenter] = useState<LatLon>(BUDAPEST)
  const [mapCenter, setMapCenter] = useState<LatLon>(BUDAPEST)
  const [userLocation, setUserLocation] = useState<LatLon | null>(null)
  const [radiusM, setRadiusM] = useState(3000)
  const [gyms, setGyms] = useState<Gym[] | null>(null)
  const [selected, setSelected] = useState<Gym | null>(null)
  const [status, setStatus] = useState<'idle' | 'locating' | 'searching'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function search(center: LatLon, radius = radiusM) {
    setSearchCenter(center)
    setSelected(null)
    setError(null)
    setStatus('searching')
    try {
      const result = await gymsApi.nearby(center[0], center[1], radius)
      setGyms(result.gyms)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setStatus('idle')
    }
  }

  function locateMe() {
    if (!('geolocation' in navigator)) {
      setError('This browser can’t share your location. Move the map and search the area instead.')
      return
    }
    setError(null)
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here: LatLon = [position.coords.latitude, position.coords.longitude]
        setUserLocation(here)
        void search(here)
      },
      (err) => {
        setStatus('idle')
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked. Allow it for this site in the browser, or move the map and search the area.'
            : 'Couldn’t get your location. Move the map and search the area instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const busy = status !== 'idle'
  const mapMoved = distanceM(mapCenter, searchCenter) > radiusM / 3

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Gyms nearby</h1>
          <p className="mt-1 text-brand-500">Your location is only used for this search and is never saved.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-brand-500">
            Within
            <select
              value={radiusM}
              onChange={(e) => {
                const radius = Number(e.target.value)
                setRadiusM(radius)
                if (gyms) void search(searchCenter, radius)
              }}
              className="h-10 rounded-lg border border-brand-100 bg-white px-2 text-brand-600"
            >
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r / 1000} km
                </option>
              ))}
            </select>
          </label>
          <Button onClick={locateMe} disabled={busy}>
            {status === 'locating' ? 'Finding you...' : 'Use my location'}
          </Button>
        </div>
      </div>

      <Alert message={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[55vh] min-h-80 overflow-hidden rounded-2xl border border-black/5 lg:h-[70vh]">
          <GymMap
            searchCenter={searchCenter}
            userLocation={userLocation}
            radiusM={radiusM}
            gyms={gyms ?? []}
            selected={selected}
            onSelect={setSelected}
            onMoved={setMapCenter}
          />
          {(mapMoved || !gyms) && !busy && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center">
              <Button variant="inverse" className="pointer-events-auto shadow-lg" onClick={() => void search(mapCenter)}>
                Search this area
              </Button>
            </div>
          )}
          {status === 'searching' && (
            <p className="absolute inset-x-0 top-3 z-[1000] mx-auto w-fit rounded-full bg-rubber px-4 py-1.5 text-sm text-white shadow-lg">
              Searching for gyms... the map service can take up to a minute
            </p>
          )}
        </div>

        <section className="min-w-0 lg:max-h-[70vh] lg:overflow-y-auto">
          {gyms === null ? (
            <div className="rounded-2xl border-2 border-dashed border-brand-100 bg-white p-5 text-brand-500">
              <p className="font-display text-xl font-semibold text-brand-600">Find a gym</p>
              <p className="mt-1 text-sm">
                Press “Use my location”, or move the map anywhere and press “Search this area”.
              </p>
            </div>
          ) : gyms.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-sm text-brand-500">
              No gyms found here. Try a larger distance or another area.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-brand-500">
                {gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'}, nearest first
              </p>
              <GymList gyms={gyms} selectedId={selected?.id ?? null} onSelect={setSelected} />
            </>
          )}
          <p className="mt-3 text-xs text-slate-500">Gym data from OpenStreetMap, which anyone can improve.</p>
        </section>
      </div>
    </div>
  )
}
