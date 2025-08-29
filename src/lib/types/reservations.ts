export type ReservationItem = {
  vehicle_id: number;
  line_amount: number;
  vin: string;
  year: number;
  color: string;
  model: string;
  seats: number;
  status: string;
  mileage: number;
  fuel_type: string;
  is_active: boolean;
  type_name: string;
  brand_name: string;
  created_at: Date;
  updated_at: Date;
  transmission: string;
  vehicle_type: string;
  brand_country: string;
  fuel_capacity: number;
  insurance_fee: number;
  license_plate: string;
  price_per_day: number;
  price_per_hour: number;
  maintenance_mileage: number;
  vehicle_type_description: string;
};

export type nationality = string;

export type Reservation = {
  id: number;
  customer_user_id: number;
  start_at: string; // ISO string (p.ej. "2025-07-23T10:00:00Z")
  end_at: string; // ISO string
  status: string; // backend puede enviar valores arbitrarios
  note: string;
  total_amount: string; // viene como string
  items: ReservationItem[];
  customer_username: string;
  customer_email: string;
  document_number: string;
  full_name: string;
  nationality: nationality;
  phone_number: string;
};
