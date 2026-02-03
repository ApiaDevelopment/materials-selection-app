import type {
    CreateVendorRequest,
    UpdateVendorRequest,
    Vendor,
} from "../types";
import api from "./api";

export const vendorService = {
  async getAllVendors(): Promise<Vendor[]> {
    const response = await api.get<Vendor[]>("/vendors");
    return response.data;
  },

  async getVendor(id: string): Promise<Vendor> {
    const response = await api.get<Vendor>(`/vendors/${id}`);
    return response.data;
  },

  async createVendor(data: CreateVendorRequest): Promise<Vendor> {
    const response = await api.post<Vendor>("/vendors", data);
    return response.data;
  },

  async updateVendor(id: string, data: UpdateVendorRequest): Promise<Vendor> {
    const response = await api.put<Vendor>(`/vendors/${id}`, data);
    return response.data;
  },

  async deleteVendor(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },
};
