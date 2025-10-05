// src/pages/employees/AddEmployeeDialog.tsx
import * as React from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../lib/hooks/useStore';
import useApi from '../../lib/hooks/useApi';
import {useState} from 'react';

type DocTypeCode = 'CI' | 'PASSPORT' | 'DL' | string;

export default function AddEmployeeDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const {t} = useTranslation();
  const {uiStore} = useStore();
  const api = useApi();

  const [submitting, setSubmitting] = useState(false);

  // Campos requeridos por tu /register actual:
  const [form, setForm] = useState({
    // persona
    documentType: 'CI' as DocTypeCode, // tu service busca por code, ej: 'CI' o 'PASSPORT'
    documentNumber: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    nationalityCode: 'PY',
    birthDate: '', // YYYY-MM-DD

    // usuario
    username: '',
    email: '',
    password: '',
  });

  // Archivos (opcionales, pero soportados por tu endpoint)
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);

  const [expirationDocument, setExpirationDocument] = useState(''); // YYYY-MM-DD
  const [expirationLicense, setExpirationLicense] = useState(''); // YYYY-MM-DD
  const [passportEntryDate, setPassportEntryDate] = useState(''); // YYYY-MM-DD (si aplica)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  const validate = () => {
    if (!form.username || !form.email || !form.password) {
      return 'Complete username, email y password.';
    }
    if (!form.documentNumber) {
      return 'Ingrese documentNumber.';
    }
    if (!form.firstName) {
      return 'Ingrese firstName.';
    }
    if (!form.documentType) {
      return 'Seleccione documentType (CI/PASSPORT/...).';
    }
    if (form.nationalityCode && form.nationalityCode.length !== 2) {
      return 'nationalityCode debe ser ISO-2 (p.ej., PY).';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      uiStore?.showSnackbar?.(err, 'warning');
      return;
    }
    setSubmitting(true);

    try {
      const fd = new FormData();

      // Campos requeridos por tu controller
      fd.append('documentType', form.documentType);
      fd.append('documentNumber', form.documentNumber);
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('phoneNumber', form.phoneNumber);
      fd.append('nationalityCode', form.nationalityCode.toUpperCase());
      if (form.birthDate) fd.append('birthDate', form.birthDate);

      fd.append('username', form.username);
      fd.append('email', form.email);
      fd.append('password', form.password);

      // Muy importante: para crear empleado
      fd.append('context', 'WEB');

      // Campos opcionales de vencimientos/fechas
      if (expirationDocument)
        fd.append('expiration_document', expirationDocument);
      if (expirationLicense) fd.append('expiration_license', expirationLicense);
      if (passportEntryDate)
        fd.append('passport_entry_date', passportEntryDate);

      // Archivos: tus nombres exactos en multer fields
      if (documentFront) fd.append('document_front', documentFront);
      if (documentBack) fd.append('document_back', documentBack);
      if (licenseFront) fd.append('license_front', licenseFront);
      if (licenseBack) fd.append('license_back', licenseBack);

      api.signUp(fd).handle({
        onSuccess: () => {
          uiStore?.showSnackbar?.(
            t('employees.feedback.created') || 'Empleado creado',
            'success',
          );
          onCreated();
          onClose();
        },
        onError: (e: any) => {
          const msg =
            e?.response?.data?.error ||
            e?.response?.data?.message ||
            'No se pudo crear el empleado';
          uiStore?.showSnackbar?.(msg, 'danger');
        },
        onFinally: () => setSubmitting(false),
      });
    } catch (e: any) {
      uiStore?.showSnackbar?.(e?.message || 'Error inesperado', 'danger');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('employees.add') || 'Agregar empleado'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">
              {t('employees.fields.role') || 'Rol'}:
            </Typography>
            <Chip label="Employee" />
            <Typography variant="caption" color="text.secondary">
              Este formulario usa <b>context=WEB</b> para crear/Asignar rol
              Employee.
            </Typography>
          </Box>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="doc-type">documentType</InputLabel>
              <Select
                labelId="doc-type"
                label="documentType"
                value={form.documentType}
                onChange={e =>
                  set('documentType', e.target.value as DocTypeCode)
                }>
                <MenuItem value="CI">CI</MenuItem>
                <MenuItem value="PASSPORT">PASSPORT</MenuItem>
                {/* agrega otros codes si los tienes */}
              </Select>
            </FormControl>
            <TextField
              label="documentNumber"
              size="small"
              value={form.documentNumber}
              onChange={e => set('documentNumber', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              label="firstName"
              size="small"
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="lastName"
              size="small"
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              label="phoneNumber"
              size="small"
              value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)}
              fullWidth
            />
            <TextField
              label="nationalityCode (ISO-2)"
              size="small"
              value={form.nationalityCode}
              onChange={e =>
                set('nationalityCode', e.target.value.toUpperCase())
              }
              fullWidth
            />
            <TextField
              label="birthDate"
              size="small"
              type="date"
              value={form.birthDate}
              onChange={e => set('birthDate', e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              label="username"
              size="small"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="email"
              size="small"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <TextField
            label="password"
            size="small"
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            fullWidth
            required
            helperText="Se envía en texto plano; el backend hashea con bcrypt."
          />

          <Typography variant="subtitle2" mt={1}>
            Documentos (opcionales)
          </Typography>
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <Box>
              <Typography variant="caption">document_front</Typography>
              <input
                type="file"
                onChange={e => setDocumentFront(e.target.files?.[0] || null)}
              />
            </Box>
            <Box>
              <Typography variant="caption">document_back</Typography>
              <input
                type="file"
                onChange={e => setDocumentBack(e.target.files?.[0] || null)}
              />
            </Box>
            <TextField
              label="expiration_document"
              size="small"
              type="date"
              value={expirationDocument}
              onChange={e => setExpirationDocument(e.target.value)}
            />
          </Stack>

          <Typography variant="subtitle2">Licencia (opcional)</Typography>
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <Box>
              <Typography variant="caption">license_front</Typography>
              <input
                type="file"
                onChange={e => setLicenseFront(e.target.files?.[0] || null)}
              />
            </Box>
            <Box>
              <Typography variant="caption">license_back</Typography>
              <input
                type="file"
                onChange={e => setLicenseBack(e.target.files?.[0] || null)}
              />
            </Box>
            <TextField
              label="expiration_license"
              size="small"
              type="date"
              value={expirationLicense}
              onChange={e => setExpirationLicense(e.target.value)}
            />
          </Stack>

          <TextField
            label="passport_entry_date (opcional)"
            size="small"
            type="date"
            value={passportEntryDate}
            onChange={e => setPassportEntryDate(e.target.value)}
            helperText="Utilizado para extranjeros, si aplica"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('common.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}>
          {submitting
            ? t('common.saving') || 'Guardando…'
            : t('common.save') || 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
