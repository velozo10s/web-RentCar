// src/pages/vehicles/EditVehicleDialog.tsx
import * as React from 'react';
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tooltip,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RestoreIcon from '@mui/icons-material/Restore';
import useApi from '../../lib/hooks/useApi';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../lib/hooks/useStore';
import {type ChangeEvent, useEffect, useMemo, useState} from 'react';

type Brand = {id: number; name: string};
type VType = {id: number; name: string};

type VehicleDetail = {
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
  mileage?: number;
  maintenance_mileage?: number;
  insurance_fee?: number | string;
  fuel_capacity?: number | string;
  fuel_type?: string; // petrol | diesel | electric | hybrid
  is_active?: boolean;
  make_primary?: boolean;
  images?: Array<{id: number; url: string; is_primary?: boolean}>;
};

export default function EditVehicleDialog({
  open,
  onClose,
  onSaved,
  vehicleId,
  brands,
  types,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vehicleId: number;
  brands: Brand[];
  types: VType[];
}) {
  const api = useApi();
  const {uiStore} = useStore();
  const {t} = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos del vehículo
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);

  // Form state (se crea cuando llega el detalle)
  const [form, setForm] = useState({
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
    make_primary: false,
  });

  // --- Snapshot inicial para detectar cambios (dirty) ---
  const [initialSnapshot, setInitialSnapshot] = useState<{
    form: typeof form | null;
    existingIds: number[];
  } | null>(null);

  // Imágenes existentes (del backend) y a eliminar
  const [existingImages, setExistingImages] = useState<
    Array<{id: number; url: string; is_primary?: boolean}>
  >([]);
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(
    new Set(),
  );

  // Imágenes nuevas (a subir) y previews
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string; key: string}[]>([]);
  const fileKey = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  // --- Cargar detalle al abrir ---
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.getVehicle(vehicleId).handle({
      onSuccess: (res: VehicleDetail) => {
        setVehicle(res);
        // hidrata form
        const hydrated = {
          brand_id: res.brand_id ?? '',
          type_id: res.type_id ?? '',
          model: res.model ?? '',
          year: res.year ?? '',
          license_plate: res.license_plate ?? '',
          transmission: (res.transmission as any) || 'automatic',
          seats: (res.seats as any) ?? '',
          price_per_day: (res.price_per_day as any) ?? '',
          price_per_hour: (res.price_per_hour as any) ?? '',
          color: res.color ?? '',
          vin: res.vin ?? '',
          mileage: (res.mileage as any) ?? '',
          maintenance_mileage: (res.maintenance_mileage as any) ?? '',
          insurance_fee: (res.insurance_fee as any) ?? '',
          fuel_capacity: (res.fuel_capacity as any) ?? '',
          fuel_type: (res.fuel_type as any) || 'petrol',
          make_primary: Boolean(res.make_primary),
        };
        setForm(hydrated);
        setExistingImages(res.images ?? []);
        setRemovedImageIds(new Set());
        setNewImages([]);
        setPreviews([]);
        // snapshot inicial
        setInitialSnapshot({
          form: hydrated,
          existingIds: (res.images ?? []).map(i => i.id),
        });
      },
      onError: (err: any) => {
        uiStore?.showSnackbar?.(
          err?.response?.data?.error ||
            (t('vehicles.feedback.loadError') as any) ||
            'Failed to load vehicle',
          'danger',
        );
        onClose();
      },
      onFinally: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicleId]);

  // --- Previews de nuevas imágenes ---
  useEffect(() => {
    previews.forEach(p => URL.revokeObjectURL(p.url));
    const next = newImages.map(f => ({
      url: URL.createObjectURL(f),
      key: fileKey(f),
    }));
    setPreviews(next);
    return () => {
      next.forEach(p => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newImages]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      e.target.value = '';
      return;
    }
    setNewImages(prev => {
      const prevMap = new Map(prev.map(f => [fileKey(f), f]));
      for (const f of files) {
        const key = fileKey(f);
        if (!prevMap.has(key)) prevMap.set(key, f); // dedupe
      }
      return Array.from(prevMap.values());
    });
    e.target.value = '';
  };

  const removeNewImage = (key: string) => {
    setNewImages(prev => prev.filter(f => fileKey(f) !== key));
  };

  const toggleRemoveExisting = (imgId: number) => {
    setRemovedImageIds(prev => {
      const next = new Set(prev);
      next.has(imgId) ? next.delete(imgId) : next.add(imgId);
      return next;
    });
  };

  const removedCount = removedImageIds.size;

  // --- Utils para dirty/valid ---
  const shallowEqual = (a: any, b: any) => {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  };

  const normalizeForm = (f: typeof form) => ({
    ...f,
    brand_id: f.brand_id || '',
    type_id: f.type_id || '',
    model: String(f.model || ''),
    year: String(f.year || ''),
    license_plate: String(f.license_plate || ''),
    transmission: String(f.transmission || ''),
    seats: String(f.seats || ''),
    price_per_day: String(f.price_per_day || ''),
    price_per_hour: String(f.price_per_hour || ''),
    color: String(f.color || ''),
    vin: String(f.vin || ''),
    mileage: String(f.mileage || ''),
    maintenance_mileage: String(f.maintenance_mileage || ''),
    insurance_fee: String(f.insurance_fee || ''),
    fuel_capacity: String(f.fuel_capacity || ''),
    fuel_type: String(f.fuel_type || ''),
    make_primary: Boolean(f.make_primary),
  });

  // 🔎 calcula diff de campos (sin imágenes)
  const getChangedFieldEntries = () => {
    if (!initialSnapshot?.form) return [] as Array<[keyof typeof form, any]>;
    const curr = normalizeForm(form);
    const base = normalizeForm(initialSnapshot.form);
    const changed: Array<[keyof typeof form, any]> = [];
    (Object.keys(curr) as Array<keyof typeof form>).forEach(k => {
      if (curr[k] !== (base as any)[k]) {
        changed.push([k, curr[k]]);
      }
    });
    return changed;
  };

  const isFormValid = useMemo(() => {
    return Boolean(
      form.brand_id &&
        form.type_id &&
        form.model &&
        form.year &&
        form.license_plate,
    );
  }, [form]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    const sameForm = shallowEqual(
      normalizeForm(form),
      normalizeForm(initialSnapshot.form as typeof form),
    );
    const anyNew = newImages.length > 0;
    const anyRemoved = removedImageIds.size > 0;
    return !(sameForm && !anyNew && !anyRemoved);
  }, [form, initialSnapshot, newImages.length, removedImageIds]);

  // --- Submit (multipart, solo cambios) ---
  const handleSubmit = () => {
    if (!vehicle) return;

    if (!isFormValid) {
      uiStore?.showSnackbar?.(
        t('vehicles.feedback.missingFields') ||
          'Please complete required fields',
        'warning',
      );
      return;
    }

    if (!isDirty) {
      uiStore?.showSnackbar?.(
        t('employees.feedback.noChanges') || 'No changes to save',
        'info',
      );
      return;
    }

    setSubmitting(true);
    const fd = new FormData();

    // Mapea claves del form -> nombres en API (son iguales aquí)
    const apiFieldName: Record<keyof typeof form, string> = {
      brand_id: 'brand_id',
      type_id: 'type_id',
      model: 'model',
      year: 'year',
      license_plate: 'license_plate',
      transmission: 'transmission',
      seats: 'seats',
      price_per_day: 'price_per_day',
      price_per_hour: 'price_per_hour',
      color: 'color',
      vin: 'vin',
      mileage: 'mileage',
      maintenance_mileage: 'maintenance_mileage',
      insurance_fee: 'insurance_fee',
      fuel_capacity: 'fuel_capacity',
      fuel_type: 'fuel_type',
      make_primary: 'make_primary',
    };

    // ➤ Solo campos cambiados
    const changedEntries = getChangedFieldEntries();
    changedEntries.forEach(([k, v]) => {
      const name = apiFieldName[k];
      // stringifica booleans o numbers para FormData
      fd.append(name, typeof v === 'boolean' ? String(v) : String(v ?? ''));
    });

    // ➤ Imágenes nuevas (si hay)
    newImages.forEach(file => fd.append('images', file));

    // ➤ Imágenes a eliminar (IDs separados por coma)
    if (removedImageIds.size > 0) {
      fd.append('delete_image_ids', Array.from(removedImageIds).join(','));
    }

    api.updateVehicle(vehicle.id, fd).handle({
      onSuccess: () => {
        uiStore?.showSnackbar?.(
          t('vehicles.feedback.updated') || 'Vehicle updated',
          'success',
        );
        onSaved();
      },
      onError: (err: any) => {
        uiStore?.showSnackbar?.(
          err?.response?.data?.error ||
            (t('vehicles.feedback.updateError') as any) ||
            'Update failed',
          'danger',
        );
      },
      onFinally: () => setSubmitting(false),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('vehicles.edit') || 'Edit vehicle'}</DialogTitle>
      <DialogContent dividers>
        {/* Campos deshabilitados mientras carga el detalle */}
        <fieldset disabled={loading} style={{border: 0, padding: 0, margin: 0}}>
          <Stack spacing={2} mt={1}>
            {/* Fila 1: Marca / Tipo / Modelo / Año */}
            <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
              <FormControl size="small" fullWidth>
                <InputLabel id="brand-sel">
                  {t('vehicles.fields.brand')}
                </InputLabel>
                <Select
                  labelId="brand-sel"
                  label={t('vehicles.fields.brand')}
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
                  {t('vehicles.fields.type')}
                </InputLabel>
                <Select
                  labelId="type-sel"
                  label={t('vehicles.fields.type')}
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
                label={t('vehicles.fields.model')}
                size="small"
                value={form.model}
                onChange={e => set('model', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.year')}
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
                label={t('vehicles.fields.license_plate')}
                size="small"
                value={form.license_plate}
                onChange={e => set('license_plate', e.target.value)}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel id="tx-label">
                  {t('vehicles.fields.transmission')}
                </InputLabel>
                <Select
                  labelId="tx-label"
                  label={t('vehicles.fields.transmission')}
                  value={form.transmission}
                  onChange={e => set('transmission', e.target.value as any)}>
                  <MenuItem value="automatic">
                    {t('vehicles.transmission.automatic')}
                  </MenuItem>
                  <MenuItem value="manual">
                    {t('vehicles.transmission.manual')}
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={t('vehicles.fields.seats')}
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
                label={t('vehicles.fields.price_per_day')}
                size="small"
                type="number"
                value={form.price_per_day}
                onChange={e => set('price_per_day', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.price_per_hour')}
                size="small"
                type="number"
                value={form.price_per_hour}
                onChange={e => set('price_per_hour', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.color')}
                size="small"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                fullWidth
              />
            </Stack>

            {/* Fila 4 */}
            <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
              <TextField
                label={t('vehicles.fields.vin')}
                size="small"
                value={form.vin}
                onChange={e => set('vin', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.mileage')}
                size="small"
                type="number"
                value={form.mileage}
                onChange={e => set('mileage', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.maintenance_mileage')}
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
                label={t('vehicles.fields.insurance_fee')}
                size="small"
                type="number"
                value={form.insurance_fee}
                onChange={e => set('insurance_fee', e.target.value)}
                fullWidth
              />
              <TextField
                label={t('vehicles.fields.fuel_capacity')}
                size="small"
                type="number"
                value={form.fuel_capacity}
                onChange={e => set('fuel_capacity', e.target.value)}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel id="fuel-label">
                  {t('vehicles.fields.fuel_type')}
                </InputLabel>
                <Select
                  labelId="fuel-label"
                  label={t('vehicles.fields.fuel_type')}
                  value={form.fuel_type}
                  onChange={e => set('fuel_type', e.target.value as any)}>
                  <MenuItem value="petrol">Petrol</MenuItem>
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Imágenes existentes */}
            {existingImages.length > 0 && (
              <Stack spacing={1}>
                <FormHelperText>
                  {t('vehicles.images.current') || 'Current images'}
                </FormHelperText>
                <ImageList
                  cols={Math.min(4, existingImages.length)}
                  gap={8}
                  sx={{m: 0}}>
                  {existingImages.map(img => {
                    const marked = removedImageIds.has(img.id);
                    return (
                      <ImageListItem key={img.id}>
                        <img
                          src={img.url}
                          alt={`img-${img.id}`}
                          loading="lazy"
                          style={{
                            borderRadius: 4,
                            objectFit: 'cover',
                            width: '100%',
                            height: 160,
                            filter: marked
                              ? 'grayscale(1) opacity(0.5)'
                              : undefined,
                          }}
                        />
                        <ImageListItemBar
                          position="top"
                          actionIcon={
                            <Tooltip
                              title={
                                marked
                                  ? t('common.restore') || 'Restore'
                                  : t('common.delete') || 'Delete'
                              }>
                              <IconButton
                                sx={{
                                  color: 'white',
                                  bgcolor: 'rgba(0,0,0,0.35)',
                                  '&:hover': {bgcolor: 'rgba(0,0,0,0.6)'},
                                }}
                                onClick={() => toggleRemoveExisting(img.id)}
                                size="small"
                                aria-label="toggle remove">
                                {marked ? (
                                  <RestoreIcon fontSize="small" />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          }
                          actionPosition="right"
                          sx={{background: 'transparent'}}
                        />
                        {img.is_primary && (
                          <ImageListItemBar
                            position="bottom"
                            title={
                              <Chip
                                size="small"
                                color="primary"
                                label={
                                  t('vehicles.images.primary') || 'Primary'
                                }
                              />
                            }
                            sx={{background: 'transparent'}}
                          />
                        )}
                      </ImageListItem>
                    );
                  })}
                </ImageList>
                {!!removedCount && (
                  <FormHelperText>
                    {t('vehicles.images.toRemove', {count: removedCount}) ||
                      `${removedCount} to remove`}
                  </FormHelperText>
                )}
              </Stack>
            )}

            {/* Nuevas imágenes */}
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}>
                  {t('common.add') || 'Add images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={onFileChange}
                  />
                </Button>
                <FormHelperText sx={{ml: 1}}>
                  {t('vehicles.images.filesSelected', {
                    count: newImages.length,
                  })}
                </FormHelperText>
                {newImages.length > 0 && (
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => setNewImages([])}>
                    {t('common.reset') || 'Clear all'}
                  </Button>
                )}
              </Stack>

              {previews.length > 0 && (
                <ImageList
                  cols={Math.min(4, previews.length)}
                  gap={8}
                  sx={{m: 0}}>
                  {previews.map(p => (
                    <ImageListItem key={p.key}>
                      <img
                        src={p.url}
                        alt={p.key.split('::')[0]}
                        loading="lazy"
                        style={{
                          borderRadius: 4,
                          objectFit: 'cover',
                          width: '100%',
                          height: 160,
                        }}
                      />
                      <ImageListItemBar
                        position="top"
                        actionIcon={
                          <Tooltip title={t('common.delete') || 'Delete'}>
                            <IconButton
                              sx={{
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.35)',
                                '&:hover': {bgcolor: 'rgba(0,0,0,0.6)'},
                              }}
                              onClick={() => removeNewImage(p.key)}
                              size="small"
                              aria-label="delete image">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                        actionPosition="right"
                        sx={{background: 'transparent'}}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Stack>
          </Stack>
        </fieldset>
      </DialogContent>

      <DialogActions>
        {/* Revertir cambios si hay dirty */}
        {initialSnapshot && (
          <Button
            variant="text"
            color="inherit"
            onClick={() => {
              setForm(initialSnapshot.form as typeof form);
              setRemovedImageIds(new Set());
              setNewImages([]);
            }}
            disabled={!isDirty || submitting || loading}>
            {t('common.reset') || 'Reset'}
          </Button>
        )}

        <Button onClick={onClose} disabled={submitting || loading}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            submitting || loading || !vehicle || !isDirty || !isFormValid
          }>
          {submitting
            ? t('common.saving') || 'Saving…'
            : t('common.save') || 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
