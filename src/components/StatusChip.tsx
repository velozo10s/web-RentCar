import * as React from 'react';
import {Chip, type ChipProps} from '@mui/material';
import {useTranslation} from 'react-i18next';

type Status =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'declined'
  | 'cancelled';

const STATUS_COLOR: Record<Status, ChipProps['color']> = {
  pending: 'warning',
  confirmed: 'success',
  active: 'info',
  completed: 'default',
  declined: 'error',
  cancelled: 'error',
};

const STATUS_LOCALE_KEY: Record<Status, string> = {
  pending: 'reservations.status.pending',
  confirmed: 'reservations.status.confirmed',
  active: 'reservations.status.active',
  completed: 'reservations.status.completed',
  declined: 'reservations.status.declined',
  cancelled: 'reservations.status.cancelled',
};

function normalizeStatus(value: string): Status | undefined {
  const key = (value || '').toLowerCase() as Status;
  return (Object.keys(STATUS_LOCALE_KEY) as Status[]).includes(key)
    ? key
    : undefined;
}

export default function StatusChip({status}: {status: string}) {
  const {t} = useTranslation();
  const norm = normalizeStatus(status);

  const label = norm ? t(STATUS_LOCALE_KEY[norm]) : status;
  const color: ChipProps['color'] = norm ? STATUS_COLOR[norm] : 'default';

  return <Chip size="small" color={color} label={label} />;
}
