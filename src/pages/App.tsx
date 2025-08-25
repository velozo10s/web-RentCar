import '../App.css'
import React, { createElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import {ROUTES} from '../routes/routes.ts';
import LoginScreen from '../pages/LoginScreen';
import {StoreContext} from '../main.tsx';
import {CssBaseline} from '@mui/material';
import ReservationsPage from './reservations/ReservationsPage.tsx';

// 1) Define el tipo de tu config de rutas
type AppRoute = {
  key: string;
  route?: string;                 // path
  component?: React.ComponentType; // <Componente /> que se creará con createElement
  collapse?: AppRoute[];          // subrutas
};

// 2) getRoutes tipado y sin `exact`
const getRoutes = (allRoutes: AppRoute[]): React.ReactNode =>
  allRoutes.map((route: AppRoute) => {
    if (route.collapse) return getRoutes(route.collapse);

    if (route.route && route.component) {
      return (
        <Route
          path={route.route}
          element={createElement(route.component)}
          key={route.key}
        />
      );
    }

    return null;
  });

function App() {
  const {userStore} = React.useContext(StoreContext);
  const isLoggedIn = Boolean(userStore.accessToken);

  return (
    <>
      <CssBaseline />

      <Routes>
        {/* Si luego usas una lista de rutas */}
        {/* {getRoutes(pageRoutes)} */}

        {/* Rutas públicas sueltas */}

        {/* <Route path="*" element={<NotFound />} /> */}

        {/*{isLoggedIn ? <Route path={ROUTES.RESERVATIONS} element={<ReservationsPage />} /> : <Route path={ROUTES.LOGIN} element={<LoginScreen />} />}*/}
        <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
        {/*<Route path={ROUTES.RESERVATIONS} element={<ReservationsPage />} />*/}
      </Routes>
    </>

  );
}

export default App;
