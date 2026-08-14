import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const HeatmapCell = React.memo(function HeatmapCell({
  rowReq, cat, impact,
  isActive, isExactlyHovered, showOnlyGT, matrixCellSize,
  onMouseEnter, onMouseLeave, onClick, dataTour
}: any) {
  const isEvaluated = impact.status !== 'gray' || (impact.reasoning && impact.reasoning !== 'Noch nicht bewertet.');

  let bgColor = "bg-card border-card-border/50 text-muted"
  if (impact.status === 'red') bgColor = "bg-danger/20 border-danger/50 text-danger"
  else if (impact.status === 'orange') bgColor = "bg-warning/20 border-warning/50 text-warning"
  else if (impact.status === 'green') bgColor = "bg-success/20 border-success/50 text-success"
  else if (isEvaluated) bgColor = "bg-muted/20 border-muted/30 text-muted"

  if (showOnlyGT && !impact.is_ground_truth) {
    bgColor = "bg-card/30 border-card-border/20 text-muted/30 opacity-40 grayscale"
  }

  return (
    <div
      data-tour={dataTour}
      data-row-uid={rowReq.uid}
      data-col-name={cat.name}
      data-status={impact.status}
      className={cn(
        "heatmap-cell relative flex shrink-0 items-center justify-center rounded-lg border transition-colors duration-75 cursor-pointer z-0",
        bgColor,
        isActive ? "cell-active ring-2 ring-primary ring-offset-2 ring-offset-background z-10 scale-105 shadow-2xl" : "",
        isExactlyHovered && !isActive ? "cell-hovered scale-105 shadow-lg ring-2 ring-primary/60 z-20" : ""
      )}
      style={{ width: matrixCellSize, height: matrixCellSize }}
      onMouseEnter={() => onMouseEnter(rowReq, cat, impact)}
      onMouseLeave={() => onMouseLeave()}
      onClick={() => onClick(rowReq, cat, impact)}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {isEvaluated && (
          <div className={cn(
            "w-3 h-3 rounded-full bg-current shadow-[0_0_10px_currentColor] transition-transform duration-75",
            isActive ? "opacity-100 scale-110" : "opacity-100"
          )} />
        )}
        {!isEvaluated && (
          <span className={cn(
            "text-lg font-bold transition-opacity duration-75",
            isActive ? "opacity-80" : "opacity-30"
          )}>
            ?
          </span>
        )}
        {impact.is_ground_truth && (
          <div className="absolute -top-3 -right-3 text-success bg-background/80 rounded-full p-0.5 z-20">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  )
});
