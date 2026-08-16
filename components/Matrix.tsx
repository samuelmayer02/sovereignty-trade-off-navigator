import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ReqMatrix } from './matrix-view';

export { ReqMatrix };
export * from './matrix-view';

export default function Matrix({ 
  activeRequirements, 
  combinedReqs,
  showOnlyGT = false,
  isFullscreen = false,
  toggleFullscreen
}: { 
  activeRequirements?: any[], 
  combinedReqs?: Record<string, number>,
  activeTab?: string,
  showOnlyGT?: boolean,
  isFullscreen?: boolean,
  toggleFullscreen?: () => void
}) {
  const { requirements: allReqs, selectedRequirements, updateRoutedPriority } = useStore();

  const effectiveCombined = combinedReqs || selectedRequirements;
  const activeReqs = activeRequirements || allReqs.filter(r => selectedRequirements[r.uid] !== undefined);

  const handleSetPriority = (uid: string, val: number) => {
    updateRoutedPriority(uid, val);
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col transition-all duration-500 rounded-3xl"
      )}
    >
      <div className={cn(
        "flex-1 overflow-hidden transition-all duration-500 rounded-3xl"
      )}>
        <ReqMatrix
          activeReqs={activeReqs}
          effectiveCombined={effectiveCombined}
          handleSetPriority={handleSetPriority}
          isFullscreen={isFullscreen}
          showOnlyGT={showOnlyGT}
        />
      </div>
    </div>
  );
}
