// src/pages/employees/EmployeesScreen.tsx
import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormHelperText,
  LinearProgress,
  Chip,
} from '@mui/material';
import AppShell from '../../../components/AppShell';
import useApi from '../../../lib/hooks/useApi';
import {useTranslation} from 'react-i18next';
import EditEmployeeDialog from '../../../components/molecules/EditEmployeeDialog';
import AddEmployeeDialog from '../../../components/molecules/AddEmployeeDialog';
import {useCallback, useEffect, useState} from 'react';

type Employee = {
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

export default function EmployeesPage() {
  const api = useApi();
  const {t} = useTranslation();

  const [rows, setRows] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(
    (opts?: {silent?: boolean}) => {
      if (!opts?.silent) setLoading(true);
      api
        // si tu backend soporta q/active, pásalos aquí:
        .listEmployees({q: query || undefined, active: 'all'})
        .handle({
          onSuccess: (res: Employee[]) => setRows(res ?? []),
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
    [api, query],
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <AppShell>
      <Box
        component="main"
        sx={{p: 3, display: 'flex', flexDirection: 'column'}}>
        <Typography variant="h6" mb={2} textAlign="center">
          {t('employees.title') || 'Employees'}
        </Typography>

        {/* Toolbar */}
        <Stack
          direction={{xs: 'column', sm: 'row'}}
          gap={1.5}
          alignItems={{xs: 'stretch', sm: 'center'}}
          mb={2}>
          <FormHelperText sx={{m: 0, mr: 1}}>
            {t('employees.filters.title') || 'Filters'}
          </FormHelperText>

          <Box sx={{flex: 1}} />

          <TextField
            size="small"
            placeholder={
              t('employees.filters.search') || 'Search by name or email'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchEmployees({silent: true})}
            sx={{width: {xs: '100%', sm: 320}, flexShrink: 0}}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setRefreshing(true);
              fetchEmployees({silent: true});
            }}>
            {refreshing
              ? t('common.refreshing') || 'Refreshing…'
              : t('common.refresh') || 'Refresh'}
          </Button>

          <Button variant="contained" onClick={() => setAddOpen(true)}>
            {t('common.add') || 'Add employee'}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{mb: 1}} />}

        <Paper variant="outlined" sx={{display: 'flex'}}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>{t('common.name') || 'Nombre'}</TableCell>
                  <TableCell>
                    {t('employees.fields.documentNumber') || 'Documento'}
                  </TableCell>
                  <TableCell>
                    {t('employees.fields.phone') || 'Teléfono'}
                  </TableCell>
                  <TableCell align="center">
                    {t('common.status') || 'Activo'}
                  </TableCell>
                  <TableCell>{t('common.createdAt') || 'Creado'}</TableCell>
                  <TableCell align="right">
                    {t('common.actions') || 'Acciones'}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box py={4} textAlign="center" color="text.secondary">
                        {t('common.noData') || 'Sin datos'}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.username}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {r.first_name} {r.last_name}
                      </TableCell>
                      <TableCell>{r.document_number}</TableCell>
                      <TableCell>{r.phone_number || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            r.is_active
                              ? t('common.active') || 'Activo'
                              : t('common.inactive') || 'Inactivo'
                          }
                          color={r.is_active ? 'success' : 'default'}
                          variant={r.is_active ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={() => {
                              // ✅ setear la fila seleccionada ANTES de abrir
                              setEditRow(r);
                              setEditOpen(true);
                            }}>
                            {t('common.edit') || 'Edit'}
                          </Button>

                          {/* Ejemplo opcional de activar/desactivar */}
                          {/* <Button
                            size="small"
                            variant="outlined"
                            disabled={togglingId === r.id}
                            onClick={() => handleToggleActive(r.id, !r.is_active)}
                          >
                            {r.is_active ? (t('common.deactivate') || 'Desactivar') : (t('common.activate') || 'Activar')}
                          </Button> */}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add dialog */}
        <AddEmployeeDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            fetchEmployees({silent: true});
          }}
        />

        {/* Edit dialog */}
        {editRow && (
          <EditEmployeeDialog
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              setEditRow(null); // ✅ limpiar la selección al cerrar
            }}
            employee={editRow}
            onSaved={() => {
              setEditOpen(false);
              setEditRow(null);
              fetchEmployees({silent: true});
            }}
          />
        )}
      </Box>
    </AppShell>
  );
}
