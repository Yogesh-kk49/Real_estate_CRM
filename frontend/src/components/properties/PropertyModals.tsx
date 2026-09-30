import React, { useState, useEffect } from 'react';
import { Project, Building, UnitType, UnitAvailability } from '../../types';
import { propertiesApi } from '../../api/properties';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

// ─── Create Project Modal ───────────────────────────────────────────────────
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Under Construction');
  const [completionYear, setCompletionYear] = useState<number>(new Date().getFullYear() + 2);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      setError('Please provide project name and location.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await propertiesApi.createProject({
        name: name.trim(),
        location: location.trim(),
        status,
        completion_year: Number(completionYear) || undefined,
        description: description.trim() || undefined,
      });
      showToast('success', `Project '${name.trim()}' has been created successfully.`);
      onSuccess();
      onClose();
      setName('');
      setLocation('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setError(null);
          onClose();
        }
      }}
      title="Add New Real Estate Project"
      subtitle="Define a new residential or luxury development in your portfolio."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <Input
          label="Project Name *"
          placeholder="e.g. Marina Horizon Towers"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Location (City / Area) *"
          placeholder="e.g. Boat Club Road, RA Puram, Chennai"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Development Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="Under Construction">Under Construction</option>
              <option value="Ready to Move">Ready to Move</option>
              <option value="Pre-Launch">Pre-Launch</option>
            </select>
          </div>

          <Input
            label="Estimated Completion Year"
            type="number"
            min={2020}
            max={2035}
            value={completionYear}
            onChange={(e) => setCompletionYear(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-800">Project Description</label>
          <textarea
            rows={3}
            placeholder="Brief overview of amenities, positioning, and architectural highlights..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};


// ─── Create Building Modal ──────────────────────────────────────────────────
interface CreateBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
  defaultProjectId?: number;
}

export const CreateBuildingModal: React.FC<CreateBuildingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
  defaultProjectId,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<number>(defaultProjectId || projects[0]?.id || 0);
  const [name, setName] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(10);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) {
      setError('Please provide building name and select a project.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await propertiesApi.createBuilding({
        project_id: projectId,
        name: name.trim(),
        total_floors: Number(totalFloors) || 10,
      });
      showToast('success', `Building '${name.trim()}' added to project successfully.`);
      onSuccess();
      onClose();
      setName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create building.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setError(null);
          onClose();
        }
      }}
      title="Add Building / Wing / Tower"
      subtitle="Add a new residential block to an existing project."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-800">Target Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            required
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.location})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Building / Tower Name *"
          placeholder="e.g. Tower B - Azure Crest"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Total Floors *"
          type="number"
          min={1}
          max={100}
          value={totalFloors}
          onChange={(e) => setTotalFloors(Number(e.target.value))}
          required
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Add Building
          </Button>
        </div>
      </form>
    </Modal>
  );
};


// ─── Create Unit Modal ──────────────────────────────────────────────────────
interface CreateUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
  defaultProjectId?: number;
}

export const CreateUnitModal: React.FC<CreateUnitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
  defaultProjectId,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<number>(defaultProjectId || projects[0]?.id || 0);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState<number>(0);

  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState<string>('3BHK');
  const [floor, setFloor] = useState<number>(1);
  const [superBuiltupSqft, setSuperBuiltupSqft] = useState<number>(1850);
  const [carpetSqft, setCarpetSqft] = useState<number>(1420);
  const [facing, setFacing] = useState('East');
  const [price, setPrice] = useState<number>(18500000);
  const [availability, setAvailability] = useState('Available');

  // Load buildings whenever project changes
  useEffect(() => {
    if (projectId) {
      propertiesApi.getBuildings(projectId).then((data) => {
        setBuildings(data);
        if (data.length > 0) {
          setBuildingId(data[0].id);
        } else {
          setBuildingId(0);
        }
      }).catch(console.error);
    }
  }, [projectId]);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim() || !buildingId) {
      setError('Please provide unit number and select a building.');
      return;
    }
    if (price <= 0 || superBuiltupSqft <= 0) {
      setError('Price and Super Built-up area must be positive numbers.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await propertiesApi.createUnit({
        building_id: buildingId,
        unit_number: unitNumber.trim(),
        unit_type: unitType,
        floor: Number(floor),
        super_builtup_sqft: Number(superBuiltupSqft),
        carpet_sqft: Number(carpetSqft) || undefined,
        facing,
        price: Number(price),
        availability,
      });
      showToast('success', `Unit '${unitNumber.trim()}' added to inventory.`);
      onSuccess();
      onClose();
      setUnitNumber('');
    } catch (err: any) {
      setError(err.message || 'Failed to create unit.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setError(null);
          onClose();
        }
      }}
      title="Add Inventory Unit"
      subtitle="Register a new property unit for marketing and booking allocation."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        {/* Project & Building Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Building / Tower *</label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(Number(e.target.value))}
              required
              disabled={buildings.length === 0}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              {buildings.length === 0 ? (
                <option value={0}>No buildings in project (Create one first)</option>
              ) : (
                buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.total_floors} Floors)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Unit Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Unit Number *"
            placeholder="e.g. A-1204"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Unit Type *</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="1BHK">1BHK</option>
              <option value="2BHK">2BHK</option>
              <option value="3BHK">3BHK</option>
              <option value="4BHK">4BHK</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Villa">Villa</option>
            </select>
          </div>

          <Input
            label="Floor Number *"
            type="number"
            min={0}
            max={100}
            value={floor}
            onChange={(e) => setFloor(Number(e.target.value))}
            required
          />
        </div>

        {/* Area & Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Super Built-up Area (Sq.Ft) *"
            type="number"
            min={100}
            value={superBuiltupSqft}
            onChange={(e) => setSuperBuiltupSqft(Number(e.target.value))}
            required
          />

          <Input
            label="Carpet Area (Sq.Ft)"
            type="number"
            min={50}
            value={carpetSqft}
            onChange={(e) => setCarpetSqft(Number(e.target.value))}
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Facing Direction</label>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="East">East</option>
              <option value="North">North</option>
              <option value="West">West</option>
              <option value="South">South</option>
              <option value="North-East">North-East</option>
              <option value="Sea Facing">Sea Facing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Pricing (INR) *"
            type="number"
            min={100000}
            step={100000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">Initial Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={buildings.length === 0}
          >
            Create Unit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
