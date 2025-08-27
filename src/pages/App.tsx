import '../App.css'
import React from 'react';
import { Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import LoginScreen from '../pages/LoginScreen';
import { StoreContext } from '../main';
import { CssBaseline } from '@mui/material';
import ReservationsPage from './reservations/ReservationsPage';
import ReservationDetailPage from './reservations/reservationDetailPage';

// Guard: requiere sesión
function RequireAuth() {
  const { userStore } = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);
  const location = useLocation();

  if (!isLoggedIn) {
    // recuerda a dónde quería ir, para volver después de loguearse
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Guard: solo invitados (si está logueado, redirige)
function RequireGuest() {
  const { userStore } = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);

  if (isLoggedIn) {
    return <Navigate to={ROUTES.RESERVATIONS} replace />;
  }
  return <Outlet />;
}

function App() {
  const { userStore } = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);

  return (
    <>
      <CssBaseline />

      <Routes>
        {/* Rutas públicas solo para no logueados */}
        <Route element={<RequireGuest />}>
          <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
        </Route>

        {/* Rutas privadas (solo logueados) */}
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.RESERVATIONS} element={<ReservationsPage />} />
          <Route path={ROUTES.RESERVATION} element={<ReservationDetailPage />} />
        </Route>

        {/* Catch-all: manda a login si no logueado, o a /reservations si sí */}
        <Route
          path="*"
          element={
            <Navigate
              to={isLoggedIn ? ROUTES.RESERVATIONS : ROUTES.LOGIN}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
