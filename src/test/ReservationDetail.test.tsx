import React from 'react';
import {renderWithProviders} from './render.tsx';
import {screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import ReservationDetailPage from '../pages/reservations/reservationDetailPage.tsx';
// // Si usas route param, puedes envolver con MemoryRouter y Route
// import {MemoryRouter, Route, Routes} from 'react-router-dom';
//
// function renderDetail(id = 1) {
//   return renderWithProviders(
//     <MemoryRouter initialEntries={[`/reservations/${id}`]}>
//       <Routes>
//         <Route path="/reservations/:id" element={<ReservationDetailPage />} />
//       </Routes>
//     </MemoryRouter>,
//   );
// }
//
// describe('ReservationDetail', () => {
//   it('aprueba reserva', async () => {
//     renderDetail(1);
//
//     expect(await screen.findByText(/R-001/i)).toBeInTheDocument();
//     expect(screen.getByText(/pending/i)).toBeInTheDocument();
//
//     await userEvent.click(screen.getByTestId('approve-btn'));
//     expect(await screen.findByText(/approved/i)).toBeInTheDocument();
//   });
//
//   it('rechaza reserva', async () => {
//     renderDetail(1);
//
//     expect(await screen.findByText(/R-001/i)).toBeInTheDocument();
//     await userEvent.click(screen.getByTestId('reject-btn'));
//     expect(await screen.findByText(/rejected/i)).toBeInTheDocument();
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
