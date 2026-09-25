"use client";

import { MenuIcon, SearchIcon } from "./icons";

export default function Header({ user, searchValue, onSearchChange, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </button>

        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search study sessions</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search topics, subjects, or sessions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </label>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white">
            {user.initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
