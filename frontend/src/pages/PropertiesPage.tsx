import React, { useState, useEffect } from 'react';
import {
  Building2, Home, Layers, MapPin, CheckCircle, Plus,
  Search, Filter, BookmarkCheck, ArrowRight
} from 'lucide-react';
import { Building, Project, Unit, UnitAvailability, UnitType } from '../types';
import { propertiesApi } from '../api/properties';
import { formatIndianCurrency, formatFullINR } from '../utils/currency';
import { AvailabilityBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { BookingModal } from '../components/bookings/BookingModal';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';

export const PropertiesPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [unitTypeFilter, setUnitTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [unitSearch, setUnitSearch] = useState('');

  // Booking modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingUnit, setBookingUnit] = useState<Unit | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await propertiesApi.getProjects();
      setProjects(data);
      if (data.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const data = await propertiesApi.getUnits({
        project_id: selectedProjectId || undefined,
        unit_type: unitTypeFilter !== 'All' ? unitTypeFilter : undefined,
        availability: availabilityFilter !== 'All' ? availabilityFilter : undefined,
        search: unitSearch.trim() || undefined,
      });
      setUnits(data);
    } catch (err) {
      console.error('Failed to load units', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId !== null) {
      fetchUnits();
    }
  }, [selectedProjectId, unitTypeFilter, availabilityFilter, unitSearch]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Real Estate Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hierarchy: Project → Building → Property Units. Real-time availability and atomic double-booking lock.
          </p>
        </div>
      </div>

      {/* Project Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          return (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl border text-xs text-left transition-all ${
                isSelected
                  ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500'
                  : 'bg-white/70 hover:bg-white border-estate-border text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className={`font-bold ${isSelected ? 'text-slate-950' : 'text-slate-800'}`}>
                  {proj.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{proj.location}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
                <span className="text-emerald-700 font-bold">{proj.available_units_count} Available</span>
                <span>•</span>
                <span className="text-slate-500">{proj.total_units_count} Total</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Project Overview Card */}
      {activeProject && (
        <div className="bg-white rounded-2xl border border-estate-border shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {activeProject.hero_image && (
              <div className="h-48 md:h-full relative overflow-hidden bg-slate-100">
                <img
                  src={activeProject.hero_image}
                  alt={activeProject.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-4">
                  <span className="text-xs font-semibold text-white bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {activeProject.status}
                  </span>
                </div>
              </div>
            )}
            <div className="p-6 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>{activeProject.location}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{activeProject.name}</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{activeProject.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Buildings</span>
                  <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{activeProject.buildings_count}</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Available Units</span>
                  <p className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">{activeProject.available_units_count}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Booked Units</span>
                  <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{activeProject.booked_units_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-estate-border shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search unit (e.g. A-1402)..."
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Unit Type */}
          <select
            value={unitTypeFilter}
            onChange={(e) => setUnitTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="All">All Unit Types</option>
            <option value="2BHK">2 BHK</option>
            <option value="3BHK">3 BHK</option>
            <option value="4BHK">4 BHK</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Villa">Villa</option>
          </select>

          {/* Availability */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Booked">Booked</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing <strong>{units.length}</strong> units in project
        </span>
      </div>

      {/* Unit Inventory Grid */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : units.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No property units found"
          description="There are no units matching your search criteria in this project."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {units.map((u) => {
            const isAvailable = u.availability === 'Available';
            const isBooked = u.availability === 'Booked';

            return (
              <div
                key={u.id}
                className={`bg-white rounded-xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                  isAvailable
                    ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                    : isBooked
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : 'border-amber-200'
                }`}
              >
                <div>
                  {/* Top Bar: Unit Number + Availability Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                      Unit {u.unit_number}
                    </span>
                    <AvailabilityBadge status={u.availability} />
                  </div>

                  {/* Building & Floor */}
                  <p className="text-xs font-semibold text-slate-700 truncate">{u.building_name}</p>
                  <p className="text-[11px] text-slate-500">Floor {u.floor} • Facing {u.facing || 'East'}</p>

                  {/* Specs & Sq.ft */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Config</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{u.unit_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Super Built-up</span>
                      <span className="font-bold font-mono text-slate-800 mt-0.5 block">{u.super_builtup_sqft} sq.ft</span>
                    </div>
                  </div>
                </div>

                {/* Price & Booking Trigger */}
                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">List Price</span>
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      {formatIndianCurrency(u.price)}
                    </span>
                  </div>

                  {isAvailable ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<BookmarkCheck className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setBookingUnit(u);
                        setIsBookingModalOpen(true);
                      }}
                    >
                      Book Unit
                    </Button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {u.availability}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingUnit(null);
        }}
        preselectedUnit={bookingUnit}
        onSuccess={() => {
          fetchUnits();
          fetchProjects();
        }}
      />
    </div>
  );
};
