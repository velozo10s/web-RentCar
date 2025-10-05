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
  InputLabel,
  Chip,
} from '@mui/material';
import AppShell from '../../../components/AppShell';
import useApi from '../../../lib/hooks/useApi';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../../lib/hooks/useStore';
import AddVehicleDialog from '../../../components/molecules/AddVehicleDialog.tsx';
import {useCallback, useEffect, useState} from 'react';
import EditVehicleDialog from '../../../components/molecules/EditVehicleDialog.tsx';

type Vehicle = {
  id: number;
  brand_id: number;
  type_id: number;
  model: string;
  year: number;
  license_plate: string;
  transmission: 'manual' | 'automatic' | string;
  seats: number; // ya no se muestra en tabla, pero lo dejo en el tipo por si lo usas en otros lados
  price_per_day: number;
  price_per_hour?: number;
  vin?: string;
  color?: string;
  is_active: boolean; // 👈 nuevo
};

type Brand = {id: number; name: string};
type VType = {id: number; name: string};

export default function VehiclesPage() {
  const api = useApi();
  const {t} = useTranslation();
  const {uiStore} = useStore();

  const [rows, setRows] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [types, setTypes] = useState<VType[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // Filtros
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<'all' | number>('all');
  const [vtype, setVtype] = useState<'all' | number>('all');
  const [transmission, setTransmission] = useState<
    'all' | 'manual' | 'automatic'
  >('all');

  // Estados de lista
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Toggle active
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Helpers para mostrar nombre por id
  const brandName = useCallback(
    (id?: number) =>
      brands.find(b => b.id === id)?.name ?? (id ? `#${id}` : '—'),
    [brands],
  );
  const typeName = useCallback(
    (id?: number) =>
      types.find(t => t.id === id)?.name ?? (id ? `#${id}` : '—'),
    [types],
  );

  const fetchVehicles = useCallback(
    (opts?: {silent?: boolean}) => {
      if (!opts?.silent) setLoading(true);
      api.listVehicles({}).handle({
        onSuccess: (res: Vehicle[]) => setRows(res ?? []),
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
    [api],
  );

  const fetchMeta = useCallback(() => {
    setMetaLoading(true);
    api.getVehicleBrands().handle({
      onSuccess: (res: Brand[]) => setBrands(res ?? []),
      onFinally: () => setMetaLoading(false),
    });
    api.getVehicleTypes().handle({
      onSuccess: (res: VType[]) => setTypes(res ?? []),
    });
  }, [api]);

  useEffect(() => {
    fetchMeta();
    fetchVehicles();
  }, [fetchMeta, fetchVehicles]);

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    if (q) {
      const inModel = r.model?.toLowerCase().includes(q);
      const inPlate = r.license_plate?.toLowerCase().includes(q);
      const inVin = (r.vin || '').toLowerCase().includes(q);
      if (!inModel && !inPlate && !inVin) return false;
    }
    if (brand !== 'all' && r.brand_id !== brand) return false;
    if (vtype !== 'all' && r.type_id !== vtype) return false;
    return !(transmission !== 'all' && r.transmission !== transmission);
  });

  const handleToggleActive = (id: number, nextActive: boolean) => {
    setTogglingId(id);
    // Ajusta esta llamada a tu API real si difiere
    api.updateVehicle(id, {is_active: nextActive}).handle({
      onSuccess: () => {
        uiStore?.showSnackbar?.(
          nextActive
            ? t('vehicles.feedback.activated') || 'Vehicle activated'
            : t('vehicles.feedback.deactivated') || 'Vehicle deactivated',
          'success',
        );
        fetchVehicles({silent: true});
      },
      onError: (err: any) => {
        uiStore?.showSnackbar?.(
          err?.response?.data?.error ||
            (nextActive
              ? (t('vehicles.feedback.activateError') as any) ||
                'Activate failed'
              : (t('vehicles.feedback.deactivateError') as any) ||
                'Deactivate failed'),
          'danger',
        );
      },
      onFinally: () => setTogglingId(null),
    });
  };

  return (
    <AppShell>
      <Box
        component="main"
        sx={{p: 3, display: 'flex', flexDirection: 'column'}}>
        <Typography variant="h6" mb={2} textAlign="center">
          {t('vehicles.title') || 'Vehicles'}
        </Typography>

        {/* Toolbar de filtros + acciones */}
        <Stack
          direction={{xs: 'column', sm: 'row'}}
          gap={1.5}
          alignItems={{xs: 'stretch', sm: 'center'}}
          mb={2}>
          <FormHelperText sx={{m: 0, mr: 1}}>
            {t('vehicles.filters.title') || 'Filters'}
          </FormHelperText>

          {/* Marca */}
          <FormControl size="small" sx={{width: 220}} disabled={metaLoading}>
            <InputLabel id="brand-label">
              {t('vehicles.filters.brand') || 'Brand'}
            </InputLabel>
            <Select
              labelId="brand-label"
              label={t('vehicles.filters.brand') || 'Brand'}
              value={brand}
              onChange={e => setBrand(e.target.value as any)}>
              <MenuItem value="all">{t('common.any') || 'All'}</MenuItem>
              {brands.map(b => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tipo */}
          <FormControl size="small" sx={{width: 220}} disabled={metaLoading}>
            <InputLabel id="type-label">
              {t('vehicles.filters.type') || 'Type'}
            </InputLabel>
            <Select
              labelId="type-label"
              label={t('vehicles.filters.type') || 'Type'}
              value={vtype}
              onChange={e => setVtype(e.target.value as any)}>
              <MenuItem value="all">{t('common.any') || 'All'}</MenuItem>
              {types.map(tp => (
                <MenuItem key={tp.id} value={tp.id}>
                  {tp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Transmisión */}
          <FormControl size="small" sx={{width: 180}}>
            <InputLabel id="tx-label">
              {t('vehicles.filters.transmission') || 'Transmission'}
            </InputLabel>
            <Select
              labelId="tx-label"
              label={t('vehicles.filters.transmission') || 'Transmission'}
              value={transmission}
              onChange={e => setTransmission(e.target.value as any)}>
              <MenuItem value="all">{t('common.any') || 'All'}</MenuItem>
              <MenuItem value="manual">
                {t('vehicles.transmission.manual') || 'Manual'}
              </MenuItem>
              <MenuItem value="automatic">
                {t('vehicles.transmission.automatic') || 'Automatic'}
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{flex: 1}} />

          {/* Búsqueda */}
          <TextField
            size="small"
            placeholder={
              t('vehicles.search') || 'Search by model, plate, or VIN'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{width: {xs: '100%', sm: 320}, flexShrink: 0}}
          />

          {/* Refresh */}
          <Button
            variant="outlined"
            onClick={() => {
              setRefreshing(true);
              fetchVehicles({silent: true});
            }}>
            {refreshing
              ? t('common.refreshing') || 'Refreshing…'
              : t('common.refresh') || 'Refresh'}
          </Button>

          {/* ADD */}
          <Button variant="contained" onClick={() => setAddOpen(true)}>
            {t('common.add') || 'Add vehicle'}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{mb: 1}} />}

        {/* Tabla */}
        <Paper variant="outlined" sx={{display: 'flex'}}>
          <TableContainer sx={{flex: 1, width: '100%'}}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('vehicles.vehicleTable.columns.id')}</TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.brand')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.type')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.model')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.year')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.plate')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.transmission')}
                  </TableCell>
                  {/* Nueva columna: Active */}
                  <TableCell>{t('common.active') || 'Active'}</TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.pricePerDay')}
                  </TableCell>
                  <TableCell align="center">
                    {t('common.actions') || 'Actions'}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => {
                  const isActive = row.is_active;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{brandName(row.brand_id)}</TableCell>
                      <TableCell>{typeName(row.type_id)}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell>{row.year}</TableCell>
                      <TableCell>{row.license_plate}</TableCell>
                      <TableCell>
                        {t(`vehicles.transmission.${row.transmission}`)}
                      </TableCell>
                      {/* Chip Active */}
                      <TableCell>
                        <Chip
                          label={
                            isActive
                              ? t('common.active') || 'Active'
                              : t('common.inactive') || 'Inactive'
                          }
                          color={isActive ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {Number(row.price_per_day).toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" gap={1} justifyContent="center">
                          <Button
                            size="small"
                            onClick={() => {
                              setEditId(row.id);
                              setEditOpen(true);
                            }}>
                            {t('common.edit') || 'Edit'}
                          </Button>

                          {/* Activar / Desactivar */}
                          {isActive ? (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={togglingId === row.id}
                              onClick={() => handleToggleActive(row.id, false)}>
                              {togglingId === row.id
                                ? t('common.deactivating') || 'Deactivating…'
                                : t('common.deactivate') || 'Deactivate'}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={togglingId === row.id}
                              onClick={() => handleToggleActive(row.id, true)}>
                              {togglingId === row.id
                                ? t('common.activating') || 'Activating…'
                                : t('common.activate') || 'Activate'}
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      align="center"
                      sx={{py: 6, color: 'text.secondary'}}>
                      {t('common.empty') || 'No results'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog de Alta */}
        <AddVehicleDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            fetchVehicles({silent: true});
          }}
          brands={brands}
          types={types}
        />

        {editOpen && editId != null && (
          <EditVehicleDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              fetchVehicles({silent: true});
            }}
            vehicleId={editId}
            brands={brands}
            types={types}
          />
        )}
      </Box>
    </AppShell>
  );
}
