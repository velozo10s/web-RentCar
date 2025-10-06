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
import {useNavigate} from 'react-router-dom';
import type {CustomerSummary} from '../../../lib/types/customers.ts';

export default function CustomersPage() {
  const api = useApi();
  const {t} = useTranslation();
  const navigate = useNavigate();

  const [rows, setRows] = React.useState<CustomerSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // filtros
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<'all' | 'true' | 'false'>('all');

  const fetchCustomers = React.useCallback(
    (opts?: {silent?: boolean}) => {
      if (!opts?.silent) setLoading(true);
      api.listCustomers({active}).handle({
        onSuccess: res => setRows(res ?? []),
        onFinally: () => {
          setLoading(false);
          setRefreshing(false);
        },
      });
    },
    [api, active],
  );

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    if (q) {
      const inName = r.name?.toLowerCase().includes(q);
      const inDoc = r.documentNumber?.toLowerCase().includes(q);
      const inPhone = (r.phoneNumber || '').toLowerCase().includes(q);
      if (!inName && !inDoc && !inPhone) return false;
    }
    // active ya lo aplicamos server-side, pero si quisieras client-side:
    // if (active !== 'all') {
    //   const want = active === 'true';
    //   if (!!r.isActive !== want) return false;
    // }
    return true;
  });

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : '—';

  return (
    <AppShell>
      <Box
        component="main"
        sx={{p: 3, display: 'flex', flexDirection: 'column'}}>
        <Typography variant="h6" mb={2} textAlign="center">
          {t('customers.title') || 'Customers'}
        </Typography>

        {/* Toolbar */}
        <Stack
          direction={{xs: 'column', sm: 'row'}}
          gap={1.5}
          alignItems={{xs: 'stretch', sm: 'center'}}
          mb={2}>
          <FormHelperText sx={{m: 0, mr: 1}}>
            {t('customers.filters.title') || 'Filters'}
          </FormHelperText>

          <FormControl size="small" sx={{width: 200}}>
            <InputLabel id="active-label">
              {t('common.active') || 'Active'}
            </InputLabel>
            <Select
              labelId="active-label"
              label={t('common.active') || 'Active'}
              value={active}
              onChange={e => setActive(e.target.value as any)}>
              <MenuItem value="all">{t('common.any') || 'All'}</MenuItem>
              <MenuItem value="true">
                {t('common.onlyActive') || 'Only active'}
              </MenuItem>
              <MenuItem value="false">
                {t('common.onlyInactive') || 'Only inactive'}
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{flex: 1}} />

          <TextField
            size="small"
            placeholder={
              t('customers.filters.searchPlaceholder') ||
              'Search by name, doc, or phone'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{width: {xs: '100%', sm: 320}, flexShrink: 0}}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setRefreshing(true);
              fetchCustomers({silent: true});
            }}>
            {refreshing
              ? t('common.refreshing') || 'Refreshing…'
              : t('common.refresh') || 'Refresh'}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{mb: 1}} />}

        <Paper variant="outlined" sx={{display: 'flex'}}>
          <TableContainer sx={{flex: 1, width: '100%'}}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('customers.table.name') || 'Name'}</TableCell>
                  <TableCell>
                    {t('customers.table.doc') || 'Document'}
                  </TableCell>
                  <TableCell>
                    {t('customers.table.birth') || 'Birth date'}
                  </TableCell>
                  <TableCell>{t('customers.table.phone') || 'Phone'}</TableCell>
                  <TableCell>{t('common.active') || 'Active'}</TableCell>
                  <TableCell align="center">
                    {t('common.actions') || 'Actions'}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.personId} hover>
                    <TableCell>{row.personId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {row.documentType} · {row.documentNumber}
                    </TableCell>
                    <TableCell>{fmtDate(row.birthDate)}</TableCell>
                    <TableCell>{row.phoneNumber || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          row.isActive
                            ? t('common.active') || 'Active'
                            : t('common.inactive') || 'Inactive'
                        }
                        color={row.isActive ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => navigate(`/customers/${row.personId}`)}>
                        {t('common.viewDetails') || 'View details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
      </Box>
    </AppShell>
  );
}
