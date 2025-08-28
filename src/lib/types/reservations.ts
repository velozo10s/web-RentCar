export type ReservationItem = {
  vehicle_id: number;
  line_amount: number;
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
