import React from 'react';
import {render} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';

export function renderWithProviders(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}
