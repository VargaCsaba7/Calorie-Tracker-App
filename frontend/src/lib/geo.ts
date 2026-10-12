export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`
}

/** Rough distance in meters between two points; enough to tell if the map moved. */
export function distanceM([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const dy = (lat2 - lat1) * 111_320
  const dx = (lon2 - lon1) * 111_320 * Math.cos((lat1 * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

/** Opens turn-by-turn directions in Google Maps (a new tab, or the app on phones). */
export function directionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
}
