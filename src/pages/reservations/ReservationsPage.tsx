import * as React from 'react';
import {
  Box, Paper, Stack, TextField, InputAdornment, Select, MenuItem,
  Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, FormHelperText, LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Sidebar from '../../components/Sidebar';
import StatusChip from '../../components/StatusChip';
import type { Reservation } from '../../lib/types/reservations';
import useApi from '../../lib/hooks/useApi';
import { useStore } from '../../lib/hooks/useStore';
import {useEffect} from 'react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'active', label: 'En curso' },
  { value: 'completed', label: 'Finalizada' },
  { value: 'declined', label: 'Rechazada' },
  { value: 'cancelled', label: 'Cancelada' },
] as const;

type StatusFilter = typeof STATUS_OPTIONS[number]['value'];

export default function ReservationsPage() {
  const api = useApi();
  const rootStore = useStore();

  const [rows, setRows] = React.useState<Reservation[]>([]);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [selected, setSelected] = React.useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const fetchReservations = React.useCallback((opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);

    const params = { status }; // <- tal cual pediste
    api.listReservations(params).handle({
      onSuccess: (res: Reservation[]) => {
        setRows(res ?? []);
      },
      onError: () => {
        setLoading(false);
        setRefreshing(false);
        // @ts-ignore
        //rootStore.uiStore.showSnackbar(err?.response?.data?.error ?? 'Error al cargar reservas', 'danger');
      },
      onFinally: () => {
        setLoading(false);
        setRefreshing(false);
      },
    });
  }, [api, status]);

  // Carga inicial + cada vez que cambia el filtro de estado
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Filtro local por búsqueda
  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const inId = String(r.id).includes(q);
    const inCustomer = String(r.customer_user_id).includes(q);
    const inItems = r.items?.some(i => String(i.vehicle_id).includes(q));
    const inNote = (r.note || '').toLowerCase().includes(q);
    return inId || inCustomer || inItems || inNote;
  });

  const visibleIds = filtered.map(r => r.id);
  const allSelectedVisible = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));

  const toggleSelect = (id: number) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const toggleSelectAllVisible = () =>
    setSelected(prev =>
      allSelectedVisible ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))
    );

  const openChangeStatus = () => setDialogOpen(true);
  const closeChangeStatus = () => { setDialogOpen(false); setNewStatus(''); };

  // TODO: aquí podrías llamar a tu endpoint PATCH/PUT para cambiar estado de las seleccionadas
  const applyChangeStatus = () => {
    if (!newStatus) return;
    // ejemplo de optimista local
    setRows(prev => prev.map(r => (selected.includes(r.id) ? { ...r, status: newStatus } : r)));
    setSelected([]);
    closeChangeStatus();
    // Si quieres server-side:
    // await api.changeReservationStatus({ ids: selected, status: newStatus }).handle({...})
    // luego refetchReservations({ silent: true });
  };

  return (
    <Box display="flex" bgcolor="background.default">
      <Sidebar active="reservas" />

      <Box flex={1} component="main" p={3}>
        <Typography variant="h6" mb={2}>Reservas</Typography>

        {/* Toolbar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
          <FormControl size="small" sx={{ width: 220 }}>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map(op => (
                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Estado</FormHelperText>
          </FormControl>

          <Box flex={1} />

          <TextField
            size="small"
            placeholder="Buscar (ID, ID cliente, vehicle_id, nota)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 360 } }}
          />

          <Button
            variant="outlined"
            onClick={() => { setRefreshing(true); fetchReservations({ silent: true }); }}
          >
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Button>

          <Button
            variant="outlined"
            onClick={openChangeStatus}
            disabled={selected.length === 0}
          >
            Cambiar estado
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 1 }} />}

        {/* Tabla */}
        <Paper variant="outlined">
          <TableContainer sx={{ maxHeight: 'calc(100dvh - 260px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && !allSelectedVisible}
                      checked={allSelectedVisible}
                      onChange={toggleSelectAllVisible}
                    />
                  </TableCell>
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
                  <TableRow key={row.id} hover selected={selected.includes(row.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.customer_user_id}</TableCell>
                    <TableCell>
                      {row.items?.length
                        ? `${row.items.length} vehículo(s) · ${row.items.map(i => i.vehicle_id).join(', ')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatDate(row.start_at)}&nbsp;hasta&nbsp;{formatDate(row.end_at)}
                    </TableCell>
                    <TableCell>
                      {Number(row.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell align="center">
                      <Button size="small">Ver detalle/Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog Cambiar Estado */}
        <Dialog open={dialogOpen} onClose={closeChangeStatus}>
          <DialogTitle>Cambiar estado</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(String(e.target.value))}
                displayEmpty
              >
                <MenuItem value=""><em>Selecciona un estado</em></MenuItem>
                {STATUS_OPTIONS.filter(s => s.value !== 'all').map(op => (
                  <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {selected.length} reserva(s) seleccionada(s)
              </FormHelperText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeChangeStatus}>Cancelar</Button>
            <Button variant="contained" onClick={applyChangeStatus} disabled={!newStatus}>
              Aplicar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
