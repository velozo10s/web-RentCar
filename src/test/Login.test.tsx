import React from 'react';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderWithProviders} from './render.tsx';
import LoginPage from '../pages/LoginScreen.tsx';
import {vi} from 'vitest';

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login ok -> guarda tokens y navega', async () => {
    // mock de navigate si usas react-router hooks
    const pushSpy = vi.spyOn(window.history, 'pushState');
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('login.user'), 'user@demo.com');
    await userEvent.type(screen.getByLabelText('login.password'), 'secret');
    await userEvent.click(
      screen.getByRole('button', {name: 'login.loginButton'}),
    );

    // tokens en localStorage
    expect(localStorage.getItem('access')).toBe('acc123');
    expect(localStorage.getItem('refresh')).toBe('ref456');

    // navegó a /reservations (router real cambia history)
    expect(pushSpy).toHaveBeenCalled();
  });

  it('login inválido -> muestra error y no guarda tokens', async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'user@demo.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong');
    await userEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByText(/Invalid credentials/i)).toBeTruthy();
    expect(localStorage.getItem('access')).toBeNull();
  });
});

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
