
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Send, Mail } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold">R</div>
          <span className="text-xl font-semibold tracking-wide">ReachInbox</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-8">
          <Link to="/dashboard" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/dashboard/scheduled" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/dashboard/scheduled' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Mail size={20} />
            <span>Scheduled</span>
          </Link>
          <Link to="/dashboard/sent" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/dashboard/sent' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Send size={20} />
            <span>Sent</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
            <button onClick={logout} className="p-2 text-gray-400 hover:text-white transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
