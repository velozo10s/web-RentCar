// Sidebar.tsx
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
  Drawer,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MailIcon from '@mui/icons-material/Mail';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import useApi from '../lib/hooks/useApi';
import rootStore from '../lib/stores/rootStore';
import {ROUTES} from '../routes/routes';
import {useNavigate} from 'react-router-dom';

type Props = {
  active?: 'inicio' | 'reservas' | 'vehiculos' | 'reportes' | 'clientes';
  /** 'permanent' = en columna, 'temporary' = overlay sobre el contenido */
  variant?: 'permanent' | 'temporary';
  /** Solo para variant='temporary' */
  open?: boolean;
  onClose?: () => void;
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

export default function Sidebar({
  active = 'reservas',
  variant = 'permanent',
  open = false,
  onClose,
}: Props) {
  const api = useApi();
  const navigate = useNavigate();

  // Estado colapsado SOLO aplica a 'permanent'
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar:collapsed') || 'false');
    } catch {
      return false;
    }
  });

  const widthExpanded = 280;
  const widthCollapsed = 85;
  const width =
    variant === 'permanent' && collapsed ? widthCollapsed : widthExpanded;

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

  const Content = (
    <Paper
      elevation={1}
      sx={{
        minHeight: '100dvh',
        width,
        borderRadius: 0,
        position: variant === 'permanent' ? 'sticky' : 'relative',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        px: 1,
        py: 2,
        gap: 1,
        transition: theme =>
          theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
      }}>
      {variant === 'permanent' ? (
        <List sx={{px: collapsed ? 0 : 1}}>
          <Tooltip
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            placement={collapsed ? 'right' : 'bottom'}>
            <ListItemButton
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              aria-expanded={!collapsed}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                minHeight: 40,
                alignSelf: 'stretch',
                px: collapsed ? 1 : 1.5,
                justifyContent: collapsed ? 'center' : 'space-between',
              }}>
              {/* Izquierda: icono + título (solo cuando NO está colapsado) */}
              {!collapsed && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  <DirectionsCarIcon sx={{mr: 1}} />
                  <ListItemText primary="Rent Car" />
                </Box>
              )}

              {/* Derecha (o centrado en colapsado): hamburguesa */}
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  mr: collapsed ? 0 : 0,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                <MenuIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </List>
      ) : (
        // Header para 'temporary': título + botón cerrar
        <Box
          sx={{
            px: 2,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
            <DirectionsCarIcon />
            <Typography variant="subtitle1" fontWeight={600}>
              Rent Car
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar menú" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <Divider />
      {/* Navegación */}
      <List sx={{px: variant === 'permanent' && collapsed ? 0 : 1}}>
        {NAV_ITEMS.map(item => {
          const selected = active === item.key;
          const content = (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => {
                navigate(item.to);
                onClose?.();
              }}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                minHeight: 40,
                px: variant === 'permanent' && collapsed ? 1 : 1.5,
                justifyContent:
                  variant === 'permanent' && collapsed
                    ? 'center'
                    : 'flex-start',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {color: 'inherit'},
                  '&:hover': {bgcolor: 'primary.main'},
                },
              }}>
              <ListItemIcon
                sx={{
                  minWidth: variant === 'permanent' && collapsed ? 0 : 36,
                  mr: variant === 'permanent' && collapsed ? 0 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                {item.icon}
              </ListItemIcon>
              {!(variant === 'permanent' && collapsed) && (
                <ListItemText primary={item.label} />
              )}
            </ListItemButton>
          );

          return variant === 'permanent' && collapsed ? (
            <Tooltip key={item.key} title={item.label} placement="right">
              <span>{content}</span>
            </Tooltip>
          ) : (
            content
          );
        })}
      </List>
      <Box sx={{mt: 'auto'}} />
      {/* Footer / Logout */}
      <Box sx={{px: variant === 'permanent' && collapsed ? 1 : 2, pb: 1}}>
        {variant === 'permanent' && collapsed ? (
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton
              color="primary"
              onClick={logout}
              size="large"
              sx={{mx: 'auto', display: 'block'}}>
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

  // Overlay (encima de todo)
  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{keepMounted: true}}>
        {Content}
      </Drawer>
    );
  }

  // Permanente (en columna)
  return Content;
}
