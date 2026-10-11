export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse'
export type ButtonSize = 'sm' | 'md'

// Every variant has a visible surface, so all buttons read as buttons.
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_2px_0_var(--color-brand-700)] hover:bg-brand-700 active:translate-y-px active:shadow-none disabled:bg-brand-500/60 disabled:shadow-none',
  secondary:
    'border border-brand-100 bg-white text-brand-600 shadow-[0_2px_0_var(--color-brand-100)] hover:border-brand-500/40 active:translate-y-px active:shadow-none',
  ghost: 'bg-black/5 text-brand-600 hover:bg-black/10',
  danger: 'border border-plate-red/25 bg-white text-plate-red hover:bg-plate-red hover:text-white',
  // For dark surfaces (header, barbell panel)
  inverse: 'bg-white text-rubber hover:bg-chalk',
}

/** Shared by <Button> and <ButtonLink> so links that act as buttons look identical. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  const sizing = size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-5 text-base'
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-display font-semibold tracking-wide whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plate-blue disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${variants[variant]} ${extra}`
}
