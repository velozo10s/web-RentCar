// src/pages/reports/ReportsPage.tsx
import * as React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Stack,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Typography,
  Slider,
} from '@mui/material';
import AppShell from '../../../components/AppShell';
import {useStore} from '../../../lib/hooks/useStore';
import useApi from '../../../lib/hooks/useApi';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import type {
  FrequentCustomersResp,
  MaintenanceUpcomingResp,
  ReservationsStatusResp,
  RevenueMonthlyResp,
} from '../../../api/endpoints';

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
];

export default function ReportsPage() {
  const [tab, setTab] = React.useState(0);
  return (
    <AppShell>
      <Box component="main" sx={{p: 3}}>
        <Typography variant="h6" mb={2} textAlign="center">
          Reportes
        </Typography>
        <Paper variant="outlined" sx={{mb: 2}}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
            <Tab label="Estados de reservas" />
            <Tab label="Ingresos mensuales" />
            <Tab label="Mantenimiento próximo" />
            <Tab label="Clientes frecuentes" />
          </Tabs>
        </Paper>

        {tab === 0 && <ReservationsStatusReport />}
        {tab === 1 && <RevenueMonthlyReport />}
        {tab === 2 && <MaintenanceUpcomingReport />}
        {tab === 3 && <FrequentCustomersReport />}
      </Box>
    </AppShell>
  );
}

