import { api } from '@/lib/api/client';
import {
  BlacklistDto,
  AddToBlacklistRequest,
  PagedResult,
  BlacklistApiResponse,
} from '../types';

const BASE_URL = '/blacklist';

export const blacklistService = {
  getAll: async (pageIndex: number = 1, pageSize: number = 10): Promise<PagedResult<BlacklistDto>> => {
    try {
      const response = await api.get<BlacklistApiResponse<PagedResult<BlacklistDto>>>(
        `${BASE_URL}?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      if (response && response.data) {
        return response.data;
      }
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        pageIndex,
        pageSize,
      };
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        pageIndex,
        pageSize,
      };
    }
  },

  getById: async (id: number): Promise<BlacklistDto | null> => {
    try {
      const response = await api.get<BlacklistApiResponse<BlacklistDto>>(`${BASE_URL}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching blacklist detail for ID ${id}:`, error);
      return null;
    }
  },

  addToBlacklist: async (data: AddToBlacklistRequest): Promise<BlacklistDto | null> => {
    try {
      const response = await api.post<BlacklistApiResponse<BlacklistDto>>(BASE_URL, data);
      return response.data || null;
    } catch (error) {
      console.error('Error adding item to blacklist:', error);
      throw error;
    }
  },

  removeFromBlacklist: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete<BlacklistApiResponse<void>>(`${BASE_URL}/${id}`);
      return response.success === true;
    } catch (error) {
      console.error(`Error removing item ${id} from blacklist:`, error);
      return false;
    }
  },

  checkVehicleBlocked: async (vehicleId: number): Promise<boolean> => {
    try {
      const response = await api.get<BlacklistApiResponse<boolean>>(`${BASE_URL}/check-vehicle/${vehicleId}`);
      return response.data === true;
    } catch (error) {
      console.error(`Error checking if vehicle ${vehicleId} is blocked:`, error);
      return false;
    }
  },

  checkCardBlocked: async (cardId: number): Promise<boolean> => {
    try {
      const response = await api.get<BlacklistApiResponse<boolean>>(`${BASE_URL}/check-card/${cardId}`);
      return response.data === true;
    } catch (error) {
      console.error(`Error checking if card ${cardId} is blocked:`, error);
      return false;
    }
  },
};
