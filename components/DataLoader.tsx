'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function DataLoader() {
  const fetchInitialData = useStore((state) => state.fetchInitialData);

  useEffect(() => {
    console.log('DataLoader: Mounting and triggering fetchInitialData');
    fetchInitialData();
  }, [fetchInitialData]);

  return null;
}
