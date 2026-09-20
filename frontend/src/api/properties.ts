import { apiClient } from './client';
import { Building, Project, Unit } from '../types';

export interface UnitFilterParams {
  project_id?: number;
  building_id?: number;
  unit_type?: string;
  availability?: string;
  search?: string;
}

export const propertiesApi = {
  getProjects: async (): Promise<Project[]> => {
    const res = await apiClient.get<Project[]>('/properties/projects');
    return res.data;
  },

  createProject: async (data: { name: string; location: string; description?: string; status?: string }): Promise<Project> => {
    const res = await apiClient.post<Project>('/properties/projects', data);
    return res.data;
  },

  createBuilding: async (data: { project_id: number; name: string; total_floors: number }): Promise<Building> => {
    const res = await apiClient.post<Building>('/properties/buildings', data);
    return res.data;
  },

  getUnits: async (params?: UnitFilterParams): Promise<Unit[]> => {
    const res = await apiClient.get<Unit[]>('/properties/units', { params });
    return res.data;
  },

  getUnitById: async (id: number): Promise<Unit> => {
    const res = await apiClient.get<Unit>(`/properties/units/${id}`);
    return res.data;
  },

  updateUnit: async (id: number, data: Partial<Unit>): Promise<Unit> => {
    const res = await apiClient.patch<Unit>(`/properties/units/${id}`, data);
    return res.data;
  },
};
