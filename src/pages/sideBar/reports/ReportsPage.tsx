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
import {useTheme, alpha} from '@mui/material/styles';
import AppShell from '../../../components/AppShell';
import {useStore} from '../../../lib/hooks/useStore';
import useApi from '../../../lib/hooks/useApi';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
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
  LabelList,
} from 'recharts';
import type {
  FrequentCustomersResp,
  MaintenanceUpcomingResp,
  ReservationsStatusResp,
  RevenueMonthlyResp,
} from '../../../api/endpoints';

dayjs.locale('es');

const fmtCurrency = (n: number, currency = 'USD') =>
  n.toLocaleString('es-ES', {style: 'currency', currency});

const tooltipStyle = (theme: any) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  borderRadius: 6,
});

const usePieColors = (theme: any) => [
  theme.palette.primary.main,
  theme.palette.secondary.main,
  theme.palette.success.main,
  theme.palette.warning.main,
  theme.palette.info.main,
  alpha(theme.palette.primary.main, 0.7),
  alpha(theme.palette.secondary.main, 0.7),
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
/* ---------------------- 1) Estado de reservas (UI en español) ---------------------- */
function ReservationsStatusReport() {
  const theme = useTheme();
  const COLORS = usePieColors(theme);
  const api = useApi();
  const {userStore, uiStore} = useStore();

  // Mapeo: clave interna -> etiqueta en español (lo que se muestra al usuario)
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    active: 'Activa',
    completed: 'Completada',
    declined: 'Rechazada',
    cancelled: 'Cancelada',
  };

  // Opciones para el selector (mantenemos el value en inglés porque así lo espera la API)
  const STATUS_OPTIONS = [
    {value: 'pending', label: STATUS_LABELS.pending},
    {value: 'confirmed', label: STATUS_LABELS.confirmed},
    {value: 'active', label: STATUS_LABELS.active},
    {value: 'completed', label: STATUS_LABELS.completed},
    {value: 'declined', label: STATUS_LABELS.declined},
    {value: 'cancelled', label: STATUS_LABELS.cancelled},
  ];

  const [from, setFrom] = React.useState(
    dayjs().startOf('year').format('YYYY-MM-DD'),
  );
  const [to, setTo] = React.useState(
    dayjs().endOf('year').format('YYYY-MM-DD'),
  );
  // Estado inicial (valores internos)
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transformo los datos para que el gráfico muestre la etiqueta en español
  const pieData = Object.entries(data?.aggregates?.byStatus || {}).map(
    ([key, value]) => ({
      key,
      name: STATUS_LABELS[key] ?? key, // etiqueta visible
      value: Number(value) || 0,
    }),
  );

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');
    api
      .exportReportReservationsStatus({from, to, statuses: statusesCSV, format})
      .promise.then(res =>
        openOrDownloadArrayBuffer(
          res,
          `estado-reservas-${from}-${to}.${format}`,
          true,
        ),
      )
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
            renderValue={selected =>
              selected.map(v => STATUS_LABELS[v] ?? v).join(', ')
            }>
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
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

      {!!pieData.length && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle(theme)}
                formatter={(v: any, n: any) => [v, n]} // n ya viene en español
              />
              <Legend wrapperStyle={{color: theme.palette.text.secondary}} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}

      {!loading && !pieData.length && (
        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
          No hay datos para los filtros seleccionados.
        </Typography>
      )}
    </Paper>
  );
}

/* ---------------------- 2) Ingresos mensuales ---------------------- */
function RevenueMonthlyReport() {
  const theme = useTheme();
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
    fetchData();
  }, []);

  const series = data?.aggregates?.series || [];
  const monthTick = (m: any) => {
    const d = dayjs(m);
    if (d.isValid()) return d.format('MMM YYYY');
    const idx = Number(m) - 1;
    return dayjs().month(idx).format('MMM');
  };

  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');
    api
      .exportReportRevenueMonthly({year, format})
      .promise.then(res =>
        openOrDownloadArrayBuffer(res, `ingresos-${year}.${format}`, true),
      )
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
              <CartesianGrid
                stroke={alpha(theme.palette.text.secondary, 0.2)}
              />
              <XAxis
                dataKey="month"
                tick={{fill: theme.palette.text.secondary}}
                tickFormatter={monthTick}
                axisLine={{stroke: theme.palette.divider}}
              />
              <YAxis
                tick={{fill: theme.palette.text.secondary}}
                axisLine={{stroke: theme.palette.divider}}
              />
              <Tooltip
                contentStyle={tooltipStyle(theme)}
                labelFormatter={l => `Mes: ${monthTick(l)}`}
                formatter={(v: any) => [fmtCurrency(Number(v)), 'Ingresos']}
              />
              <Legend wrapperStyle={{color: theme.palette.text.secondary}} />
              <Bar
                dataKey="revenue"
                name="Ingresos"
                fill={theme.palette.primary.main}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

