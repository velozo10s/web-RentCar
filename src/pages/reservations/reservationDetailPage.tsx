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
import Sidebar from '../../components/Sidebar';
import StatusChip from '../../components/StatusChip';
import type {Reservation} from '../../lib/types/reservations';
import useApi from '../../lib/hooks/useApi';
import {useStore} from '../../lib/hooks/useStore';
import {
  confirmReservation,
  declineReservation,
  activateReservation,
  completeReservation,
} from '../../api/endpoints.ts';
import {useCallback, useEffect, useState} from 'react'; // ajusta el path a donde tengas estas funcs

export default function ReservationDetailPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const rootStore = useStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

  const fetchReservation = useCallback(() => {
    if (!id) return;
    setLoading(true);

    api.getReservation(Number(id)).handle({
      onSuccess: (res: Reservation) => setReservation(res),
      onError: () => {
        // @ts-ignore
        //rootStore.uiStore?.showSnackbar?.('Error al cargar la reserva', 'danger');
      },
      onFinally: () => setLoading(false),
    });
  }, [api, id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

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
        'Ese estado no se puede cambiar desde aquí',
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
        rootStore.uiStore?.showSnackbar?.('Estado actualizado', 'success');
      },
      onError: err => {
        // revertir optimismo
        setReservation(prevRes =>
          prevRes ? {...prevRes, status: prev} : prevRes,
        );
        // @ts-ignore
        rootStore.uiStore?.showSnackbar?.(
          // @ts-ignore
          err?.response?.data?.error ?? 'Error al actualizar',
          'danger',
        );
      },
      onFinally: () => {
        setChanging(false);
        setNewStatus('');
        // opcional: re-fetch para asegurar sincronía
        fetchReservation();
      },
    });
  };

  return (
    <Box position={'fixed'} display="flex" minHeight="100dvh" width="100%">
      <Sidebar active="reservas" />

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}>
          <Typography variant="h5">Detalle de reserva</Typography>
          <Button onClick={() => navigate(-1)}>Volver</Button>
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
                    Reserva
                  </Typography>
                  <Typography variant="h5">#{reservation.id}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Estado actual:
                  </Typography>
                  <StatusChip status={reservation.status} />
                </Stack>
              </Stack>

              <Divider sx={{my: 2}} />

              <Stack direction={{xs: 'column', sm: 'row'}} spacing={10}>
                <Stack spacing={0.5} sx={{minWidth: 240}}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1">
                    {reservation.document_number}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{minWidth: 240}}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre completo
                  </Typography>
                  <Typography variant="body1">
                    {reservation.full_name}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{minWidth: 280}}>
                  <Typography variant="body2" color="text.secondary">
                    Desde
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(reservation.start_at)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{minWidth: 280}}>
                  <Typography variant="body2" color="text.secondary">
                    Hasta
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(reservation.end_at)}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{minWidth: 200}}>
                  <Typography variant="body2" color="text.secondary">
                    Total
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
                    Nota
                  </Typography>
                  <Typography variant="body1">{reservation.note}</Typography>
                </Stack>
              )}
            </Paper>

            <Paper variant="outlined" sx={{p: 2}}>
              <Typography variant="subtitle1" mb={1}>
                Vehículos
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>vehicle_id</TableCell>
                      <TableCell align="right">line_amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservation.items?.length ? (
                      reservation.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.vehicle_id}</TableCell>
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
                        <TableCell colSpan={2} align="center">
                          —
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{p: 2}}>
              <Typography variant="subtitle1" mb={1}>
                Cambiar estado
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
                      <em>Selecciona un estado</em>
                    </MenuItem>
                    {/* Solo estados con endpoint */}
                    <MenuItem value="confirmed">Confirmada</MenuItem>
                    <MenuItem value="active">En curso</MenuItem>
                    <MenuItem value="completed">Finalizada</MenuItem>
                    <MenuItem value="declined">Rechazada</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  disabled={!newStatus || changing}
                  onClick={applyChangeStatus}>
                  {changing ? 'Aplicando…' : 'Aplicar'}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
