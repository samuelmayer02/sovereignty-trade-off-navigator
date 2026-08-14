'use client';

import { useState } from 'react';
import { isStaticMode } from '@/lib/api-client';
import { AlertCircle, X, Info } from 'lucide-react';

export default function StaticModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!isStaticMode || dismissed) {
    return null;
  }

  return (
    <aside aria-label="Demo-Modus Status" className="bg-primary/10 border-b border-primary/20 text-foreground px-4 py-2 text-xs transition-all relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/20 text-primary shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="leading-snug text-muted">
            <strong className="text-foreground font-semibold">Demo-Modus (GitHub Pages):</strong> Der 7-Schritte-Navigator ist vollständig interaktiv nutzbar. Schreibende Operationen in den Admin-Editoren sind im statischen Hosting deaktiviert (Read-Only). Für die Bearbeitung der Datenbasis bitte die lokale Docker-/Node-Umgebung starten.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-muted/10 transition-colors shrink-0"
          title="Hinweis ausblenden"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
