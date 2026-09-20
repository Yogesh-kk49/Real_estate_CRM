import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, BookmarkCheck, Shield, Award, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
    { label: 'Leads & Pipeline', path: '/leads', icon: Users },
    { label: 'Property Inventory', path: '/properties', icon: Building2 },
    { label: 'Confirmed Bookings', path: '/bookings', icon: BookmarkCheck },
  ];

  const adminItems = [
    { label: 'Team Management', path: '/team', icon: UserCog },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
    }`;

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-white tracking-wider">ESTATEPULSE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">CRM</span>
          </div>
          <p className="text-[10px] text-slate-300 tracking-wide uppercase font-semibold">Real Estate CRM OS</p>
        </div>
      </div>


      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-extrabold text-slate-300 uppercase tracking-widest mb-2">Operations</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              end={item.end}
              className={linkClass}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Admin-only Administration section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[11px] font-extrabold text-slate-300 uppercase tracking-widest">Administration</p>
            </div>

            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={linkClass}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </div>

      {/* User / Persona Info Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isAdmin ? (
                <span className="inline-flex items-center text-[10px] font-bold text-amber-400 gap-0.5">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 gap-0.5">
                  <Award className="w-3 h-3" /> Sales Consultant
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
