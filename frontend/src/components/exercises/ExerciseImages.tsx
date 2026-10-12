import { useEffect, useState } from 'react'

const FRAME_MS = 900

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The dataset has a start and an end photo per exercise. Switching between them
 * shows the movement like a tiny animation; with reduced motion they sit side by side.
 */
export function ExerciseImages({ urls, name }: { urls: string[]; name: string }) {
  const [frame, setFrame] = useState(0)
  const [reduced] = useState(prefersReducedMotion)
  const animate = urls.length > 1 && !reduced

  useEffect(() => {
    if (!animate) return
    const timer = setInterval(() => setFrame((f) => (f + 1) % urls.length), FRAME_MS)
    return () => clearInterval(timer)
  }, [animate, urls.length])

  if (urls.length === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-chalk text-sm text-slate-500">No picture</div>
  }

  if (!animate) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {urls.slice(0, 2).map((url, i) => (
          <img key={url} src={url} alt={`${name}, ${i === 0 ? 'start' : 'end'} position`} className="aspect-[4/3] w-full rounded-xl bg-white object-contain" />
        ))}
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white" role="img" aria-label={`${name}, start and end position`}>
      {urls.map((url, i) => (
        <img
          key={url}
          src={url}
          alt=""
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${i === frame ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <span className="absolute bottom-2 left-2 rounded-full bg-rubber/80 px-2 py-0.5 text-xs text-white">
        {frame === 0 ? 'Start' : 'End'}
      </span>
    </div>
  )
}