/* ---------------------- 3) Mantenimiento próximo ---------------------- */
/* ---------------------- 3) Mantenimiento próximo ---------------------- */
function MaintenanceUpcomingReport() {
  const theme = useTheme();
  const COLORS = usePieColors(theme);
  const api = useApi();
  const {userStore, uiStore} = useStore();

  // Puedes ajustar el default si quieres que arranque en 100
  const [threshold, setThreshold] = React.useState<number>(1000);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);

  // Mapeo de claves -> etiquetas legibles
  const BUCKET_LABELS: Record<string, string> = {
    lt_500: 'Menos de 500 km',
    gte_500_lt_1000: 'Entre 500 y 1000 km',
    overdue: 'Mantenimiento vencido',
  };

  // (Opcional) si querés controlar el orden en la leyenda/gráfico
  const BUCKET_ORDER = ['overdue', 'lt_500', 'gte_500_lt_1000'];

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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construyo la serie traducida y (opcional) ordenada
  const rawBuckets = data?.aggregates?.buckets || {};
  const pieDataAll = Object.entries(rawBuckets)
    .map(([key, value]) => ({
      key,
      name: BUCKET_LABELS[key] || key,
      value: Number(value) || 0,
    }))
    .sort((a, b) => {
      const ia = BUCKET_ORDER.indexOf(a.key);
      const ib = BUCKET_ORDER.indexOf(b.key);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  // 2) filtrar los que tienen valor > 0 (evita etiquetas/legend de buckets vacíos)
  const pieData = pieDataAll.filter(d => d.value > 0);
  const openExport = (format: 'xlsx' | 'pdf') => {
    const token = userStore.accessToken;
    if (!token) return uiStore?.showSnackbar?.('Sesión no válida', 'warning');
    api
      .exportReportMaintenanceUpcoming({threshold_km: threshold, format})
      .promise.then(res =>
        openOrDownloadArrayBuffer(
          res,
          `mantenimiento-${threshold}.${format}`,
          true,
        ),
      )
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

      {!!pieData.length && (
        <Box sx={{height: 320}}>
          <ResponsiveContainer>
            <Box sx={{height: 320}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieDataAll} // usamos todos (aunque algunos sean 0)
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    labelLine={false}
                    // mostramos etiquetas solo si el valor > 0
                    label={({name, value}) =>
                      /*@ts-ignore*/
                      value > 0 ? `${name}: ${value}` : ''
                    }>
                    {pieDataAll.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle(theme)}
                    formatter={(v: any, n: any) => [`${v} vehículos`, n]}
                  />
                  {/* Legend con todos los buckets, incluso los 0 */}
                  <Legend
                    wrapperStyle={{color: theme.palette.text.secondary}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </ResponsiveContainer>
        </Box>
      )}

      {!loading && !pieData.length && (
        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
          No hay vehículos dentro del umbral seleccionado.
        </Typography>
      )}
    </Paper>
  );
}

/* ---------------------- 4) Clientes frecuentes ---------------------- */
/* ---------------------- 4) Clientes frecuentes (mejorado) ---------------------- */
function FrequentCustomersReport() {
  const theme = useTheme();
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
    fetchData();
  }, []);

  const TOP_N = 20;

  type FrequentItem = {
    user_id: number;
    customer_name?: string;
    document_number?: string;
    reservation_count?: number | string;
    reservations?: any[];
  };

  const items: FrequentItem[] = (data?.items ?? []) as FrequentItem[];

  const series = items
    .map(it => {
      const count = Number(it.reservation_count ?? 0);
      const name =
        it.document_number?.trim?.() ||
        it.customer_name?.trim?.() ||
        `#${it.user_id}`;

      // Si querés mostrar ambos:
      // const name = [it.document_number, it.customer_name].filter(Boolean).join(' — ') || `#${it.user_id}`;

      return {
        user_id: it.user_id,
        count,
        name,
        document_number: it.document_number,
        customer_name: it.customer_name,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);

  // altura dinámica para que no se amontonen
  const height = Math.min(560, Math.max(240, 44 * series.length + 40));

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
      .promise.then(res =>
        openOrDownloadArrayBuffer(
          res,
          `clientes-frecuentes-${from}-${to}-min${minRes}.${format}`,
          true,
        ),
      )
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
        <Box sx={{height}}>
          <ResponsiveContainer>
            <BarChart
              data={series}
              layout="vertical"
              margin={{top: 8, right: 16, bottom: 8, left: 8}}
              barSize={22}>
              <CartesianGrid
                stroke={alpha(theme.palette.text.secondary, 0.2)}
              />
              <XAxis
                type="number"
                // dominio más cómodo: enteros y un headroom
                domain={[0, 'dataMax + 1']}
                allowDecimals={false}
                tick={{fill: theme.palette.text.secondary}}
                axisLine={{stroke: theme.palette.divider}}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{fill: theme.palette.text.secondary}}
                tickLine={false}
                axisLine={{stroke: theme.palette.divider}}
                width={220}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                  borderRadius: 6,
                }}
                // oculto la etiqueta de eje Y (ya está en el tooltip)
                labelFormatter={() => ''}
                formatter={(v: any, _k, ctx: any) => [
                  v,
                  ctx?.payload?.name ?? 'Reservas',
                ]}
              />
              <Legend wrapperStyle={{color: theme.palette.text.secondary}} />
              <Bar
                dataKey="count"
                name="Reservas"
                fill={theme.palette.primary.main}
                radius={[0, 4, 4, 0]}>
                {/* número al final de la barra */}
                <LabelList dataKey="count" position="right" offset={6} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {!loading && !series.length && (
        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
          No hay clientes con al menos {minRes} reservas en el rango
          seleccionado.
        </Typography>
      )}
    </Paper>
  );
}

/* ---------------------- helper ---------------------- */
function openOrDownloadArrayBuffer(
  res: any,
  fallbackName: string,
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
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}
