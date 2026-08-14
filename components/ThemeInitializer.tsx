"use client"

import { useServerInsertedHTML } from 'next/navigation'

export function ThemeInitializer() {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            const storage = localStorage.getItem('sovereignty-navigator-storage');
            const state = storage ? JSON.parse(storage) : null;
            const theme = state?.state?.theme || 'light';
            document.documentElement.setAttribute('data-theme', theme);
          } catch (e) {}
        `,
      }}
    />
  ))

  return null
}
