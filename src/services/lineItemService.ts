import type {
    CreateLineItemRequest,
    LineItem,
    UpdateLineItemRequest,
} from "../types";
import apiClient from "./api";

export const lineItemService = {
  // Get all line items for a category
  getByCategoryId: async (categoryId: string): Promise<LineItem[]> => {
    const response = await apiClient.get<LineItem[]>(
      `/categories/${categoryId}/lineitems`,
    );
    return response.data;
  },

  // Get all line items for a project
  getByProjectId: async (projectId: string): Promise<LineItem[]> => {
    const response = await apiClient.get<LineItem[]>(
      `/projects/${projectId}/lineitems`,
    );
    return response.data;
  },

  // Get a single line item by ID
  getById: async (id: string): Promise<LineItem> => {
    const response = await apiClient.get<LineItem>(`/lineitems/${id}`);
    return response.data;
  },

  // Create a new line item
  create: async (data: CreateLineItemRequest): Promise<LineItem> => {
    const response = await apiClient.post<LineItem>("/lineitems", data);
    return response.data;
  },

  // Update an existing line item
  update: async (
    id: string,
    data: UpdateLineItemRequest,
  ): Promise<LineItem> => {
    const response = await apiClient.put<LineItem>(`/lineitems/${id}`, data);
    return response.data;
  },

  // Delete a line item
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lineitems/${id}`);
  },
};
