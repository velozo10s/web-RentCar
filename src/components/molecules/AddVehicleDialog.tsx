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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import useApi from '../../lib/hooks/useApi';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../lib/hooks/useStore';
import {type ChangeEvent, useEffect, useState} from 'react';

type Brand = {id: number; name: string};
type VType = {id: number; name: string};

export default function AddVehicleDialog({
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
  const [submitting, setSubmitting] = useState(false);

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
    make_primary: true,
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string; key: string}[]>([]);
  const fileKey = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      // ensure reselecting same file triggers onChange next time
      e.target.value = '';
      return;
    }

    setImages(prev => {
      const prevMap = new Map(prev.map(f => [fileKey(f), f]));
      for (const f of files) {
        const key = fileKey(f);
        if (!prevMap.has(key)) prevMap.set(key, f); // dedupe
      }
      return Array.from(prevMap.values());
    });

    // allow selecting the same file again in a future click
    e.target.value = '';
  };

  useEffect(() => {
    // revoke old urls
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // revoke previous previews before making new ones
    previews.forEach(p => URL.revokeObjectURL(p.url));
    const next = images.map(f => ({
      url: URL.createObjectURL(f),
      key: fileKey(f),
    }));
    setPreviews(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const removeImage = (key: string) => {
    setImages(prev => prev.filter(f => fileKey(f) !== key));
  };

  const clearAllImages = () => {
    setImages([]);
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
      <DialogTitle>{t('vehicles.add') || 'Add vehicle'}</DialogTitle>
      <DialogContent dividers>
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
              <InputLabel id="type-sel">{t('vehicles.fields.type')}</InputLabel>
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

          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}>
                {t('common.add') || 'Upload images'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={onFileChange}
                />
              </Button>

              <FormHelperText sx={{ml: 1}}>
                {t('vehicles.images.filesSelected', {count: images.length})}
              </FormHelperText>
              {images.length > 0 && (
                <Button variant="text" color="inherit" onClick={clearAllImages}>
                  {t('common.reset') || 'Clear all'}
                </Button>
              )}
            </Stack>

            {/* previews grid */}
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
                        display: 'block',
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
                            onClick={() => removeImage(p.key)}
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
