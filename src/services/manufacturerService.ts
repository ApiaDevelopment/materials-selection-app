import type {
    CreateManufacturerRequest,
    Manufacturer,
    UpdateManufacturerRequest,
} from "../types";
import api from "./api";

export const manufacturerService = {
  async getAllManufacturers(): Promise<Manufacturer[]> {
    const response = await api.get<Manufacturer[]>("/manufacturers");
    return response.data;
  },

  async getManufacturer(id: string): Promise<Manufacturer> {
    const response = await api.get<Manufacturer>(`/manufacturers/${id}`);
    return response.data;
  },

  async createManufacturer(
    data: CreateManufacturerRequest,
  ): Promise<Manufacturer> {
    const response = await api.post<Manufacturer>("/manufacturers", data);
    return response.data;
  },

  async updateManufacturer(
    id: string,
    data: UpdateManufacturerRequest,
  ): Promise<Manufacturer> {
    const response = await api.put<Manufacturer>(`/manufacturers/${id}`, data);
    return response.data;
  },

  async deleteManufacturer(id: string): Promise<void> {
    await api.delete(`/manufacturers/${id}`);
  },
};
