import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-estate-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-brand-500 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-950 font-mono tracking-tight">404</h1>
      <h2 className="text-base font-bold text-slate-800 mt-2">The page you're looking for doesn't exist.</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The requested URL may have moved or been decommissioned. Please return to the CRM dashboard.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
