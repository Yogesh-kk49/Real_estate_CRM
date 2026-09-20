import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Shield, Award, Phone, Mail, UserX, UserCheck,
  Eye, EyeOff, Loader2, Search, X
} from 'lucide-react';
import { User, UserCreate } from '../types';
import { usersApi } from '../api/users';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/date';

// ─── Recruit Modal ────────────────────────────────────────────────────────────
interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const RecruitModal: React.FC<RecruitModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UserCreate>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'SALES_EMPLOYEE',
  });

  const handleChange = (field: keyof UserCreate, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await usersApi.createUser(form);
      showToast('success', `${newUser.full_name} has been recruited successfully!`);
      onSuccess(newUser);
      onClose();
      setForm({ full_name: '', email: '', password: '', phone: '', role: 'SALES_EMPLOYEE' });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setForm({ full_name: '', email: '', password: '', phone: '', role: 'SALES_EMPLOYEE' });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recruit Sales Staff (Consultant)"
      subtitle="Register a new sales consultant with work email, password, and mobile number."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <Input
          label="Full Name *"
          placeholder="e.g. Priya Venkataraman"
          value={form.full_name}
          onChange={e => handleChange('full_name', e.target.value)}
          required
        />

        <Input
          label="Work Email (Gmail or company) *"
          type="email"
          placeholder="e.g. priya.v@coromandel.in"
          value={form.email}
          onChange={e => handleChange('email', e.target.value)}
          icon={<Mail className="w-4 h-4 text-slate-700" />}
          required
        />

        <Input
          label="Mobile Number *"
          type="tel"
          placeholder="e.g. +91 98400 00001"
          value={form.phone}
          onChange={e => handleChange('phone', e.target.value)}
          icon={<Phone className="w-4 h-4 text-slate-700" />}
          required
        />

        {/* Password field with show/hide toggle */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-800">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10 text-slate-900 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">Initial access password for this employee.</p>
        </div>

        {/* Fixed Role Notice: Sales Staff Only */}
        <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
          <Award className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-black text-emerald-950 block">
              Designated Role: Sales Consultant (Staff)
            </span>
            <p className="text-[11px] text-emerald-900 font-medium mt-0.5 leading-relaxed">
              This staff member will have scoped CRM access to manage assigned leads, log customer interactions, and book available property units.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1 font-semibold" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 font-bold" isLoading={isLoading}>
            Recruit Sales Staff
          </Button>
        </div>
      </form>
    </Modal>
  );
};


// ─── Main TeamPage ────────────────────────────────────────────────────────────
export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getAllUsers();
      setUsers(data);
    } catch {
      showToast('error', 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleActive = async (user: User) => {
    setTogglingId(user.id);
    try {
      const updated = await usersApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      showToast(
        updated.is_active ? 'success' : 'warning',
        `${updated.full_name} has been ${updated.is_active ? 'reactivated' : 'deactivated'}.`
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update account.');
    } finally {
      setTogglingId(null);
      setConfirmToggle(null);
    }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  );

  const adminCount = users.filter(u => u.role === 'ADMIN' && u.is_active).length;
  const salesCount = users.filter(u => u.role === 'SALES_EMPLOYEE' && u.is_active).length;
  const totalLeads = users.reduce((s, u) => s + (u.leads_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-xs text-slate-700 font-medium mt-1">Recruit sales consultants and manage staff accounts.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowRecruitModal(true)}
          className="font-bold shadow-sm shadow-brand-500/20"
        >
          Recruit Sales Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Admin Accounts', value: adminCount, icon: Shield, color: 'text-amber-700 bg-amber-100 border border-amber-200' },
          { label: 'Sales Consultants', value: salesCount, icon: Award, color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' },
          { label: 'Total Leads Handled', value: totalLeads, icon: Users, color: 'text-blue-700 bg-blue-100 border border-blue-200' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-4 rounded-xl border border-estate-border shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{stat.value}</p>
                  <p className="text-xs text-slate-700 font-bold">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {/* Search + Table */}
      <div className="bg-white rounded-2xl border border-estate-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-estate-border flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">{filtered.length} members</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading team…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No team members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-estate-border bg-slate-50">
                  {['Member', 'Contact', 'Role', 'Leads Assigned', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => {
                  const isMe = u.id === currentUser?.id;
                  const isToggling = togglingId === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {u.full_name}
                              {isMe && <span className="ml-1.5 text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded">(You)</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />{u.email}
                          </p>
                          {u.phone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />{u.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Award className="w-3 h-3" /> Sales
                          </span>
                        )}
                      </td>

                      {/* Leads */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700 font-mono">{u.leads_count ?? 0}</span>
                        <span className="text-xs text-slate-400 ml-1">leads</span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {!isMe ? (
                          <button
                            onClick={() => setConfirmToggle(u)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                              u.is_active
                                ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                                : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_active ? (
                              <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Reactivate</>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Your account</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recruit Modal */}
      <RecruitModal
        isOpen={showRecruitModal}
        onClose={() => setShowRecruitModal(false)}
        onSuccess={newUser => setUsers(prev => [newUser, ...prev])}
      />

      {/* Deactivate / Reactivate Confirm Dialog */}
      {confirmToggle && (
        <ConfirmDialog
          isOpen={!!confirmToggle}
          title={confirmToggle.is_active ? 'Deactivate Account' : 'Reactivate Account'}
          message={
            confirmToggle.is_active
              ? `Deactivating ${confirmToggle.full_name}'s account will prevent them from logging in. Their existing leads and bookings will remain intact.`
              : `Reactivating ${confirmToggle.full_name}'s account will restore their full access to the CRM.`
          }
          confirmText={confirmToggle.is_active ? 'Yes, Deactivate' : 'Yes, Reactivate'}
          isDangerous={confirmToggle.is_active}
          onConfirm={() => handleToggleActive(confirmToggle)}
          onClose={() => setConfirmToggle(null)}
        />
      )}
    </div>
  );
};
