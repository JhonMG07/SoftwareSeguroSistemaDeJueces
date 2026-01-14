"use client"

import { Gavel } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";

interface ClientNavbarProps {
  displayName: string;
}

export function ClientNavbar({ displayName }: ClientNavbarProps) {
  return (
    <header className="border-b bg-white dark:bg-slate-950 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-slate-800 dark:text-slate-200" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Sistema de Gestión
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Suprema Corte de Justicia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {displayName}
            </span>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
