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
import Sidebar from '../../components/Sidebar';
import StatusChip from '../../components/StatusChip';
import type {Reservation} from '../../lib/types/reservations';
import useApi from '../../lib/hooks/useApi';
import {useStore} from '../../lib/hooks/useStore';
import {useCallback, useEffect, useState} from 'react';

const STATUS_OPTIONS = [
  {value: 'all', label: 'Todos'},
  {value: 'pending', label: 'Pendiente'},
  {value: 'confirmed', label: 'Confirmada'},
  {value: 'active', label: 'En curso'},
  {value: 'completed', label: 'Finalizada'},
  {value: 'declined', label: 'Rechazada'},
  {value: 'cancelled', label: 'Cancelada'},
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

export default function ReservationsPage() {
  const api = useApi();
  const rootStore = useStore();
  const navigate = useNavigate();

  const [rows, setRows] = useState<Reservation[]>([]);
  const [query, setQuery] = useState('');
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
          // @ts-ignore
          //rootStore.uiStore?.showSnackbar?.('Error al cargar reservas', 'danger');
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
        <Typography variant="h6" mb={2} textAlign="center">
          Reservas
        </Typography>

        {/* Toolbar */}
        <Stack
          direction={{xs: 'column', sm: 'row'}}
          gap={1.5}
          alignItems={{xs: 'stretch', sm: 'center'}}
          mb={2}>
          <FormHelperText sx={{m: 0, mr: 1}}>Estado</FormHelperText>

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
            placeholder="Buscar (ID, ID cliente, vehicle_id, nota)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{width: {xs: '100%', sm: 420}, flexShrink: 0}}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setRefreshing(true);
              fetchReservations({silent: true});
            }}>
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{mb: 1}} />}

        {/* Contenedor de tabla que LLENA el espacio restante */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            minWidth: 0, // permite que la tabla use el 100%
          }}>
          <TableContainer sx={{flex: 1 /* altura completa */, width: '100%'}}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente (user_id)</TableCell>
                  <TableCell>Ítems</TableCell>
                  <TableCell>Fecha desde/Hasta</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.customer_user_id}</TableCell>
                    <TableCell>
                      {row.items?.length
                        ? `${row.items.length} vehículo(s) · ${row.items.map(i => i.vehicle_id).join(', ')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatDate(row.start_at)}&nbsp;hasta&nbsp;
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
                        Ver detalle
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
    </Box>
  );
}
