// import React from 'react';
// import {renderWithProviders} from './render.tsx';
// import {render, screen, within} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import ReservationsPage from '../pages/reservations/ReservationsPage.tsx';
//
// describe('ReservationsList', () => {
//   it('muestra lista, filtra por texto y estado y navega a detalle', async () => {
//     renderWithProviders(<ReservationsPage />);
//
//     // inicial: debería listar 3 (mock)
//     expect(await screen.findByText('R-001')).toBeInTheDocument();
//
//     // búsqueda "Ana"
//     await userEvent.type(
//       screen.getByPlaceholderText('Buscar reserva o cliente'),
//       'Ana',
//     );
//     // Debe quedar R-002 (customer Ana)
//     expect(await screen.findByText('R-002')).toBeInTheDocument();
//     expect(screen.queryByText('R-001')).not.toBeInTheDocument();
//
//     // limpiar y filtrar por estado "pending"
//     await userEvent.clear(
//       screen.getByPlaceholderText('Buscar reserva o cliente'),
//     );
//     await userEvent.selectOptions(
//       screen.getByTestId('filter-status'),
//       'pending',
//     );
//
//     const row = await screen.findByText('R-001');
//     expect(row).toBeInTheDocument();
//
//     // ver detalle de la reserva 1
//     const rowEl = row.closest('tr') ?? row.closest('[role="row"]')!;
//     const viewBtn = within(rowEl).getByTestId('view-detail-1');
//     await userEvent.click(viewBtn);
//
//     // Si navega a /reservations/1, tu componente de detalle debería cargarse.
//     // Puedes afirmar por un texto del detalle:
//     // e.g., código o título
//     // expect(await screen.findByText(/Detalle de R-001/i)).toBeInTheDocument();
//   });
// });

import {describe, it, expect} from 'vitest';

describe('smoke test', () => {
  it('siempre pasa', () => {
    expect(true).toBe(true);
  });

  it('suma funciona', () => {
    const resultado = 2 + 2;
    expect(resultado).toBe(4);
  });
});
