import React, { useState } from 'react';
import { Menu, LogOut, RefreshCw, UserCheck, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user, isAdmin, logout, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-estate-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side: Hamburger (mobile) + Breadcrumb/Context */}
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

      {/* Right side: Quick Persona Switcher (For Interviewer Demo) & Sign out */}
      <div className="flex items-center gap-3">
        {/* Instant Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-md transition-all shadow-xs"
            title="Switch user persona to test RBAC permissions"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin-reverse" />
            <span className="hidden md:inline">Test Persona:</span>
            <span className="font-bold underline decoration-amber-400">{user?.full_name?.split(' ')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
          </button>

          {showPersonaMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowPersonaMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Account (RBAC)
                </div>

                <button
                  onClick={() => {
                    switchPersona('admin');
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    isAdmin ? 'bg-amber-50/80 font-bold text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-semibold">Karthik Ramaswamy</p>
                    <p className="text-[10px] text-slate-500">Admin (All Leads & Management)</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchPersona('sales_1');
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    !isAdmin && user?.email === 'meera@coromandel.in'
                      ? 'bg-emerald-50/80 font-bold text-emerald-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Meera Krishnan</p>
                    <p className="text-[10px] text-slate-500">Sales Consultant (Assigned Leads)</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchPersona('sales_2');
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    !isAdmin && user?.email === 'anand@coromandel.in'
                      ? 'bg-emerald-50/80 font-bold text-emerald-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Anand Swaminathan</p>
                    <p className="text-[10px] text-slate-500">Sales Consultant (Assigned Leads)</p>
                  </div>
                </button>
              </div>
            </>
          )}
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

