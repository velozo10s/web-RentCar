// App.tsx
import '../App.css';
import React from 'react';
import {Route, Routes, Navigate, Outlet, useLocation} from 'react-router-dom';
import {ROUTES} from '../routes/routes';
import LoginScreen from '../pages/LoginScreen';
import {StoreContext} from '../main';
import {CssBaseline, ThemeProvider} from '@mui/material';
import ReservationsPage from './sideBar/reservations/ReservationsPage';
import ReservationDetailPage from './sideBar/reservations/reservationDetailPage';
import EmployeesPage from './sideBar/employees/EmployeesPage.tsx';
import HomeScreen from './HomeScreen.tsx';
import {darkTheme} from '../themes/dark.ts';
import {observer} from 'mobx-react-lite';

// Guard: requiere sesión
const RequireAuth = observer(function RequireAuth() {
  const {userStore} = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace state={{from: location}} />;
  }
  return <Outlet />;
});

// Guard: solo invitados (si está logueado, redirige)
const RequireGuest = observer(function RequireGuest() {
  const {userStore} = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);

  if (isLoggedIn) {
    return <Navigate to={ROUTES.RESERVATIONS} replace />;
  }
  return <Outlet />;
});

const App = observer(function App() {
  const {userStore} = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Routes>
        {/* Públicas solo para no logueados */}
        <Route element={<RequireGuest />}>
          <Route path={ROUTES.ROOT} element={<HomeScreen />} />
          <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
        </Route>

        {/* Privadas (logueados) */}
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.RESERVATIONS} element={<ReservationsPage />} />
          <Route
            path={ROUTES.RESERVATION}
            element={<ReservationDetailPage />}
          />
          <Route path={ROUTES.EMPLOYEES} element={<EmployeesPage />} />
        </Route>

        {/* Catch-all */}
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
    </ThemeProvider>
  );
});

export default App;
