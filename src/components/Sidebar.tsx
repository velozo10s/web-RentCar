import * as React from 'react';
import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MailIcon from '@mui/icons-material/Mail';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useApi from '../lib/hooks/useApi';
import rootStore from '../lib/stores/rootStore';
import {ROUTES} from '../routes/routes';
import {useNavigate} from 'react-router-dom';

type Props = {
  active?: 'inicio' | 'reservas' | 'vehiculos' | 'reportes' | 'clientes';
};

const NAV_ITEMS = [
  {
    key: 'inicio',
    label: 'Inicio',
    icon: <DashboardIcon />,
    to: ROUTES.HOME ?? '/',
  },
  {
    key: 'reservas',
    label: 'Reservas',
    icon: <MailIcon />,
    to: ROUTES.RESERVATIONS,
  },
  {
    key: 'vehiculos',
    label: 'Vehículos',
    icon: <DirectionsCarIcon />,
    to: ROUTES.VEHICLES ?? '/vehicles',
  },
  {
    key: 'reportes',
    label: 'Reportes',
    icon: <ReceiptLongIcon />,
    to: ROUTES.REPORTS ?? '/reports',
  },
  {
    key: 'clientes',
    label: 'Clientes',
    icon: <PeopleAltIcon />,
    to: ROUTES.CLIENTS ?? '/clients',
  },
] as const;

export default function Sidebar({active = 'reservas'}: Props) {
  const api = useApi();
  const navigate = useNavigate();

  // Lee estado inicial desde localStorage para recordar preferencia
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar:collapsed') || 'false');
    } catch {
      return false;
    }
  });

  const widthExpanded = 280;
  const widthCollapsed = 72;
  const width = collapsed ? widthCollapsed : widthExpanded;

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sidebar:collapsed', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    api.logout({refreshToken: rootStore.userStore.refreshToken}).handle({
      onSuccess: () => rootStore.userStore.logout(),
      onError: err =>
        console.log('Server replied with an error:', err.response),
      onFinally: () => navigate(ROUTES.LOGIN),
    });
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100dvh',
        width,
        borderRadius: 0,
        position: 'sticky',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0, // 👈 clave
        px: 1,
        py: 2,
        gap: 1,
        transition: theme =>
          theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
      }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1,
          minHeight: 40,
        }}>
        <DirectionsCarIcon />
        {!collapsed && (
          <Typography variant="h6" fontWeight={700} noWrap>
            Rent Car
          </Typography>
        )}

        {/* Botón de colapso */}
        <IconButton
          size="small"
          onClick={toggleCollapsed}
          sx={{ml: 'auto'}}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Divider />

      {/* Navegación */}
      <List sx={{px: collapsed ? 0 : 1}}>
        {NAV_ITEMS.map(item => {
          const selected = active === item.key;
          const content = (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => navigate(item.to)}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                minHeight: 40,
                px: collapsed ? 1 : 1.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {color: 'inherit'},
                  '&:hover': {bgcolor: 'primary.main'},
                },
              }}>
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  mr: collapsed ? 0 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={item.key} title={item.label} placement="right">
              {/* span para que Tooltip pueda envolver el botón */}
              <span>{content}</span>
            </Tooltip>
          ) : (
            content
          );
        })}
      </List>

      {/* Empuja el footer al fondo */}
      <Box sx={{mt: 'auto'}} />

      {/* Footer / Logout */}
      <Box sx={{px: collapsed ? 1 : 2, pb: 1}}>
        {collapsed ? (
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton
              color="primary"
              onClick={logout}
              size="large"
              sx={{mx: 'auto', display: 'block'}}>
              {/* Reusamos el ícono de mail solo como placeholder si querés,
                  pero idealmente usa un ícono de logout */}
              <ReceiptLongIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={logout}
            sx={{fontWeight: 600}}>
            Cerrar sesión
          </Button>
        )}
      </Box>
    </Paper>
  );
}
