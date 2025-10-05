// AppShell.tsx
import * as React from 'react';
import {Box, IconButton} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Sidebar from './Sidebar';

function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = React.useState<number | null>(null);
  const ref = React.useCallback((node: T | null) => {
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number') setWidth(w);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function AppShell({
  active,
  children,
}: {
  active?: React.ComponentProps<typeof Sidebar>['active'];
  children: React.ReactNode;
}) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const baseMaxWidthRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (width == null) return;
    if (baseMaxWidthRef.current == null || width > baseMaxWidthRef.current) {
      baseMaxWidthRef.current = width;
    }
  }, [width]);

  const theme = useTheme();
  const isNarrowBP = useMediaQuery(theme.breakpoints.down('md')); // fallback móvil
  const base = baseMaxWidthRef.current ?? width ?? 0;
  const isOverlay = Boolean(width) && (width! <= base * 0.5 || isNarrowBP);

  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (isOverlay) setOpen(false);
  }, [isOverlay]);

  const iconOffset = 12; // separación del borde

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        overflow: 'hidden',
      }}>
      {/* Sidebar permanente sólo cuando NO es overlay */}
      {!isOverlay && <Sidebar active={active} variant="permanent" />}

      {/* Main: un solo contenedor para todo tu contenido */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
        }}>
        {/* Botón hamburguesa flotante en overlay (arriba a la izquierda) */}
        {isOverlay && !open && (
          <IconButton
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            sx={{
              position: 'fixed', // o 'absolute' si prefieres relativo al main
              top: `calc(env(safe-area-inset-top, 0px) + ${iconOffset}px)`,
              left: `calc(env(safe-area-inset-left, 0px) + ${iconOffset}px)`,
              zIndex: t => t.zIndex.modal + 1, // por encima del contenido
              bgcolor: 'background.paper',
              border: t => `1px solid ${t.palette.divider}`,
              boxShadow: 1,
              '&:hover': {bgcolor: 'background.paper'},
            }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Tu contenido de página */}
        {children}
      </Box>

      {/* Sidebar en overlay (temporary) */}
      {isOverlay && (
        <Sidebar
          active={active}
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </Box>
  );
}
