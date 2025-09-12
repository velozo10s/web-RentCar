import React, {StrictMode, createContext} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';

import './index.css';
import App from './pages/App';
import rootStore from './lib/stores/rootStore.ts';
import {SnackbarProvider} from './lib/providers/SnackbarProvider.tsx';

export const StoreContext = createContext(rootStore);

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <StrictMode>
      <StoreContext.Provider value={rootStore}>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </StoreContext.Provider>
    </StrictMode>
  </BrowserRouter>,
);
