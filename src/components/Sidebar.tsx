import * as React from 'react';
import {
  Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography, Paper
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MailIcon from '@mui/icons-material/Mail';
import useApi from '../lib/hooks/useApi.ts';
import rootStore from '../lib/stores/rootStore.ts';
import {ROUTES} from '../routes/routes.ts';
import {useNavigate} from 'react-router-dom';

type Props = {
  active?: 'inicio' | 'reservas' | 'vehiculos' | 'reportes' | 'clientes';
};

export default function Sidebar({ active = 'reservas' }: Props) {
  const api = useApi();
  const navigate = useNavigate();

  const data = {
    refreshToken: rootStore.userStore.refreshToken
  };

  const Item = (
    { icon, label, selected = false }:
    { icon: React.ReactNode; label: string; selected?: boolean }
  ) => (
    <ListItemButton selected={selected} sx={{ borderRadius: 1, mb: 1 }}>
      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );

  const logout = () => {
    //setLoading(true);
    api.logout(data).handle({
      onSuccess: () => {
        //userStore.logout();
        rootStore.userStore.logout();
      },
      onError: err => {
        console.log('Server replied with an error:', err.response);
      },
      onFinally: () => {
        //setLoading(false);
        navigate(ROUTES.LOGIN)
      },
    });
  };

  return (
    <Paper
      elevation={1}
      sx={{
        width: 280,
        minHeight: '100dvh',
        p: 2,
        borderRadius: 0,
        position: 'sticky',
        top: 0,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} mb={2} px={1}>
        <DirectionsCarIcon />
        <Typography variant="h6" fontWeight={700}>Rent Car</Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ px: 1 }}>
        <Item icon={<DashboardIcon />} label="Inicio" selected={active === 'inicio'} />
        <Item icon={<MailIcon />} label="Reservas" selected={active === 'reservas'} />
        <Item icon={<DirectionsCarIcon />} label="Vehículos" selected={active === 'vehiculos'} />
        <Item icon={<ReceiptLongIcon />} label="Reportes" selected={active === 'reportes'} />
        <Item icon={<PeopleAltIcon />} label="Clientes" selected={active === 'clientes'} />
      </List>

      <Box flex={1} />

      <Button
        variant="contained"
        fullWidth
        onClick={logout}
        sx={{ mt: 2 }}
      >
        Cerrar sesión
      </Button>
    </Paper>
  );
}
