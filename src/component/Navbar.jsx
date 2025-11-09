import React from "react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-slate-900 sm:text-xl">
            Salafeni
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Simulations personnalisées
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <a
            className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-600 transition hover:bg-indigo-100"
            href="#simulation"
          >
            Simuler
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
