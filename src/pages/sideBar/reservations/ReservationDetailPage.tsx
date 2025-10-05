import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {useParams, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import StatusChip from '../../../components/StatusChip.tsx';
import type {Reservation} from '../../../lib/types/reservations.ts';
import useApi from '../../../lib/hooks/useApi.ts';
import {useStore} from '../../../lib/hooks/useStore.ts';
import {
  confirmReservation,
  declineReservation,
  activateReservation,
  completeReservation,
} from '../../../api/endpoints.ts';
import {useCallback, useEffect, useState} from 'react';
import AppShell from '../../../components/AppShell.tsx';
import ReservationRatings from '../../../components/molecules/ReservationRatings.tsx';

export default function ReservationDetailPage() {
  const {t, i18n} = useTranslation();
  const {id} = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const rootStore = useStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const statusLower = (reservation?.status || '').toLowerCase();
  const TERMINAL_STATUSES = ['completed', 'declined', 'cancelled'];
  const isTerminal = TERMINAL_STATUSES.includes(statusLower);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language);

  const fetchReservation = useCallback(() => {
    if (!id) return;
    setLoading(true);

    api.getReservation(Number(id)).handle({
      onSuccess: (res: Reservation) => setReservation(res),
      onFinally: () => setLoading(false),
    });
  }, [api, id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  useEffect(() => {
    if (isTerminal) setNewStatus('');
  }, [isTerminal]);

  const actionMap: Record<
    string,
    (id: number) => ReturnType<typeof confirmReservation>
  > = {
    confirmed: confirmReservation,
    declined: declineReservation,
    active: activateReservation,
    completed: completeReservation,
  };

  const applyChangeStatus = () => {
    if (!reservation || !newStatus) return;
    const fn = actionMap[newStatus.toLowerCase()];
    if (!fn) {
      // @ts-ignore
      rootStore.uiStore?.showSnackbar?.(
        t('reservations.detail.changeStatus.notAllowed'),
        'warning',
      );
      return;
    }

    setChanging(true);
    const prev = reservation.status;
    setReservation({...reservation, status: newStatus});

    fn(reservation.id).handle({
      onSuccess: () => {
        // @ts-ignore
        rootStore.uiStore?.showSnackbar?.(
          t('reservations.detail.toasts.updated'),
          'success',
        );
      },
      onError: () => {
        setReservation(prevRes =>
          prevRes ? {...prevRes, status: prev} : prevRes,
        );
      },
      onFinally: () => {
        setChanging(false);
        setNewStatus('');
        fetchReservation();
      },
    });
  };

  return (
    <AppShell>
      <Box
        component="main"
        sx={{width: '100%', p: 3, display: 'flex', flexDirection: 'column'}}>
        <Stack direction="row" alignItems="center" mb={2}>
          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>
            {t('reservations.detail.title')}
          </Typography>

          <Box sx={{ml: 'auto'}}>
            <Button onClick={() => navigate(-1)}>{t('common.back')}</Button>
          </Box>
        </Stack>

        {loading && <LinearProgress sx={{mb: 2}} />}

        {reservation && (
          <Stack spacing={4}>
            <Paper variant="outlined" sx={{p: 2}}>
              <Stack
                direction={{xs: 'column', sm: 'row'}}
                spacing={2}
                alignItems="center"
                justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('reservations.detail.reservation')}
                  </Typography>
                  <Typography variant="h5">#{reservation.id}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.currentStatus')}:
                  </Typography>
                  <StatusChip status={reservation.status} />
                </Stack>
              </Stack>

              <Divider sx={{my: 2}} />

              <Stack
                direction={{xs: 'column', sm: 'row'}}
                justifyContent="space-between"
                spacing={10}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.customer')}
                  </Typography>
                  <Typography variant="body1">
                    {reservation.document_number}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.fullName')}
                  </Typography>
                  <Typography variant="body1">
                    {reservation.full_name}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.start')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(reservation.start_at)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.end')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(reservation.end_at)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.total')}
                  </Typography>
                  <Typography variant="body1">
                    {Number(reservation.total_amount).toLocaleString(
                      undefined,
                      {style: 'currency', currency: 'USD'},
                    )}
                  </Typography>
                </Stack>
              </Stack>

              {reservation.note && (
                <Stack spacing={0.5} sx={{mt: 2}}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reservations.detail.note')}
                  </Typography>
                  <Typography variant="body1">{reservation.note}</Typography>
                </Stack>
              )}
            </Paper>

            <Paper variant="outlined" sx={{p: 2}}>
              <Typography variant="subtitle1" mb={1}>
                {t('reservations.detail.vehicles')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        {t('reservations.detail.vehiclesTable.columns.id')}
                      </TableCell>
                      <TableCell>
                        {t('reservations.detail.vehiclesTable.columns.brand')}
                      </TableCell>
                      <TableCell>
                        {t('reservations.detail.vehiclesTable.columns.model')}
                      </TableCell>
                      <TableCell>
                        {t('reservations.detail.vehiclesTable.columns.year')}
                      </TableCell>
                      <TableCell align="right">
                        {t('reservations.detail.vehiclesTable.columns.amount')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservation.items?.length ? (
                      reservation.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.vehicle_id}</TableCell>
                          <TableCell>{it.brand_name}</TableCell>
                          <TableCell>{it.model}</TableCell>
                          <TableCell>{it.year}</TableCell>
                          <TableCell align="right">
                            {Number(it.line_amount).toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'USD',
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          —
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {!isTerminal && (
              <Paper variant="outlined" sx={{p: 2}}>
                <Typography variant="subtitle1" mb={1}>
                  {t('reservations.detail.changeStatus.title')}
                </Typography>
                <Stack
                  direction={{xs: 'column', sm: 'row'}}
                  spacing={1.5}
                  alignItems={{xs: 'stretch', sm: 'center'}}>
                  <FormControl size="small" sx={{width: 240}}>
                    <Select
                      value={newStatus}
                      onChange={e => setNewStatus(String(e.target.value))}
                      displayEmpty>
                      <MenuItem value="">
                        <em>
                          {t('reservations.detail.changeStatus.placeholder')}
                        </em>
                      </MenuItem>
                      {/* Solo estados con endpoint */}
                      <MenuItem value="confirmed">
                        {t('reservations.status.confirmed')}
                      </MenuItem>
                      <MenuItem value="active">
                        {t('reservations.status.active')}
                      </MenuItem>
                      <MenuItem value="completed">
                        {t('reservations.status.completed')}
                      </MenuItem>
                      <MenuItem value="declined">
                        {t('reservations.status.declined')}
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    disabled={!newStatus || changing}
                    onClick={applyChangeStatus}>
                    {changing
                      ? t('reservations.detail.changeStatus.applying')
                      : t('common.apply')}
                  </Button>
                </Stack>
              </Paper>
            )}
            <Paper variant="outlined" sx={{p: 2}}>
              <ReservationRatings reservation={reservation} />
            </Paper>
          </Stack>
        )}
      </Box>
    </AppShell>
  );
}