/* ---------------------- 1) Estados de reservas ---------------------- */
function ReservationsStatusReport() {
  const api = useApi();
  const {userStore, uiStore} = useStore();

  const [from, setFrom] = React.useState(
    dayjs().startOf('year').format('YYYY-MM-DD'),
  );
  const [to, setTo] = React.useState(
    dayjs().endOf('year').format('YYYY-MM-DD'),
  );
  const [statuses, setStatuses] = React.useState<string[]>([
    'pending',
    'confirmed',
    'completed',
  ]);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);

  const statusesCSV = statuses.join(',');

  const fetchData = () => {
    setLoading(true);
    api.getReportReservationsStatus({from, to, statuses: statusesCSV}).handle({
      onSuccess: (res: ReservationsStatusResp) => setData(res),
      onError: () =>
        uiStore?.showSnackbar?.('No se pudo cargar el reporte', 'danger'),
      onFinally: () => setLoading(false),
    });
  };

  React.useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, []);

  const byStatus = data?.aggregates?.byStatus || {};
  const pieData = Object.entries(byStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');

    api
      .exportReportReservationsStatus({from, to, statuses: statusesCSV, format})
      .promise.then(res => {
        openOrDownloadArrayBuffer(
          res,
          `reservas-${from}-${to}.${format}`,
          true, // PDF en nueva pestaña
        );
      })
      .catch(() =>
        uiStore?.showSnackbar?.('No se pudo exportar el reporte', 'danger'),
      );
  };

  return (
    <Paper variant="outlined" sx={{p: 2}}>
      <Stack
        direction={{xs: 'column', sm: 'row'}}
        gap={1.5}
        alignItems={{xs: 'stretch', sm: 'center'}}
        mb={2}>
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />
        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <FormControl size="small" sx={{minWidth: 240}}>
          <InputLabel id="st-label">Estados</InputLabel>
          <Select
            multiple
            labelId="st-label"
            label="Estados"
            value={statuses}
            onChange={e => setStatuses(e.target.value as string[])}
            renderValue={selected => selected.join(', ')}>
            {[
              'pending',
              'confirmed',
              'active',
              'completed',
              'declined',
              'cancelled',
            ].map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{flex: 1}} />
        <Button variant="outlined" onClick={fetchData}>
          Aplicar
        </Button>
        <Button variant="outlined" onClick={() => openExport('xlsx')}>
          Exportar Excel
        </Button>
        <Button variant="contained" onClick={() => openExport('pdf')}>
          Exportar PDF
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{mb: 2}} />}

      {pieData.length > 0 && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label>
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

function openOrDownloadArrayBuffer(
  res: any, // AxiosResponse<ArrayBuffer>
  fallbackName: string, // p.ej. "reporte.pdf" o "reporte.xlsx"
  preferNewTabForPdf = true,
) {
  const cd =
    res.headers?.['content-disposition'] ||
    (res.headers as any)?.get?.('content-disposition');

  let filename = fallbackName;
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
    if (m && m[1]) filename = decodeURIComponent(m[1]);
  }

  const contentType =
    res.headers?.['content-type'] ||
    (filename.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  const blob = new Blob([res.data], {type: contentType});
  const blobUrl = URL.createObjectURL(blob);

  const isPdf = contentType.includes('pdf') || filename.endsWith('.pdf');
  if (preferNewTabForPdf && isPdf) {
    const w = window.open(blobUrl, '_blank');
    if (!w) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/* ---------------------- 2) Ingresos mensuales ---------------------- */
function RevenueMonthlyReport() {
  const api = useApi();
  const {userStore, uiStore} = useStore();
  const [year, setYear] = React.useState<string>(
    String(new Date().getFullYear()),
  );
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.getReportRevenueMonthly({year}).handle({
      onSuccess: (res: RevenueMonthlyResp) => setData(res),
      onError: () =>
        uiStore?.showSnackbar?.('No se pudo cargar el reporte', 'danger'),
      onFinally: () => setLoading(false),
    });
  };
  React.useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, []);

  const series = data?.aggregates?.series || [];

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');

    api
      .exportReportRevenueMonthly({year, format})
      .promise.then(res => {
        openOrDownloadArrayBuffer(res, `ingresos-${year}.${format}`, true);
      })
      .catch(() =>
        uiStore?.showSnackbar?.('No se pudo exportar el reporte', 'danger'),
      );
  };

  return (
    <Paper variant="outlined" sx={{p: 2}}>
      <Stack
        direction={{xs: 'column', sm: 'row'}}
        gap={1.5}
        alignItems={{xs: 'stretch', sm: 'center'}}
        mb={2}>
        <TextField
          label="Año"
          size="small"
          type="number"
          value={year}
          onChange={e => setYear(e.target.value)}
          sx={{width: 140}}
        />
        <Box sx={{flex: 1}} />
        <Button variant="outlined" onClick={fetchData}>
          Aplicar
        </Button>
        <Button variant="outlined" onClick={() => openExport('xlsx')}>
          Exportar Excel
        </Button>
        <Button variant="contained" onClick={() => openExport('pdf')}>
          Exportar PDF
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{mb: 2}} />}

      {!!series.length && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

/* ---------------------- 3) Mantenimiento próximo ---------------------- */
function MaintenanceUpcomingReport() {
  const api = useApi();
  const {userStore, uiStore} = useStore();
  const [threshold, setThreshold] = React.useState<number>(1000);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.getReportMaintenanceUpcoming({threshold_km: threshold}).handle({
      onSuccess: (res: MaintenanceUpcomingResp) => setData(res),
      onError: () =>
        uiStore?.showSnackbar?.('No se pudo cargar el reporte', 'danger'),
      onFinally: () => setLoading(false),
    });
  };
  React.useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, []);

  const buckets = data?.aggregates?.buckets || {};
  const pieData = Object.entries(buckets).map(([name, value]) => ({
    name,
    value,
  }));

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');

    api
      .exportReportMaintenanceUpcoming({threshold_km: threshold, format})
      .promise.then(res => {
        openOrDownloadArrayBuffer(
          res,
          `mantenimiento-${threshold}.${format}`,
          true,
        );
      })
      .catch(() =>
        uiStore?.showSnackbar?.('No se pudo exportar el reporte', 'danger'),
      );
  };

  return (
    <Paper variant="outlined" sx={{p: 2}}>
      <Stack
        direction={{xs: 'column', sm: 'row'}}
        gap={1.5}
        alignItems={{xs: 'stretch', sm: 'center'}}
        mb={2}>
        <Typography sx={{mr: 2}}>Umbral (km): {threshold}</Typography>
        <Slider
          min={0}
          max={3000}
          step={100}
          value={threshold}
          onChange={(_, v) => setThreshold(v as number)}
          sx={{maxWidth: 300}}
        />
        <Box sx={{flex: 1}} />
        <Button variant="outlined" onClick={fetchData}>
          Aplicar
        </Button>
        <Button variant="outlined" onClick={() => openExport('xlsx')}>
          Exportar Excel
        </Button>
        <Button variant="contained" onClick={() => openExport('pdf')}>
          Exportar PDF
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{mb: 2}} />}

      {pieData.length > 0 && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label>
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

/* ---------------------- 4) Clientes frecuentes ---------------------- */
function FrequentCustomersReport() {
  const api = useApi();
  const {userStore, uiStore} = useStore();

  const [minRes, setMinRes] = React.useState<number>(3);
  const [from, setFrom] = React.useState(
    dayjs().startOf('year').format('YYYY-MM-DD'),
  );
  const [to, setTo] = React.useState(
    dayjs().endOf('year').format('YYYY-MM-DD'),
  );
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);

  const fetchData = () => {
    setLoading(true);
    api
      .getReportFrequentCustomers({min_reservations: minRes, from, to})
      .handle({
        onSuccess: (res: FrequentCustomersResp) => setData(res),
        onError: () =>
          uiStore?.showSnackbar?.('No se pudo cargar el reporte', 'danger'),
        onFinally: () => setLoading(false),
      });
  };
  React.useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, []);

  const series = data?.aggregates?.series || [];

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');

    api
      .exportReportFrequentCustomers({
        min_reservations: minRes,
        from,
        to,
        format,
      })
      .promise.then(res => {
        openOrDownloadArrayBuffer(
          res,
          `clientes-frecuentes-${from}-${to}-min${minRes}.${format}`,
          true,
        );
      })
      .catch(() =>
        uiStore?.showSnackbar?.('No se pudo exportar el reporte', 'danger'),
      );
  };

  return (
    <Paper variant="outlined" sx={{p: 2}}>
      <Stack
        direction={{xs: 'column', sm: 'row'}}
        gap={1.5}
        alignItems={{xs: 'stretch', sm: 'center'}}
        mb={2}>
        <TextField
          label="Mín. reservas"
          type="number"
          size="small"
          value={minRes}
          onChange={e => setMinRes(Number(e.target.value))}
          sx={{width: 160}}
        />
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />
        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <Box sx={{flex: 1}} />
        <Button variant="outlined" onClick={fetchData}>
          Aplicar
        </Button>
        <Button variant="outlined" onClick={() => openExport('xlsx')}>
          Exportar Excel
        </Button>
        <Button variant="contained" onClick={() => openExport('pdf')}>
          Exportar PDF
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{mb: 2}} />}

      {!!series.length && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <BarChart data={series} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="user_id" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
