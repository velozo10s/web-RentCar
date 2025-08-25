import * as React from 'react';
import { Chip } from '@mui/material';

const LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizada',
  CANCELED: 'Cancelada',
};

export default function StatusChip({ status }: { status: string }) {
  const key = (status || '').toUpperCase();

  const color =
    key === 'APPROVED' ? 'success' :
      key === 'IN_PROGRESS' ? 'info' :
        key === 'FINISHED' ? 'default' :
          key === 'CANCELED' ? 'error' :
            'warning';

  return <Chip size="small" color={color as any} label={LABELS[key] ?? status} />;
}
