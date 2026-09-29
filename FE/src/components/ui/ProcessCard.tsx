import { cn } from '@/utils/cn'

interface ProcessCardProps {
  number: string
  title: string
  className?: string
}

export function ProcessCard({ number, title, className }: ProcessCardProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-start justify-between p-8 md:p-12 rounded-[26px] bg-gradient-to-b from-[#0011FF] to-[#00C8FF] shadow-2xl text-white w-full aspect-square hover:scale-[1.02] transition-transform duration-300", 
        className
      )}
    >
      <span className="text-[clamp(6rem,12vw,9rem)] font-heading font-medium tracking-tighter leading-none">
        {number}
      </span>
      <span className="text-[clamp(2rem,4vw,3.5rem)] font-heading font-normal tracking-tighter leading-[0.9] whitespace-pre-line text-left">
        {title}
      </span>
    </div>
  )
}
