// src/pages/vehicles/VehiclesPage.tsx
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
} from '@mui/material';
import AppShell from '../../../components/AppShell';
import useApi from '../../../lib/hooks/useApi';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../../lib/hooks/useStore';

type Vehicle = {
  id: number;
  brand_id: number;
  type_id: number;
  model: string;
  year: number;
  license_plate: string;
  transmission: 'manual' | 'automatic' | string;
  seats: number;
  price_per_day: number;
  price_per_hour?: number;
  vin?: string;
  color?: string;
};

type Brand = {id: number; name: string};
type VType = {id: number; name: string};

export default function VehiclesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const {t} = useTranslation();
  const {uiStore} = useStore();

  const [rows, setRows] = React.useState<Vehicle[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [types, setTypes] = React.useState<VType[]>([]);
  const [metaLoading, setMetaLoading] = React.useState(false);

  // Filtros
  const [query, setQuery] = React.useState('');
  const [brand, setBrand] = React.useState<'all' | number>('all');
  const [vtype, setVtype] = React.useState<'all' | number>('all');
  const [transmission, setTransmission] = React.useState<
    'all' | 'manual' | 'automatic'
  >('all');

  // Estados de lista
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Helpers para mostrar nombre por id
  const brandName = React.useCallback(
    (id?: number) =>
      brands.find(b => b.id === id)?.name ?? (id ? `#${id}` : '—'),
    [brands],
  );
  const typeName = React.useCallback(
    (id?: number) =>
      types.find(t => t.id === id)?.name ?? (id ? `#${id}` : '—'),
    [types],
  );

  const fetchVehicles = React.useCallback(
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

  const fetchMeta = React.useCallback(() => {
    setMetaLoading(true);
    api.getVehicleBrands().handle({
      onSuccess: (res: Brand[]) => setBrands(res ?? []),
      onFinally: () => setMetaLoading(false),
    });
    api.getVehicleTypes().handle({
      onSuccess: (res: VType[]) => setTypes(res ?? []),
    });
  }, [api]);

  React.useEffect(() => {
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

  const handleDelete = (id: number) => {
    setDeletingId(id);
    api.deleteVehicle(id).handle({
      onSuccess: () => {
        uiStore?.showSnackbar?.(
          t('vehicles.feedback.deleted') || 'Vehicle deleted',
          'success',
        );
        fetchVehicles({silent: true});
      },
      onError: (err: any) => {
        uiStore?.showSnackbar?.(
          err?.response?.data?.error ||
            (t('vehicles.feedback.deleteError') as any) ||
            'Delete failed',
          'danger',
        );
      },
      onFinally: () => setDeletingId(null),
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
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.seats')}
                  </TableCell>
                  <TableCell>
                    {t('vehicles.vehicleTable.columns.pricePerDay')}
                  </TableCell>
                  <TableCell align="center">
                    {t('common.actions') || 'Actions'}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
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
                    <TableCell>{row.seats}</TableCell>
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
                          onClick={() => navigate(`/vehicles/${row.id}/edit`)}>
                          {t('common.edit') || 'Edit'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={deletingId === row.id}
                          onClick={() => handleDelete(row.id)}>
                          {deletingId === row.id
                            ? t('common.deleting') || 'Deleting…'
                            : t('common.delete') || 'Delete'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      align="center"
                      sx={{py: 6, color: 'text.secondary'}}>
                      {t('vehicles.empty') || 'No results'}
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
      </Box>
    </AppShell>
  );
}

/* -------------------- Add Vehicle Dialog -------------------- */

function AddVehicleDialog({
  open,
  onClose,
  onCreated,
  brands,
  types,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  brands: Brand[];
  types: VType[];
}) {
  const api = useApi();
  const {uiStore} = useStore();
  const {t} = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    brand_id: '' as string | number,
    type_id: '' as string | number,
    model: '',
    year: '' as string | number,
    license_plate: '',
    transmission: 'automatic',
    seats: '' as string | number,
    price_per_day: '' as string | number,
    price_per_hour: '' as string | number,
    color: '',
    vin: '',
    mileage: '' as string | number,
    maintenance_mileage: '' as string | number,
    insurance_fee: '' as string | number,
    fuel_capacity: '' as string | number,
    fuel_type: 'petrol',
    make_primary: true,
  });
  const [images, setImages] = React.useState<File[]>([]);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages(files);
  };

  const handleSubmit = () => {
    // Validación rápida de obligatorios mínimos
    if (
      !form.brand_id ||
      !form.type_id ||
      !form.model ||
      !form.year ||
      !form.license_plate
    ) {
      uiStore?.showSnackbar?.(
        t('vehicles.feedback.missingFields') ||
          'Please complete required fields',
        'warning',
      );
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('brand_id', String(form.brand_id)); // 👈 envía ID
    fd.append('type_id', String(form.type_id)); // 👈 envía ID
    fd.append('model', form.model);
    fd.append('year', String(form.year));
    fd.append('license_plate', form.license_plate);
    fd.append('price_per_hour', String(form.price_per_hour || ''));
    fd.append('price_per_day', String(form.price_per_day || ''));
    fd.append('transmission', form.transmission);
    fd.append('seats', String(form.seats || ''));
    if (form.color) fd.append('color', form.color);
    if (form.vin) fd.append('vin', form.vin);
    if (form.mileage) fd.append('mileage', String(form.mileage));
    if (form.maintenance_mileage)
      fd.append('maintenance_mileage', String(form.maintenance_mileage));
    if (form.insurance_fee)
      fd.append('insurance_fee', String(form.insurance_fee));
    if (form.fuel_capacity)
      fd.append('fuel_capacity', String(form.fuel_capacity));
    if (form.fuel_type) fd.append('fuel_type', form.fuel_type);
    fd.append('make_primary', String(form.make_primary));
    images.forEach(file => fd.append('images', file));

    api.addVehicle(fd).handle({
      onSuccess: () => {
        uiStore?.showSnackbar?.(
          t('vehicles.feedback.created') || 'Vehicle created',
          'success',
        );
        onCreated();
      },
      onError: (err: any) => {
        uiStore?.showSnackbar?.(
          err?.response?.data?.error ||
            (t('vehicles.feedback.createError') as any) ||
            'Create failed',
          'danger',
        );
      },
      onFinally: () => setSubmitting(false),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('vehicles.add.title') || 'Add vehicle'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {/* Fila 1: Marca / Tipo / Modelo / Año */}
          <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="brand-sel">
                {t('vehicles.filters.brand') || 'Brand'}
              </InputLabel>
              <Select
                labelId="brand-sel"
                label={t('vehicles.filters.brand') || 'Brand'}
                value={form.brand_id}
                onChange={e => set('brand_id', e.target.value)}>
                {brands.map(b => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="type-sel">
                {t('vehicles.filters.type') || 'Type'}
              </InputLabel>
              <Select
                labelId="type-sel"
                label={t('vehicles.filters.type') || 'Type'}
                value={form.type_id}
                onChange={e => set('type_id', e.target.value)}>
                {types.map(tp => (
                  <MenuItem key={tp.id} value={tp.id}>
                    {tp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Model"
              size="small"
              value={form.model}
              onChange={e => set('model', e.target.value)}
              fullWidth
            />
            <TextField
              label="Year"
              size="small"
              type="number"
              value={form.year}
              onChange={e => set('year', e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Fila 2 */}
          <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField
              label="License plate"
              size="small"
              value={form.license_plate}
              onChange={e => set('license_plate', e.target.value)}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="tx-label">Transmission</InputLabel>
              <Select
                labelId="tx-label"
                label="Transmission"
                value={form.transmission}
                onChange={e => set('transmission', e.target.value as any)}>
                <MenuItem value="automatic">Automatic</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Seats"
              size="small"
              type="number"
              value={form.seats}
              onChange={e => set('seats', e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Fila 3 */}
          <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField
              label="Price/day (USD)"
              size="small"
              type="number"
              value={form.price_per_day}
              onChange={e => set('price_per_day', e.target.value)}
              fullWidth
            />
            <TextField
              label="Price/hour (USD)"
              size="small"
              type="number"
              value={form.price_per_hour}
              onChange={e => set('price_per_hour', e.target.value)}
              fullWidth
            />
            <TextField
              label="Color"
              size="small"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Fila 4 */}
          <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField
              label="VIN"
              size="small"
              value={form.vin}
              onChange={e => set('vin', e.target.value)}
              fullWidth
            />
            <TextField
              label="Mileage"
              size="small"
              type="number"
              value={form.mileage}
              onChange={e => set('mileage', e.target.value)}
              fullWidth
            />
            <TextField
              label="Maint. mileage"
              size="small"
              type="number"
              value={form.maintenance_mileage}
              onChange={e => set('maintenance_mileage', e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Fila 5 */}
          <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField
              label="Insurance fee"
              size="small"
              type="number"
              value={form.insurance_fee}
              onChange={e => set('insurance_fee', e.target.value)}
              fullWidth
            />
            <TextField
              label="Fuel capacity"
              size="small"
              type="number"
              value={form.fuel_capacity}
              onChange={e => set('fuel_capacity', e.target.value)}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="fuel-label">Fuel type</InputLabel>
              <Select
                labelId="fuel-label"
                label="Fuel type"
                value={form.fuel_type}
                onChange={e => set('fuel_type', e.target.value as any)}>
                <MenuItem value="petrol">Petrol</MenuItem>
                <MenuItem value="diesel">Diesel</MenuItem>
                <MenuItem value="electric">Electric</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Imágenes */}
          <Box>
            <Button component="label" variant="outlined">
              Upload images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={onFileChange}
              />
            </Button>
            <FormHelperText sx={{ml: 1}}>
              {images.length} file(s) selected
            </FormHelperText>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}>
          {submitting
            ? t('common.saving') || 'Saving…'
            : t('common.save') || 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
