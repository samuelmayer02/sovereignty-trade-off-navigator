import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MatrixCell = React.memo(function MatrixCell({
  rowReq, colReq, conflict, isSelf, isBelowDiagonal,
  isActive, isExactlyHovered, isAccepted, showOnlyGT, matrixCellSize,
  onMouseEnter, onMouseLeave, onClick
}: any) {
  let bgColor = "bg-card"
  if (!isSelf) {
    if (conflict.status === 'red') bgColor = "bg-danger/20 border-danger/50 text-danger"
    else if (conflict.status === 'orange') bgColor = "bg-warning/20 border-warning/50 text-warning"
    else if (conflict.status === 'blue') bgColor = "bg-blue-500/20 border-blue-500/50 text-blue-500"
    else if (conflict.status === 'gray') bgColor = "bg-card border-card-border/50 text-muted"
    else bgColor = "bg-success/10 border-success/30 text-success"

    if (showOnlyGT && !conflict.is_ground_truth) {
      bgColor = "bg-card/30 border-card-border/20 text-muted/30 opacity-40 grayscale"
    }
  } else {
    bgColor = "bg-card-border opacity-30"
  }

  return (
    <div
      data-row-uid={rowReq.uid}
      data-col-uid={colReq.uid}
      data-status={conflict.status}
      data-below={isBelowDiagonal ? "true" : "false"}
      className={cn(
        "matrix-cell relative flex shrink-0 items-center justify-center rounded-lg border transition-colors duration-75",
        bgColor,
        !isSelf ? "z-0 cursor-pointer" : "pointer-events-none z-0",
        isActive ? "cell-active ring-2 ring-primary ring-offset-2 ring-offset-background z-10 scale-105 shadow-2xl opacity-100" : "",
        isExactlyHovered && !isActive && !isSelf ? "cell-hovered scale-105 shadow-lg ring-2 ring-primary/60 z-20 opacity-100" : "",
        isBelowDiagonal && !isActive && !isExactlyHovered ? "opacity-[0.12] grayscale-[40%]" : ""
      )}
      style={{ width: matrixCellSize, height: matrixCellSize }}
      onMouseEnter={() => {
        if (!isSelf) onMouseEnter(rowReq, colReq, conflict)
      }}
      onMouseLeave={() => {
        onMouseLeave()
      }}
      onClick={() => {
        if (!isSelf) onClick(rowReq, colReq, conflict)
      }}
    >
      {!isSelf && conflict.status !== 'green' && (
        <div className={cn(
          "relative flex items-center justify-center rounded-full transition-transform duration-75",
          conflict.status === 'gray' ? "" : "w-3 h-3 bg-current shadow-[0_0_10px_currentColor]",
          isActive ? "opacity-100 scale-110" : "opacity-100"
        )}>
          {isAccepted ? (
            <div className="absolute z-10 flex items-center justify-center text-foreground" style={{ transform: "scale(1.8)" }}>
              <ShieldCheck className="w-4 h-4 opacity-90 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]" />
            </div>
          ) : conflict.status === 'gray' ? (
            <span className={cn(
              "text-lg font-bold transition-opacity duration-75",
              isActive ? "opacity-80" : "opacity-30"
            )}>
              ?
            </span>
          ) : null}
          {conflict.is_ground_truth && (
            <div className="absolute -right-3 -top-3 z-20 rounded-full bg-background/80 p-0.5 text-success">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>
      )}
    </div>
  )
});
