import client, {wrapRequest} from './client';

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

// CREATE (multipart)
export const addVehicle = (form: FormData) =>
  wrapRequest(
    client.post('/vehicles', form, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  );

// UPDATE (multipart)
export const updateVehicle = (id: number, form: FormData) =>
  wrapRequest(
    client.put(`/vehicles/${id}`, form, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  );

// DELETE
export const deleteVehicle = (id: number) =>
  wrapRequest(client.delete(`/vehicles/${id}`));
