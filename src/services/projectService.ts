import type {
    CreateProjectRequest,
    Project,
    UpdateProjectRequest,
} from "../types";
import apiClient from "./api";

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>("/projects");
    return response.data;
  },

  // Get a single project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  // Create a new project
  create: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post<Project>("/projects", data);
    return response.data;
  },

  // Update an existing project
  update: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  // Delete a project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
