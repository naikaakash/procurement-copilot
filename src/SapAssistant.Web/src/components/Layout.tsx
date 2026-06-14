import { Link, NavLink, Outlet } from "react-router-dom";
import { startSignOut } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { ChatWidget } from "./ChatWidget";

export function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link to="/" className="font-bold text-lg tracking-tight">
            sap-assistant
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm">
              <NavLink to="/files" className={navClass}>Files</NavLink>
              <NavLink to="/contest" className={navClass}>Contest</NavLink>
              <NavLink to="/chat" className={navClass}>Chat</NavLink>
            </nav>
          )}
          <div className="ml-auto flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-slate-600">
                  {user.name ?? user.email}
                </span>
                <button
                  onClick={startSignOut}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {user && <ChatWidget />}
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? "text-blue-600 font-medium"
    : "text-slate-600 hover:text-slate-900";
}
