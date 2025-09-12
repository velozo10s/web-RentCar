import '@testing-library/jest-dom/vitest';
import {server} from './testServer';
import {vi} from 'vitest';
import React from 'react';

// Mock global de react-i18next
vi.mock('react-i18next', () => {
  return {
    // hook principal: devolvemos la key para que sea estable en tests
    useTranslation: () => ({
      t: (key: string, opts?: any) => opts?.defaultValue ?? key,
      i18n: {changeLanguage: () => Promise.resolve()},
    }),
    // componente <Trans />
    Trans: ({i18nKey, children}: any) =>
      React.createElement(React.Fragment, null, children ?? i18nKey),

    // ¡ESTO ES LO QUE TE FALTA!
    // i18next espera un "plugin" con forma { type: '3rdParty', init: fn }
    initReactI18next: {type: '3rdParty', init: () => {}},
  };
});

// Evita que se ejecute el bootstrap real en tests
vi.mock('../main', async () => {
  const React = await import('react');

  // store mínimo que tus pantallas usan en tests (ajústalo si hace falta)
  const fakeStore = {
    authStore: {
      accessToken: null,
      refreshToken: null,
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
      login: vi.fn(),
    },
    uiStore: {
      snackbar: {show: vi.fn()},
    },
  };

  // ⚠️ el valor por defecto del contexto será fakeStore
  const StoreContext = React.createContext<any>(fakeStore);

  // exporta el símbolo que tu hook importa
  return {StoreContext, default: {}};
});
vi.mock('../main.tsx', async () => {
  const React = await import('react');

  // store mínimo que tus pantallas usan en tests (ajústalo si hace falta)
  const fakeStore = {
    authStore: {
      accessToken: null,
      refreshToken: null,
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
      login: vi.fn(),
    },
    uiStore: {
      snackbar: {show: vi.fn()},
    },
  };

  // ⚠️ el valor por defecto del contexto será fakeStore
  const StoreContext = React.createContext<any>(fakeStore);

  // exporta el símbolo que tu hook importa
  return {StoreContext, default: {}};
});
vi.mock('src/main', async () => {
  const React = await import('react');

  // store mínimo que tus pantallas usan en tests (ajústalo si hace falta)
  const fakeStore = {
    authStore: {
      accessToken: null,
      refreshToken: null,
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
      login: vi.fn(),
    },
    uiStore: {
      snackbar: {show: vi.fn()},
    },
  };

  // ⚠️ el valor por defecto del contexto será fakeStore
  const StoreContext = React.createContext<any>(fakeStore);

  // exporta el símbolo que tu hook importa
  return {StoreContext, default: {}};
});
// Si prefieres comenzar la suite sin romperte por endpoints no mockeados,
// puedes dejar 'warn' mientras armas todos los handlers.
beforeAll(() => server.listen({onUnhandledRequest: 'warn'}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Polyfill ResizeObserver (ver punto 2)
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = RO;

// import {describe, it, expect} from 'vitest';
//
// describe('smoke test', () => {
//   it('siempre pasa', () => {
//     expect(true).toBe(true);
//   });
//
//   it('suma funciona', () => {
//     const resultado = 2 + 2;
//     expect(resultado).toBe(4);
//   });
// });
