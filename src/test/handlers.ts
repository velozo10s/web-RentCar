import {http, HttpResponse} from 'msw';

export const API_URL = 'http://localhost:5173/api'; // ajusta si usas proxy o env

export const handlers = [
  // LOGIN
  http.post(`${API_URL}/auth/login`, async ({request}) => {
    const body = (await request.json()) as {email: string; password: string};
    if (body.email === 'user@demo.com' && body.password === 'secret') {
      return HttpResponse.json({
        access: 'acc123',
        refresh: 'ref456',
        user: {id: 1, name: 'Demo'},
      });
    }
    return new HttpResponse(JSON.stringify({message: 'Invalid credentials'}), {
      status: 401,
    });
  }),

  // LIST RESERVATIONS (con query params q y status)
  http.get('/api/reservations', ({request}) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'all';

    // Devuelve data según el filtro (simplificado)
    const all = [
      {id: 1, code: 'R-001', customer: 'Ana', status: 'pending'},
      {id: 2, code: 'R-002', customer: 'Beto', status: 'approved'},
    ];
    const data = status === 'all' ? all : all.filter(r => r.status === status);

    return HttpResponse.json(data, {status: 200});
  }),

  // GET RESERVATION DETAIL
  http.get(`${API_URL}/reservations/:id`, ({params}) => {
    const id = Number(params.id);
    const item = {
      id,
      code: `R-00${id}`,
      customer: 'Juan',
      status: 'pending',
      details: '…',
    };
    return HttpResponse.json(item);
  }),

  // UPDATE STATUS (approve/reject)
  http.post(`${API_URL}/reservations/:id/status`, async ({params, request}) => {
    const {status} = (await request.json()) as {
      status: 'approved' | 'rejected';
    };
    const id = Number(params.id);
    return HttpResponse.json({id, status});
  }),
];
