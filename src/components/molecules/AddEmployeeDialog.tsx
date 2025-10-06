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

  // Campos requeridos por /register
  const [form, setForm] = useState({
    // persona
    documentType: 'CI' as DocTypeCode,
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

  // Archivos (opcionales)
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);

  const [expirationDocument, setExpirationDocument] = useState(''); // YYYY-MM-DD
  const [expirationLicense, setExpirationLicense] = useState(''); // YYYY-MM-DD
  const [passportEntryDate, setPassportEntryDate] = useState(''); // YYYY-MM-DD

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  // 🔧 Props comunes para inputs de fecha (evita solapado label/placeholder)
  const dateFieldProps = {
    type: 'date' as const,
    variant: 'outlined' as const,
    InputLabelProps: {shrink: true},
    inputProps: {placeholder: ''}, // evita placeholder nativo visible
  };

  const validate = () => {
    if (!form.username || !form.email || !form.password) {
      return t('employees.addDialog.validation.missingCredentials');
    }
    if (!form.documentNumber) {
      return t('employees.addDialog.validation.missingDocumentNumber');
    }
    if (!form.firstName) {
      return t('employees.addDialog.validation.missingFirstName');
    }
    if (!form.documentType) {
      return t('employees.addDialog.validation.missingDocumentType');
    }
    if (form.nationalityCode && form.nationalityCode.length !== 2) {
      return t('employees.addDialog.validation.invalidNationalityCode');
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

      // Importante: crear empleado con contexto WEB
      fd.append('context', 'WEB');

      // Opcionales de fechas
      if (expirationDocument)
        fd.append('expiration_document', expirationDocument);
      if (expirationLicense) fd.append('expiration_license', expirationLicense);
      if (passportEntryDate)
        fd.append('passport_entry_date', passportEntryDate);

      // Archivos
      if (documentFront) fd.append('document_front', documentFront);
      if (documentBack) fd.append('document_back', documentBack);
      if (licenseFront) fd.append('license_front', licenseFront);
      if (licenseBack) fd.append('license_back', licenseBack);

      api.signUp(fd).handle({
        onSuccess: () => {
          uiStore?.showSnackbar?.(t('employees.feedback.created'), 'success');
          onCreated();
          onClose();
        },
        onError: (e: any) => {
          const msg =
            e?.response?.data?.error ||
            e?.response?.data?.message ||
            t('employees.feedback.createError');
          uiStore?.showSnackbar?.(msg, 'danger');
        },
        onFinally: () => setSubmitting(false),
      });
    } catch (e: any) {
      uiStore?.showSnackbar?.(t('common.unexpectedError'), 'danger');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('employees.add')}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">
              {t('employees.fields.role')}:
            </Typography>
            <Chip label={t('employees.roles.employee')} />
            <Typography variant="caption" color="text.secondary">
              {t('employees.addDialog.roleChip.help')}
            </Typography>
          </Box>

          {/* Identificación */}
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="doc-type">
                {t('employees.addDialog.fields.documentType')}
              </InputLabel>
              <Select
                labelId="doc-type"
                label={t('employees.addDialog.fields.documentType')}
                value={form.documentType}
                onChange={e =>
                  set('documentType', e.target.value as DocTypeCode)
                }>
                <MenuItem value="CI">CI</MenuItem>
                <MenuItem value="PASSPORT">PASSPORT</MenuItem>
                {/* agrega otros códigos si los tienes */}
              </Select>
            </FormControl>

            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.documentNumber')}
              size="small"
              value={form.documentNumber}
              onChange={e => set('documentNumber', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          {/* Datos personales */}
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.firstName')}
              size="small"
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.lastName')}
              size="small"
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.phoneNumber')}
              size="small"
              value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)}
              fullWidth
            />
            <TextField
              variant="outlined"
              label={`${t('employees.addDialog.fields.nationalityCode')} ${t('employees.addDialog.fields.nationalityCodeHint')}`}
              size="small"
              value={form.nationalityCode}
              onChange={e =>
                set('nationalityCode', e.target.value.toUpperCase())
              }
              fullWidth
            />
            <TextField
              {...dateFieldProps}
              label={t('employees.addDialog.fields.birthDate')}
              size="small"
              value={form.birthDate}
              onChange={e => set('birthDate', e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Cuenta */}
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.username')}
              size="small"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              fullWidth
              required
            />
            <TextField
              variant="outlined"
              label={t('employees.addDialog.fields.email')}
              size="small"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              fullWidth
              required
            />
          </Stack>

          <TextField
            variant="outlined"
            label={t('employees.addDialog.fields.password')}
            size="small"
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            fullWidth
            required
            helperText={t('employees.addDialog.helpers.passwordPlainWarning')}
          />

          {/* Documentos (opcionales) */}
          <Typography variant="subtitle2" mt={1}>
            {t('employees.addDialog.sections.documents')}
          </Typography>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <Box>
              <Typography variant="caption">
                {t('employees.addDialog.uploads.documentFront')}
              </Typography>
              <input
                type="file"
                onChange={e => setDocumentFront(e.target.files?.[0] || null)}
              />
            </Box>

            <Box>
              <Typography variant="caption">
                {t('employees.addDialog.uploads.documentBack')}
              </Typography>
              <input
                type="file"
                onChange={e => setDocumentBack(e.target.files?.[0] || null)}
              />
            </Box>

            <TextField
              {...dateFieldProps}
              label={t('employees.addDialog.fields.expirationDocument')}
              size="small"
              value={expirationDocument}
              onChange={e => setExpirationDocument(e.target.value)}
            />
          </Stack>

          {/* Licencia (opcional) */}
          <Typography variant="subtitle2">
            {t('employees.addDialog.sections.license')}
          </Typography>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <Box>
              <Typography variant="caption">
                {t('employees.addDialog.uploads.licenseFront')}
              </Typography>
              <input
                type="file"
                onChange={e => setLicenseFront(e.target.files?.[0] || null)}
              />
            </Box>

            <Box>
              <Typography variant="caption">
                {t('employees.addDialog.uploads.licenseBack')}
              </Typography>
              <input
                type="file"
                onChange={e => setLicenseBack(e.target.files?.[0] || null)}
              />
            </Box>

            <TextField
              {...dateFieldProps}
              label={t('employees.addDialog.fields.expirationLicense')}
              size="small"
              value={expirationLicense}
              onChange={e => setExpirationLicense(e.target.value)}
            />
          </Stack>

          <TextField
            {...dateFieldProps}
            label={`${t('employees.addDialog.fields.passportEntryDate')} (${t('common.optional')})`}
            size="small"
            value={passportEntryDate}
            onChange={e => setPassportEntryDate(e.target.value)}
            helperText={t('employees.addDialog.fields.passportEntryDateHelp')}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}>
          {submitting ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
