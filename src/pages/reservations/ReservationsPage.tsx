import * as React from 'react';
import {
  Box, Container, Paper, Stack, TextField, InputAdornment, Select, MenuItem,
  Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, FormHelperText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Sidebar from '../../components/Sidebar';
import StatusChip from '../../components/StatusChip';
import type { Reservation } from '../../lib/types/reservations';
import { RESERVATIONS } from '../../data/reservations.mock';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINISHED', label: 'Finalizada' },
  { value: 'CANCELED', label: 'Cancelada' },
] as const;

type StatusFilter = typeof STATUS_OPTIONS[number]['value'];

export default function ReservationsPage() {
  const [rows, setRows] = React.useState<Reservation[]>(RESERVATIONS);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('ALL');
  const [selected, setSelected] = React.useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<string>('');

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString();

  const filtered = rows.filter(r => {
    const matchStatus =
      status === 'ALL' ? true : (r.status || '').toUpperCase() === status;

    const q = query.trim().toLowerCase();
    const itemsVehicleIds = r.items.map(i => String(i.vehicle_id)).join(' ');
    const matchQuery =
      !q ||
      String(r.id).includes(q) ||
      String(r.customer_user_id).includes(q) ||
      itemsVehicleIds.includes(q);

    return matchStatus && matchQuery;
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

  const applyChangeStatus = () => {
    if (!newStatus) return;
    setRows(prev =>
      prev.map(r => (selected.includes(r.id) ? { ...r, status: newStatus } : r))
    );
    setSelected([]);
    closeChangeStatus();
  };

  return (
    <Box display="flex" bgcolor="background.default">
      <Sidebar active="reservas" />

      <Box flex={1} component="main" p={3}>
        <Typography variant="h6" mb={2}>Reservas</Typography>

        {/* Toolbar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
          <FormControl size="small" sx={{ width: 200 }}>
            <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              {STATUS_OPTIONS.map(op => (
                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Estado</FormHelperText>
          </FormControl>

          <Box flex={1} />

          <TextField
            size="small"
            placeholder="Buscar (ID reserva, ID cliente o vehicle_id)"
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
            onClick={openChangeStatus}
            disabled={selected.length === 0}
          >
            Cambiar estado
          </Button>
        </Stack>

        {/* Tabla */}
        <Paper variant="outlined">
          <TableContainer sx={{ maxHeight: 'calc(100dvh - 240px)' }}>
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
                      {row.items.length > 0
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

                {filtered.length === 0 && (
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
                {STATUS_OPTIONS.filter(s => s.value !== 'ALL').map(op => (
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
