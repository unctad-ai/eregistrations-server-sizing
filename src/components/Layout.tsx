import { Outlet, Link } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            eRegistrations Server Sizing
          </Link>
          <nav className="text-sm text-slate-600 space-x-4">
            <Link to="/about" className="hover:text-slate-900">About</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 text-center text-xs text-slate-500 py-4">
        Anchored to live measurements from operational eRegistrations deployments.
      </footer>
    </div>
  );
}
