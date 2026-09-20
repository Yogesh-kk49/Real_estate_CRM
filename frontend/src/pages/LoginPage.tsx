import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Lock, Mail, ShieldCheck, UserCheck, ArrowRight,
  Sparkles, Layers, CheckCircle2, Clock, Users, Shield, KeyRound,
  Eye, EyeOff, BarChart3, BookmarkCheck, PhoneCall, ShieldAlert,
  CalendarCheck, Award, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleOpenModal = (presetEmail?: string, presetPassword?: string) => {
    if (presetEmail && presetPassword) {
      setEmail(presetEmail);
      setPassword(presetPassword);
    }
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password.trim());
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: '7-Stage Lead Pipeline',
      description: 'Systematic progression from inquiry to booking with follow-up timers, urgency tags, and overdue touchpoint alerts.',
      badge: 'Sales Ops'
    },
    {
      icon: ShieldCheck,
      title: 'Concurrency-Guarded Booking',
      description: 'Database-level conditional locks prevent simultaneous double-booking of high-value inventory with conflict protection.',
      badge: 'Core Engine'
    },
    {
      icon: UserCheck,
      title: 'Consultant Recruitment & RBAC',
      description: 'Administrators onboard new sales consultants, set access permissions, and delegate prospect portfolios seamlessly.',
      badge: 'Access & Team'
    },
    {
      icon: Building2,
      title: 'Unit Matrix & INR Denomination',
      description: 'Visual inventory grid displaying floor levels, carpet areas, facing details, and pricing formatted in Crores (Cr) and Lakhs (L).',
      badge: 'Inventory'
    },
    {
      icon: PhoneCall,
      title: '360° Interaction Audit Trail',
      description: 'Unified client history timeline documenting phone conversations, site inspections, WhatsApp notes, and status changes.',
      badge: 'Customer 360'
    },
    {
      icon: BarChart3,
      title: 'Executive Sales Intelligence',
      description: 'Live KPI reporting highlighting active pipeline volume, confirmed revenue, conversion rates, and scheduled consultations.',
      badge: 'Analytics'
    },
  ];

  return (
    <div className="min-h-screen bg-estate-canvas text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navigation Bar with generous vertical breathing room */}
      <div className="pt-6 sm:pt-8 pb-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <nav className="bg-white rounded-2xl border border-estate-border shadow-xs px-5 sm:px-7 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-wider text-slate-900">ESTATEPULSE</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-800 font-extrabold border border-brand-200">
                  CRM OS
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-semibold">Real Estate Intelligence OS</p>
            </div>
          </div>


          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-800 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Production-Grade Architecture</span>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<KeyRound className="w-4 h-4" />}
              onClick={() => handleOpenModal()}
              className="shadow-sm shadow-brand-500/20 font-bold"
            >
              Sign In
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-between w-full">
        {/* Hero & Welcome Section */}
        <section className="text-center max-w-4xl mx-auto pt-2 pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border-2 border-brand-300 text-brand-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Enterprise Real Estate Operations & CRM
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.18]">
            Accelerate Property Sales, <br />
            <span className="text-brand-600">
              Protect Every Unit Transaction.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed">
            A high-velocity CRM platform engineered for luxury property developers, sales directors, and relationship managers.
            Centralize buyer leads, automate pipeline progression, and execute atomic, conflict-free property bookings.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto px-8 shadow-md shadow-brand-500/20 font-bold text-base"
            >
              Sign In to Workspace
            </Button>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Layers className="w-4 h-4 text-slate-700" />
              Explore Capabilities
            </a>
          </div>

          {/* Quick Metrics Strip with high-contrast text */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white border-2 border-estate-border p-4 rounded-xl text-left shadow-xs">
              <p className="text-2xl font-black text-slate-900 font-mono">4</p>
              <p className="text-xs text-slate-700 font-bold mt-1">Signature Projects</p>
            </div>
            <div className="bg-white border-2 border-estate-border p-4 rounded-xl text-left shadow-xs">
              <p className="text-2xl font-black text-slate-900 font-mono">24</p>
              <p className="text-xs text-slate-700 font-bold mt-1">Inventory Units Tracked</p>
            </div>
            <div className="bg-white border-2 border-estate-border p-4 rounded-xl text-left shadow-xs">
              <p className="text-2xl font-black text-emerald-700 font-mono">100%</p>
              <p className="text-xs text-slate-700 font-bold mt-1">Double-Booking Guard</p>
            </div>
            <div className="bg-white border-2 border-estate-border p-4 rounded-xl text-left shadow-xs">
              <p className="text-2xl font-black text-amber-700 font-mono">Strict</p>
              <p className="text-xs text-slate-700 font-bold mt-1">RBAC Data Isolation</p>
            </div>
          </div>
        </section>

        {/* Demo Credentials Reference Note Container */}
        <section className="mb-12 max-w-4xl mx-auto w-full">
          <div className="rounded-2xl bg-white border-2 border-amber-300 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Demo Evaluation Credentials Note
                    </h3>
                    <span className="text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      Ready to Test
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1 max-w-xl leading-relaxed">
                    For evaluating the application, pre-configured demo credentials are provided below for one Administrator and one Sales Consultant. Click either card to automatically open the Sign In modal with credentials loaded.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal('admin@coromandel.in', 'Admin@1234')}
                  className="text-xs font-bold bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100"
                >
                  Load Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal('meera@coromandel.in', 'Sales@1234')}
                  className="text-xs font-bold bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100"
                >
                  Load Staff
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5 pt-5 border-t border-slate-200">
              {/* Admin Note Card */}
              <div
                onClick={() => handleOpenModal('admin@coromandel.in', 'Admin@1234')}
                className="cursor-pointer group p-4 rounded-xl bg-slate-50 border-2 border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-700" /> 1. Administrator Account
                  </span>
                  <span className="text-xs text-amber-900 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 underline">
                    Sign In <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-slate-900">
                    <span className="text-slate-700 font-sans font-bold">Email:</span> <span className="font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">admin@coromandel.in</span>
                  </p>
                  <p className="text-slate-900">
                    <span className="text-slate-700 font-sans font-bold">Password:</span> <span className="font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">Admin@1234</span>
                  </p>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-2.5">
                  Full organizational oversight, staff recruitment, all lead assignments, and inventory control.
                </p>
              </div>

              {/* Staff Note Card */}
              <div
                onClick={() => handleOpenModal('meera@coromandel.in', 'Sales@1234')}
                className="cursor-pointer group p-4 rounded-xl bg-slate-50 border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" /> 2. Sales Staff (Consultant)
                  </span>
                  <span className="text-xs text-emerald-900 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 underline">
                    Sign In <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-slate-900">
                    <span className="text-slate-700 font-sans font-bold">Email:</span> <span className="font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">meera@coromandel.in</span>
                  </p>
                  <p className="text-slate-900">
                    <span className="text-slate-700 font-sans font-bold">Password:</span> <span className="font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">Sales@1234</span>
                  </p>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-2.5">
                  Scoped personal lead portfolio, customer interaction timeline, scheduled follow-ups, and unit bookings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features & Capabilities Showcase */}
        <section id="features" className="py-6 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Engineered for Real Estate Excellence
            </h2>
            <p className="text-sm text-slate-700 font-medium mt-2">
              Comprehensive architecture combining high-velocity sales workflows with strict transaction safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border-2 border-estate-border hover:border-slate-400 rounded-2xl p-6 transition-all hover:shadow-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-300 text-brand-700 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider bg-slate-200 px-2.5 py-1 rounded-md">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer with High-Contrast Dark Readable Text */}
      <footer className="border-t-2 border-estate-border bg-white py-6 text-center text-xs mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center">
          <p className="text-slate-900 font-bold tracking-wide">
            © 2026 EstatePulse • Production-Style Real Estate CRM.
          </p>

        </div>
      </footer>


      {/* Sign In Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isLoading) {
            setIsModalOpen(false);
            setErrorMessage(null);
          }
        }}
        title="Sign In to EstatePulse CRM"
        subtitle="Enter your registered work email and password to access your workspace"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Contextual Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-800">
              {errorMessage}
            </div>
          )}

          <Input
            label="Work or Gmail Address *"
            type="email"
            placeholder="e.g. admin@coromandel.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-700" />}
            required
            autoFocus
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10 text-slate-900 bg-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3 shadow-sm shadow-brand-500/20 font-bold"
            isLoading={isLoading}
          >
            Sign In to CRM
          </Button>

          {/* Helper reference inside modal */}
          <div className="mt-4 p-3.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
              <span>Demo Accounts Reference:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@coromandel.in');
                    setPassword('Admin@1234');
                    setErrorMessage(null);
                  }}
                  className="text-brand-700 hover:underline font-extrabold"
                >
                  Load Admin
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('meera@coromandel.in');
                    setPassword('Sales@1234');
                    setErrorMessage(null);
                  }}
                  className="text-brand-700 hover:underline font-extrabold"
                >
                  Load Staff
                </button>
              </div>
            </div>
            <div className="text-xs font-mono space-y-1 text-slate-800">
              <p>Admin: <span className="text-slate-950 font-bold">admin@coromandel.in</span> / <span className="text-slate-950 font-bold">Admin@1234</span></p>
              <p>Staff: <span className="text-slate-950 font-bold">meera@coromandel.in</span> / <span className="text-slate-950 font-bold">Sales@1234</span></p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
