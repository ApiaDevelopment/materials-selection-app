import type {
    CreateProjectRequest,
    Project,
    UpdateProjectRequest,
} from "../types";
import apiClient from "./api";

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<{ projects: Project[] }>("/projects");
    return response.data.projects;
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

  // Get project files from SharePoint
  getFiles: async (id: string): Promise<{ files: any[] }> => {
    const response = await apiClient.get<{ files: any[] }>(
      `/projects/${id}/files`,
    );
    return response.data;
  },

  // Upload file to project SharePoint folder
  uploadFile: async (
    id: string,
    fileName: string,
    fileContent: string,
  ): Promise<any> => {
    const response = await apiClient.post(`/projects/${id}/files/upload`, {
      fileName,
      fileContent,
    });
    return response.data;
  },
  // Delete file from project SharePoint folder
  deleteFile: async (id: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/files/${fileId}`);
  },
};
