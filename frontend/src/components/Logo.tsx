/** A loaded barbell seen from the side: the app's mark. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden="true">
        <rect x={0} y={11} width={40} height={2} rx={1} fill="#7d8691" />
        <rect x={5} y={2} width={5} height={20} rx={1.5} fill="var(--color-plate-red)" />
        <rect x={11} y={5} width={4} height={14} rx={1.5} fill="var(--color-plate-blue)" />
        <rect x={25} y={5} width={4} height={14} rx={1.5} fill="var(--color-plate-blue)" />
        <rect x={30} y={2} width={5} height={20} rx={1.5} fill="var(--color-plate-red)" />
      </svg>
      <span className="font-display text-xl font-bold tracking-wide">Calorie Tracker</span>
    </span>
  )
}
