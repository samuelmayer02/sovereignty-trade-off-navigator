'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { isStaticMode } from '@/lib/api-client';

interface EditorNavProps {
  activeTab: 'requirements' | 'conflicts' | 'groups' | 'categories' | 'trees' | 'scenarios';
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  saveMessage?: string;
  onNavigate?: (e: React.MouseEvent, href: string) => void;
  extraContent?: ReactNode;
}

export default function EditorNav({
  activeTab,
  onSave,
  isSaving,
  isDirty,
  saveMessage,
  onNavigate,
  extraContent
}: EditorNavProps) {
  const tabs = [
    { id: 'groups', label: 'Dimensionen', href: '/editor/groups' },
    { id: 'requirements', label: 'Architektur-Optionen', href: '/editor' },
    { id: 'conflicts', label: 'Konflikt-Matrix', href: '/editor/conflicts' },
    { id: 'trees', label: 'Bäume', href: '/editor/trees' },
    { id: 'scenarios', label: 'Szenarien', href: '/editor/scenarios' },
  ];

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (onNavigate) {
      onNavigate(e, href);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-card-border bg-card z-10 shrink-0">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            onClick={e => handleLinkClick(e, '/')}
            className="text-muted hover:text-foreground transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Zurück</span>
          </Link>
          <div className="h-6 w-px bg-card-border"></div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold whitespace-nowrap">Admin Editor</h1>
            {isStaticMode && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                Demo (Read-Only)
              </span>
            )}
          </div>
        </div>

        <nav className="flex space-x-1 bg-background border border-card-border p-1 rounded-xl overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={e => handleLinkClick(e, tab.href)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-card-border"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {extraContent}
        <ThemeToggle />
        {saveMessage && <span className="text-sm text-primary animate-pulse hidden md:inline">{saveMessage}</span>}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isStaticMode || isSaving || (isDirty === false)}
            title={isStaticMode ? "Speichern ist im statischen Demo-Deployment (GitHub Pages) deaktiviert." : undefined}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg",
              isStaticMode
                ? "bg-muted/20 text-muted border border-card-border cursor-not-allowed opacity-75"
                : "bg-primary hover:bg-primary/80 text-white disabled:opacity-50 shadow-primary/20"
            )}
          >
            {isStaticMode ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isStaticMode ? 'Schreibgeschützt' : (isSaving ? 'Speichert...' : 'Speichern')}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
