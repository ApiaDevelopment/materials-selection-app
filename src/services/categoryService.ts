import type {
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from "../types";
import apiClient from "./api";

export const categoryService = {
  // Get all categories for a project
  getByProjectId: async (projectId: string): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(
      `/projects/${projectId}/categories`,
    );
    return response.data;
  },

  // Get a single category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Create a new category
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data);
    return response.data;
  },

  // Update an existing category
  update: async (
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  // Delete a category
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
