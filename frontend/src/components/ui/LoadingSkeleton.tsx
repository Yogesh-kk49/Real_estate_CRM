import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-estate-border p-5 animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-estate-border overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-6">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 flex items-center px-6 gap-6">
            <div className="h-4 w-36 bg-slate-100 rounded"></div>
            <div className="h-4 w-24 bg-slate-100 rounded"></div>
            <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
            <div className="h-4 w-28 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
