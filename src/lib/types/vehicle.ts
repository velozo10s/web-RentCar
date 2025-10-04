// src/lib/types/vehicles.ts
export type Vehicles = {
  id: number;
  brand_id: number;
  type_id: number;
  model: string;
  year: number;
  license_plate: string;
  transmission: 'automatic' | 'manual' | string;
  seats: number;
  price_per_hour: number | string;
  price_per_day: number | string;
  color?: string;
  vin?: string;
  fuel_type?: string;
  fuel_capacity?: number | string;
  mileage?: number | string;
  maintenance_mileage?: number | string;
  insurance_fee?: number | string;
  images?: string[]; // URLs, if your API returns them
  // add anything else your API returns
};
