
export interface ParkingSlotDto {
  id: number;
  zoneId: number;
  vehicleTypeId: number;
  code: string;
  name?: string;
  status: number;
}

export interface ParkingSessionDto {
  id: number;
  vehicleId: number;
  buildingId: number;
  cardId: number;
  zoneId?: number;
  slotId?: number;
  bookingId?: number;
  monthlySubscriptionId?: number;
  inStaffId?: number;
  outStaffId?: number;
  checkInTime: string;
  checkOutTime?: string;
  licensePlateIn: string;
  licensePlateOut?: string;
  sessionStatus: string;
}

export interface CardDto {
  id: number;
  cardCode: string;
  rfidCode?: string;
  cardType: string;
  cardStatus: string;
  createdAt: string;
}

export interface VehicleDto {
  id: number;
  accountId?: number;
  vehicleTypeId: number;
  vehicleTypeName?: string;
  licensePlate: string;
  registeredDay?: string;
  vehicleStatus: string;
}

export interface FloorResponse {
  id: number;
  buildingId: number;
  floorNumber: number;
  name?: string;
  status: number | string;
}

export interface ZoneResponse {
  id: number;
  floorId: number;
  name: string;
  code?: string;
  vehicleTypeId: number;
  accessType?: number;  // Backend: 0 = GENERAL, 1 = MONTHLY
  capacity?: number;
  status: number | string;
}

export interface Floor {
  id: number;
  buildingId: number;
  floorNumber: number;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface Zone {
  id: number;
  floorId: number;
  name: string;
  vehicleType: 'Standard' | 'EV Charging' | 'Motorbike';
  zoneAccessType: 'GENERAL' | 'MONTHLY';
  slotCapacity: number;
  status: 'Active' | 'Inactive';
}

export interface Slot {
  id: number;
  slotCode: string;
  slotName?: string;
  zoneId: number;
  zoneName: string;
  floorId: number;
  buildingId: number;
  slotType: 'Standard' | 'EV Charging';
  status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE';
  assignedVehicle?: {
    plate: string;
    model: string;
    ownerName: string;
    memberId: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
}
