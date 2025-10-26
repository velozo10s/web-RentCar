import client, {wrapRequest} from './client';
import type {
  CompanyStats,
  CreateRatingDto,
  CustomerStats,
  Rating,
} from '../lib/types/ratings.ts';
import type {CustomerSummary, CustomerDetail} from '../lib/types/customers.ts';

export const login = (data: {[key: string]: any}) => {
  return wrapRequest(client.post('/auth/login/', data));
};

export const logout = (data: {[key: string]: any}) => {
  return wrapRequest(client.post('/auth/logout/', data));
};

export const signUp = (data: {[key: string]: any}) => {
  return wrapRequest(client.post('/auth/register/', data));
};

export const forgotPassword = (data: {[key: string]: any}) => {
  return wrapRequest(client.post('forgot_password_code', data));
};

export const listVehicles = (params: {[key: string]: any}) => {
  return wrapRequest(client.get('/vehicles', {params}));
};

export const listReservations = (params: {[key: string]: any}) => {
  return wrapRequest(client.get('/reservations', {params}));
};

export const getReservation = (id: number) => {
  return wrapRequest(client.get(`/reservations/${id}`));
};

export const confirmReservation = (id: number) => {
  return wrapRequest(client.patch(`/reservations/${id}/confirm`));
};

export const declineReservation = (id: number) => {
  return wrapRequest(client.patch(`/reservations/${id}/decline`));
};

export const activateReservation = (id: number) => {
  return wrapRequest(client.patch(`/reservations/${id}/activate`));
};

export const completeReservation = (id: number) => {
  return wrapRequest(client.patch(`/reservations/${id}/complete`));
};

export const getVehicle = (id: number) => {
  return wrapRequest(client.get(`/vehicles/${id}`));
};

export const getVehicleBrands = () => {
  return wrapRequest(client.get(`/vehicles/brands`));
};

export const getVehicleTypes = () => {
  return wrapRequest(client.get(`/vehicles/types`));
};

