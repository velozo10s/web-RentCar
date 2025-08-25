import * as React from 'react';
import { Chip } from '@mui/material';

const LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  active: 'En curso',
  completed: 'Finalizada',
  declined: 'Rechazada',
  cancelled: 'Cancelada',
};

export default function StatusChip({ status }: { status: string }) {
  const key = (status || '').toLowerCase();

  const color =
    key === 'confirmed' ? 'success' :
      key === 'active' ? 'info' :
        key === 'completed' ? 'default' :
          key === 'declined' || key === 'cancelled' ? 'error' :
            'warning';

  return <Chip size="small" color={color as any} label={LABELS[key] ?? status} />;
}
