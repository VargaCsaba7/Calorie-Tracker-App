import Model, { type Muscle } from 'react-body-highlighter'
import { bodyParts } from '../../lib/muscles'

const BODY = '#d3d8de'
const SECONDARY = '#f0a6ab'
const PRIMARY = '#d8343f' // plate red

interface BodyMapProps {
  primary: string[]
  secondary: string[]
}

/** Front and back of a body with the trained muscles colored: dark for main, light for helping muscles. */
export function BodyMap({ primary, secondary }: BodyMapProps) {
  // The library colors a muscle by how often it appears, so main muscles are listed twice
  const data = [
    { name: 'secondary', muscles: bodyParts(secondary) as Muscle[] },
    { name: 'primary', muscles: bodyParts(primary) as Muscle[] },
    { name: 'primary-again', muscles: bodyParts(primary) as Muscle[] },
  ]

  return (
    <figure>
      <div className="flex justify-center gap-4" aria-hidden="true">
        {(['anterior', 'posterior'] as const).map((type) => (
          <Model
            key={type}
            type={type}
            data={data}
            bodyColor={BODY}
            highlightedColors={[SECONDARY, PRIMARY, PRIMARY]}
            style={{ width: '7.5rem' }}
          />
        ))}
      </div>
      <figcaption className="mt-2 flex justify-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ backgroundColor: PRIMARY }} /> Main muscles
        </span>
        {secondary.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ backgroundColor: SECONDARY }} /> Helping muscles
          </span>
        )}
      </figcaption>
    </figure>
  )
}

/** A tiny body for the filter buttons */
export function MiniBody({ parts, view }: { parts: string[]; view: 'anterior' | 'posterior' }) {
  return (
    <Model
      type={view}
      data={[{ name: 'group', muscles: parts as Muscle[] }]}
      bodyColor={BODY}
      highlightedColors={[PRIMARY]}
      style={{ width: '1.6rem' }}
    />
  )
}