export const addVehicle = (data: {[key: string]: any}) => {
  return wrapRequest(
    client.post('/vehicles', data, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  );
};

export const updateVehicle = (id: number, data: {[key: string]: any}) => {
  return wrapRequest(
    client.patch(`/vehicles/${id}`, data, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  );
};

export const listEmployees = (params: {[key: string]: any}) => {
  return wrapRequest(client.get('/employees', {params}));
};

export const addEmployee = (data: {[key: string]: any}) => {
  return wrapRequest(
    client.post('/employees', data, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  );
};

export const updateEmployee = (id: number, data: {[key: string]: any}) => {
  return wrapRequest(client.patch(`/employees/${id}`, data));
};

export const addReservationRating = (
  reservationId: number,
  payload: CreateRatingDto,
) =>
  wrapRequest(
    client.post<Rating>(`/reservations/${reservationId}/ratings`, payload),
  );

export const getReservationRatings = (reservationId: number) =>
  wrapRequest(
    client.get<Rating[] | Rating>(`/reservations/${reservationId}/ratings`),
  );

export const getCompanyRatingStats = () =>
  wrapRequest(client.get<CompanyStats>(`/ratings/company-stats`));

export const getCustomerRatingStats = (customerUserId: number) =>
  wrapRequest(
    client.get<CustomerStats>(`/ratings/customers/${customerUserId}/stats`),
  );

export const listCustomers = (params?: {active?: 'all' | 'true' | 'false'}) =>
  wrapRequest(client.get<CustomerSummary[]>('/customers', {params}));

export const getCustomer = (personId: number) =>
  wrapRequest(client.get<CustomerDetail>(`/customers/${personId}`));

export type ReportFormat = 'json' | 'xlsx' | 'pdf';

export type ReservationsStatusResp = {
  aggregates: {
    byStatus?: Record<string, number>;
    total?: number;
    series?: Array<{status: string; count: number}>;
  };
  groups?: Array<{key: string; count: number; reservations?: any[]}>;
  items?: any[];
};

export type RevenueMonthlyResp = {
  aggregates: {
    series: Array<{month: string; revenue: number}>;
    totalRevenue: number;
  };
  groups?: any[];
};

export type MaintenanceUpcomingResp = {
  aggregates: {
    buckets: Record<string, number>;
    total: number;
  };
  items: any[];
};

export type FrequentCustomersResp = {
  aggregates: {
    series: Array<{user_id: number; count: number}>;
    totalCustomers: number;
    totalReservations: number;
  };
  items: any[];
};

// ---------------- JSON calls (igual que antes) ----------------
export const getReportReservationsStatus = (params: {
  from: string;
  to: string;
  statuses: string;
  format?: 'json';
}) =>
  wrapRequest(
    client.get<ReservationsStatusResp>(`/reports/reservations/status`, {
      params: {...params, format: 'json'},
    }),
  );

export const getReportRevenueMonthly = (params: {
  year: string | number;
  format?: 'json';
}) =>
  wrapRequest(
    client.get<RevenueMonthlyResp>(`/reports/revenue/monthly`, {
      params: {...params, format: 'json'},
    }),
  );

export const getReportMaintenanceUpcoming = (params: {
  threshold_km: number | string;
  format?: 'json';
}) =>
  wrapRequest(
    client.get<MaintenanceUpcomingResp>(`/reports/maintenance/upcoming`, {
      params: {...params, format: 'json'},
    }),
  );

export const getReportFrequentCustomers = (params: {
  min_reservations: number | string;
  from?: string;
  to?: string;
  format?: 'json';
}) =>
  wrapRequest(
    client.get<FrequentCustomersResp>(`/reports/customers/frequent`, {
      params: {...params, format: 'json'},
    }),
  );

// ---------------- Helpers para construir URLs absolutas con token ----------------
function baseUrl() {
  // Usa el mismo BASE_URL que Axios (suele terminar con /api)
  // y quita trailing slash para concatenar bien
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

function withQuery(url: string, query: Record<string, any>) {
  const usp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  });
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${usp.toString()}`;
}

/** URL absoluta para abrir contrato en nueva pestaña con token en query */
export const contractPdfAbsoluteURL = (
  reservationId: number,
  token: string,
) => {
  const url = `${baseUrl()}/reports/contracts/${reservationId}`;
  return withQuery(url, {token});
};

// ⚠️ todas devuelven arraybuffer
export const exportReportReservationsStatus = (params: {
  from: string;
  to: string;
  statuses: string;
  format: 'xlsx' | 'pdf';
}) =>
  wrapRequest(
    client.get(`/reports/reservations/status`, {
      params,
      responseType: 'arraybuffer',
    }),
  );

export const exportReportRevenueMonthly = (params: {
  year: string | number;
  format: 'xlsx' | 'pdf';
}) =>
  wrapRequest(
    client.get(`/reports/revenue/monthly`, {
      params,
      responseType: 'arraybuffer',
    }),
  );

export const exportReportMaintenanceUpcoming = (params: {
  threshold_km: number | string;
  format: 'xlsx' | 'pdf';
}) =>
  wrapRequest(
    client.get(`/reports/maintenance/upcoming`, {
      params,
      responseType: 'arraybuffer',
    }),
  );

export const exportReportFrequentCustomers = (params: {
  min_reservations: number | string;
  from?: string;
  to?: string;
  format: 'xlsx' | 'pdf';
}) =>
  wrapRequest(
    client.get(`/reports/customers/frequent`, {
      params,
      responseType: 'arraybuffer',
    }),
  );

// ⬇️ descarga contrato como binario (arraybuffer)
export const downloadContractPdf = (id: number) => {
  return wrapRequest(
    client.get<ArrayBuffer>(`/reports/contracts/${id}`, {
      responseType: 'arraybuffer',
    }),
  );
};
