import axios from "axios";
import type { Order, OrderItem, Receipt } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://fiad7hd58j.execute-api.us-east-1.amazonaws.com";

export const orderService = {
  getByProjectId: async (projectId: string): Promise<Order[]> => {
    const response = await axios.get<Order[]>(
      `${API_URL}/projects/${projectId}/orders`,
    );
    return response.data;
  },

  create: async (
    order: Omit<Order, "id" | "createdAt" | "updatedAt">,
  ): Promise<Order> => {
    const response = await axios.post<Order>(`${API_URL}/orders`, order);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await axios.put<Order>(`${API_URL}/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/orders/${id}`);
  },

  // OrderItems
  getOrderItems: async (orderId: string): Promise<OrderItem[]> => {
    const response = await axios.get<OrderItem[]>(
      `${API_URL}/orders/${orderId}/items`,
    );
    return response.data;
  },

  getOrderItemsByProject: async (projectId: string): Promise<OrderItem[]> => {
    const response = await axios.get<OrderItem[]>(
      `${API_URL}/projects/${projectId}/orderitems`,
    );
    return response.data;
  },

  createOrderItems: async (
    items: Omit<OrderItem, "id" | "createdAt" | "updatedAt">[],
  ): Promise<OrderItem[]> => {
    const response = await axios.post<OrderItem[]>(
      `${API_URL}/orderitems`,
      items,
    );
    return response.data;
  },

  deleteOrderItem: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/orderitems/${id}`);
  },

  // Receipts
  getReceipts: async (orderId: string): Promise<Receipt[]> => {
    const response = await axios.get<Receipt[]>(
      `${API_URL}/orders/${orderId}/receipts`,
    );
    return response.data;
  },

  createReceipts: async (
    receipts: Omit<Receipt, "id" | "createdAt" | "updatedAt">[],
  ): Promise<Receipt[]> => {
    const response = await axios.post<Receipt[]>(
      `${API_URL}/receipts`,
      receipts,
    );
    return response.data;
  },
};
