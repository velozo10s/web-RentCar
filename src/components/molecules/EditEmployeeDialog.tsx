// src/pages/employees/EditEmployeeDialog.tsx
import * as React from 'react';
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import useApi from '../../lib/hooks/useApi';
import {useTranslation} from 'react-i18next';
import {useStore} from '../../lib/hooks/useStore';
import {useEffect, useState} from 'react';

export type Employee = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string; // ISO
  person_id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  phone_number: string | null;
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function EditEmployeeDialog({
  open,
  onClose,
  employee,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSaved: () => void;
}) {
  const api = useApi();
  const {t} = useTranslation();
  const {uiStore} = useStore();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: employee.username || '',
    email: employee.email || '',
    is_active: employee.is_active,
    password: '', // opcional: si se completa, se actualiza
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      username: employee.username || '',
      email: employee.email || '',
      is_active: employee.is_active,
      password: '',
    });
  }, [open, employee]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({...prev, [k]: v}));

  const handleSubmit = () => {
    // build minimal patch solo con cambios
    const patch: any = {};
    if (form.username.trim() !== employee.username)
      patch.username = form.username.trim();
    if (form.email.trim() !== employee.email) patch.email = form.email.trim();
    if (form.is_active !== employee.is_active) patch.is_active = form.is_active;
    if (form.password) patch.password = form.password;

    if (Object.keys(patch).length === 0) {
      uiStore?.showSnackbar?.(
        t('employees.feedback.noChanges') || 'No hay cambios para guardar',
        'info',
      );
      return;
    }

    console.log(JSON.stringify(patch));

    setSubmitting(true);
    api.updateEmployee(employee.id, patch).handle({
      onSuccess: () => {
        uiStore?.showSnackbar?.(
          t('employees.feedback.updated') || 'Empleado actualizado',
          'success',
        );
        onSaved();
        onClose();
      },
      onError: (err: any) => {
        // backend devuelve 409 por conflicto de unicidad
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          (t('employees.feedback.updateError') as any) ||
          'No se pudo actualizar';
        uiStore?.showSnackbar?.(msg, 'danger');
      },
      onFinally: () => setSubmitting(false),
    });
  };

  const fullName = `${employee.first_name} ${employee.last_name}`.trim();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('employees.edit') || 'Editar empleado'}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          {t('common.summary') || 'Resumen'}
        </Typography>

        <Stack spacing={1} mb={2}>
          {/* ID + Chip fuera de <Typography> */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">
              <b>ID:</b> {employee.id}
            </Typography>
            <Chip
              size="small"
              label={
                employee.is_active
                  ? t('common.active') || 'Activo'
                  : t('common.inactive') || 'Inactivo'
              }
              color={employee.is_active ? 'success' : 'default'}
              variant={employee.is_active ? 'filled' : 'outlined'}
            />
          </Stack>

          <Typography variant="body2">
            <b>{t('common.name') || 'Nombre'}:</b> {fullName || '-'}
          </Typography>
          <Typography variant="body2">
            <b>{t('employees.fields.documentNumber') || 'Documento'}:</b>{' '}
            {employee.document_number}
          </Typography>
          <Typography variant="body2">
            <b>{t('employees.fields.phone') || 'Teléfono'}:</b>{' '}
            {employee.phone_number || '-'}
          </Typography>
          <Typography variant="body2">
            <b>{t('common.createdAt') || 'Creado'}:</b>{' '}
            {formatDate(employee.created_at)}
          </Typography>
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          {t('employees.account') || 'Cuenta'}
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="username"
            size="small"
            value={form.username}
            onChange={e => set('username', e.target.value)}
            fullWidth
          />
          <TextField
            label="email"
            size="small"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            fullWidth
          />
          <TextField
            label={t('employees.fields.password') || 'password'}
            size="small"
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            fullWidth
            helperText={
              t('employees.hints.passwordOptional') ||
              'Deja vacío para no cambiarla. El backend la hashea.'
            }
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="active-edit">
              {t('common.active') || 'Activo'}
            </InputLabel>
            <Select
              labelId="active-edit"
              label={t('common.active') || 'Activo'}
              value={String(form.is_active)}
              onChange={e => set('is_active', e.target.value === 'true')}>
              <MenuItem value="true">{t('common.yes') || 'Sí'}</MenuItem>
              <MenuItem value="false">{t('common.no') || 'No'}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={2}>
          {t('employees.hints.editNote') ||
            'Este diálogo solo edita username, email, password e is_active. Para editar nombre o documento, se requiere un endpoint de Person (person.persons).'}
        </Typography>
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
