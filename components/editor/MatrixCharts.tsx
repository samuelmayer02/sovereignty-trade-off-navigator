import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function DonutChart({ data }: { data: { label: string, value: number, color: string }[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0) return <div className="text-muted text-sm flex h-full items-center justify-center">Keine Daten</div>;
  
  const circumference = 2 * Math.PI * 40;
  
  const segments: { item: typeof data[0]; i: number; dash: number; offset: number }[] = [];
  let runningPercent = 0;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.value > 0) {
      const percentage = (item.value / total) * 100;
      const dash = (percentage * circumference) / 100;
      const offset = -((runningPercent * circumference) / 100);
      runningPercent += percentage;
      segments.push({ item, i, dash, offset });
    }
  }
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-card-border/50" />
        {segments.map(({ item, i, dash, offset }) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={item.color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out hover:stroke-[12] cursor-pointer"
          >
            <title>{item.label}: {item.value}</title>
          </circle>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-light tracking-tight text-foreground/90">{total}</span>
        <span className="text-[10px] uppercase font-bold text-muted tracking-widest mt-1">Bewertet</span>
      </div>
    </div>
  );
}

export function StackedConflictBar({ red, orange, blue, green, total }: { red: number, orange: number, blue: number, green: number, total: number }) {
  if (total === 0) return <div className="h-2.5 w-full bg-card-border/50 rounded-full" />;
  const pRed = (red / total) * 100;
  const pOrange = (orange / total) * 100;
  const pBlue = (blue / total) * 100;
  const pGreen = (green / total) * 100;

  return (
    <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-card-border/50 shadow-inner">
      {pRed > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pRed}%` }} className="bg-danger" title={`${red} Konflikte`} />}
      {pOrange > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pOrange}%` }} className="bg-warning" title={`${orange} Trade-offs`} />}
      {pBlue > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pBlue}%` }} className="bg-blue-500" title={`${blue} Neutral`} />}
      {pGreen > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pGreen}%` }} className="bg-success" title={`${green} Synergien`} />}
    </div>
  );
}
