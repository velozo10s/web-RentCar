import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormHelperText,
  LinearProgress,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import StatusChip from '../../../components/StatusChip.tsx';
import type {Reservation} from '../../../lib/types/reservations.ts';
import useApi from '../../../lib/hooks/useApi.ts';
import AppShell from '../../../components/AppShell.tsx';
import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

export default function ReservationsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const {t} = useTranslation();

  const [rows, setRows] = useState<Reservation[]>([]);
  const [query, setQuery] = useState('');
  const STATUS_OPTIONS = [
    {value: 'all', label: t('reservations.status.all')},
    {value: 'pending', label: t('reservations.status.pending')},
    {value: 'confirmed', label: t('reservations.status.confirmed')},
    {value: 'active', label: t('reservations.status.active')},
    {value: 'completed', label: t('reservations.status.completed')},
    {value: 'declined', label: t('reservations.status.declined')},
    {value: 'cancelled', label: t('reservations.status.cancelled')},
  ];
  type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const fetchReservations = useCallback(
    (opts?: {silent?: boolean}) => {
      if (!opts?.silent) setLoading(true);
      const params = {status};

      api.listReservations(params).handle({
        onSuccess: (res: Reservation[]) => setRows(res ?? []),
        onError: () => {
          setLoading(false);
          setRefreshing(false);
        },
        onFinally: () => {
          setLoading(false);
          setRefreshing(false);
        },
      });
    },
    [api, status],
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const inId = String(r.id).includes(q);
    const inCustomer = String(r.customer_user_id).includes(q);
    const inItems = r.items?.some(i => String(i.vehicle_id).includes(q));
    const inNote = (r.note || '').toLowerCase().includes(q);
    return inId || inCustomer || inItems || inNote;
  });

  return (
    <AppShell>
      <Box
        component="main"
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Typography variant="h6" mb={2} textAlign="center">
          {t('reservations.title')}
        </Typography>

        {/* Toolbar */}
        <Stack
          direction={{xs: 'column', sm: 'row'}}
          gap={1.5}
          alignItems={{xs: 'stretch', sm: 'center'}}
          mb={2}>
          <FormHelperText sx={{m: 0, mr: 1}}>
            {t('reservations.filters.status')}
          </FormHelperText>

          <FormControl size="small" sx={{width: 220}}>
            <Select
              value={status}
              onChange={e => setStatus(e.target.value as StatusFilter)}>
              {STATUS_OPTIONS.map(op => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{flex: 1}} />

          {/* Que el buscador pueda expandirse */}
          <TextField
            size="small"
            placeholder={t('reservations.filters.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{width: {xs: '100%', sm: 300}, flexShrink: 0}}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setRefreshing(true);
              fetchReservations({silent: true});
            }}>
            {refreshing
              ? t('reservations.filters.refreshing')
              : t('reservations.filters.refresh')}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{mb: 1}} />}

        {/* Contenedor de tabla que LLENA el espacio restante */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
          }}>
          <TableContainer sx={{flex: 1 /* altura completa */, width: '100%'}}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('reservations.table.columns.id')}</TableCell>
                  <TableCell>
                    {t('reservations.table.columns.customer')}
                  </TableCell>
                  <TableCell>{t('reservations.table.columns.items')}</TableCell>
                  <TableCell>
                    {t('reservations.table.columns.dateRange')}
                  </TableCell>
                  <TableCell>{t('reservations.table.columns.total')}</TableCell>
                  <TableCell>
                    {t('reservations.table.columns.status')}
                  </TableCell>
                  <TableCell align="center">
                    {t('reservations.table.columns.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.document_number}</TableCell>
                    <TableCell>
                      {row.items?.length
                        ? `${row.items.length} ${t('reservations.table.itemsPlural')} · ${row.items.map(i => i.vehicle_id).join(', ')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatDate(row.start_at)}&nbsp;
                      {t('reservations.table.columns.to')}&nbsp;
                      {formatDate(row.end_at)}
                    </TableCell>
                    <TableCell>
                      {Number(row.total_amount).toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => navigate(`/reservations/${row.id}`)}>
                        {t('reservations.actions.viewDetail')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{py: 6, color: 'text.secondary'}}>
                      No hay resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </AppShell>
  );
}
