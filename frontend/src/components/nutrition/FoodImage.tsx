import { useState } from 'react'

interface FoodImageProps {
  imageUrl: string | null | undefined
  emoji: string | null | undefined
  name: string
  size?: 'sm' | 'lg'
}

/** Product photo if there is one, otherwise the food's emoji, otherwise a plate. */
export function FoodImage({ imageUrl, emoji, name, size = 'sm' }: FoodImageProps) {
  const [failed, setFailed] = useState(false)
  const box = size === 'lg' ? 'size-20 text-5xl' : 'size-11 text-2xl'

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${box} shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5`}
      />
    )
  }
  return (
    <span aria-hidden="true" className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-chalk`}>
      {emoji ?? '🍽️'}
    </span>
  )
}
