import { cn } from '@/lib/utils'

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden', className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={size} height={size} className="size-full object-contain mix-blend-multiply" />
    </span>
  )
}

/** DiskarTech wordmark: logo + "Diskar" in ink and "Tech" in brand blue. */
export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-[7px]', className)}>
      <LogoMark size={size} />
      <span className="text-[18px] font-bold tracking-[-0.5px] text-ink">Diskar<span className="text-brand">Tech</span></span>
    </span>
  )
}
