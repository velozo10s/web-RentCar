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
  Toolbar,
} from '@mui/material';
import {useParams, useNavigate} from 'react-router-dom';
import StatusChip from '../../../components/StatusChip';
import {type Reservation} from '../../../lib/types/reservations';
import useApi from '../../../lib/hooks/useApi';
import {useStore} from '../../../lib/hooks/useStore';
import {useEffect} from 'react';
import {
  activateReservation,
  completeReservation,
  confirmReservation,
  declineReservation,
} from '../../../api/endpoints';
import AppShell from '../../../components/AppShell';

export default function ReservationDetailPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const root = useStore();

  const [reservation, setReservation] = React.useState<Reservation | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [changing, setChanging] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<string>('');

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

  const fetchReservation = React.useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.getReservation(Number(id)).handle({
      onSuccess: (res: Reservation) => setReservation(res),
      onError: () => {
        //root.uiStore?.showSnackbar?.('Error al cargar la reserva', 'danger');
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
      root.uiStore?.showSnackbar?.(
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
        root.uiStore?.showSnackbar?.('Estado actualizado', 'success');
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

  const openContract = React.useCallback(() => {
    if (!reservation) return;

    const token = root.userStore.accessToken;
    if (!token) {
      root.uiStore?.showSnackbar?.('Sesión no válida', 'warning');
      return;
    }

    api
      .downloadContractPdf(reservation.id)
      .promise.then(res => {
        // res: AxiosResponse<ArrayBuffer>
        const cd =
          res.headers?.['content-disposition'] ||
          (res.headers as any)?.get?.('content-disposition');

        let filename = `contrato-${reservation.id}.pdf`;
        if (cd) {
          const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
          if (m && m[1]) filename = decodeURIComponent(m[1]);
        }

        const blob = new Blob([res.data], {type: 'application/pdf'});
        const blobUrl = URL.createObjectURL(blob);

        const w = window.open(blobUrl, '_blank');
        if (!w) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      })
      .catch(err => {
        console.error(err);
        root.uiStore?.showSnackbar?.('No se pudo abrir el contrato', 'danger');
      });
  }, [reservation, root.userStore.accessToken, root.uiStore, api]);

  return (
    <AppShell>
      <Box display="flex" minHeight="100dvh" width="100%">
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}>
          {/* Header */}
          <Toolbar
            disableGutters
            sx={{mb: 2, gap: 1, justifyContent: 'space-between'}}>
            <Typography variant="h6">Detalle de reserva</Typography>
            <Stack direction="row" gap={1}>
              {reservation?.status?.toLowerCase() === 'confirmed' && (
                <Button variant="outlined" onClick={openContract}>
                  📄 Generar contrato
                </Button>
              )}
              <Button onClick={() => navigate(-1)}>Volver</Button>
            </Stack>
          </Toolbar>

          {loading && <LinearProgress sx={{mb: 2}} />}

          {reservation && (
            <Stack spacing={2}>
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

                <Stack direction={{xs: 'column', sm: 'row'}} spacing={3}>
                  <Stack spacing={0.5} sx={{minWidth: 240}}>
                    <Typography variant="body2" color="text.secondary">
                      Cliente (user_id)
                    </Typography>
                    <Typography variant="body1">
                      {reservation.customer_user_id}
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
                        {
                          style: 'currency',
                          currency: 'USD',
                        },
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
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID vehiculo</TableCell>
                        <TableCell align="right">Costo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reservation.items?.length ? (
                        reservation.items.map((it, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{it.vehicle_id}</TableCell>
                            <TableCell align="right">
                              {Number(it.line_amount).toLocaleString(
                                undefined,
                                {
                                  style: 'currency',
                                  currency: 'USD',
                                },
                              )}
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
    </AppShell>
  );
}
