import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-estate-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side: Hamburger (mobile) + Region Badge */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Region:</span>
          <span className="inline-flex items-center text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            📍 Chennai Prime Portfolio
          </span>
        </div>
      </div>

      {/* Right side: User info + Logout */}
      <div className="flex items-center gap-3">
        {/* Logged-in user pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
          <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-extrabold flex items-center justify-center">
            {user?.full_name?.charAt(0).toUpperCase()}
          </span>
          <span className="text-xs font-bold text-slate-800">{user?.full_name?.split(' ')[0]}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            user?.role === 'ADMIN'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {user?.role === 'ADMIN' ? 'Admin' : 'Sales'}
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          title="Sign out of system"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Professional Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Sign Out of EstatePulse CRM"
        message="Are you sure you want to end your current session? You will be securely signed out and will need your work credentials to access lead pipelines and inventory allocation again."
        confirmText="Yes, Sign Out"
        cancelText="Stay Signed In"
        isDangerous={true}
      />
    </header>
  );
};
