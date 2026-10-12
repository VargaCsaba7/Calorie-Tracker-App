import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { Gym } from '../../api/types'
import { formatDistance } from '../../lib/geo'

export type LatLon = [number, number]

// Gyms are drawn as small weight plates; built with divIcon so no image files are needed
const plateIcon = (selected: boolean) =>
  L.divIcon({
    className: '',
    html: `<span class="gym-pin${selected ? ' is-selected' : ''}"></span>`,
    iconSize: selected ? [30, 30] : [22, 22],
    iconAnchor: selected ? [15, 15] : [11, 11],
    popupAnchor: [0, -12],
  })

interface GymMapProps {
  searchCenter: LatLon
  userLocation: LatLon | null
  radiusM: number
  gyms: Gym[]
  selected: Gym | null
  onSelect: (gym: Gym) => void
  /** Called with the map's center after the user pans or zooms */
  onMoved: (center: LatLon) => void
}

export function GymMap({ searchCenter, userLocation, radiusM, gyms, selected, onSelect, onMoved }: GymMapProps) {
  return (
    // isolate: keeps Leaflet's high z-indexes below the sticky page header
    <MapContainer center={searchCenter} zoom={14} scrollWheelZoom className="isolate h-full w-full">
      {/* OpenStreetMap's own tiles: free, no key; the attribution is required */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <FollowCenter center={searchCenter} />
      <FlyToSelected gym={selected} />
      <ReportMoves onMoved={onMoved} />

      <Circle
        center={searchCenter}
        radius={radiusM}
        pathOptions={{ color: '#1c2a44', weight: 1.5, dashArray: '5 6', fillColor: '#1c2a44', fillOpacity: 0.04 }}
      />
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={8}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2f6fdc', fillOpacity: 1 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}

      {gyms.map((gym) => (
        <Marker
          key={gym.id}
          position={[gym.lat, gym.lon]}
          icon={plateIcon(gym.id === selected?.id)}
          zIndexOffset={gym.id === selected?.id ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(gym) }}
          title={gym.name}
        >
          <Popup>
            <strong>{gym.name}</strong>
            <br />
            {formatDistance(gym.distance_m)} away
            {gym.address && (
              <>
                <br />
                {gym.address}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

/** Moves the map when a new search center is set (e.g. after "Use my location"). */
function FollowCenter({ center }: { center: LatLon }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom() < 13 ? 14 : map.getZoom())
  }, [map, center])
  return null
}

function FlyToSelected({ gym }: { gym: Gym | null }) {
  const map = useMap()
  useEffect(() => {
    if (gym) map.flyTo([gym.lat, gym.lon], Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [map, gym])
  return null
}

function ReportMoves({ onMoved }: { onMoved: (center: LatLon) => void }) {
  useMapEvents({
    moveend: (event) => {
      const c = event.target.getCenter()
      onMoved([c.lat, c.lng])
    },
  })
  return null
}
