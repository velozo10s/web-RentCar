import * as React from 'react';
import {Snackbar, Alert, type AlertColor, Button, Slide} from '@mui/material';
import type {SnackbarProps} from '../../lib/types/snackbar';

// Map your RN variants to MUI severities
const VARIANT_MAP: Record<NonNullable<SnackbarProps['variant']>, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export default function MainSnackbar({
  message,
  isVisible,
  onDismiss,
  style = {},
  duration = 3000,
  showCloseIcon = true,
  action,
  variant = 'info',
}: SnackbarProps) {
  const severity = VARIANT_MAP[variant];

  const handleClose = (_?: unknown, reason?: string) => {
    // ignore "clickaway" like MUI recommends
    if (reason === 'clickaway') return;
    onDismiss?.();
  };

  const handleAction = React.useCallback(() => {
    action?.onPress?.();
    onDismiss?.();
  }, [action, onDismiss]);

  return (
    <Snackbar
      open={isVisible}
      onClose={handleClose}
      autoHideDuration={duration}
      // Change `horizontal: 'right'` to 'left' if you want top-left
      anchorOrigin={{vertical: 'top', horizontal: 'right'}}
      TransitionComponent={props => <Slide {...props} direction="down" />}>
      <Alert
        severity={severity}
        variant="filled"
        // Close icon (optional)
        onClose={showCloseIcon ? () => onDismiss?.() : undefined}
        sx={{
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftStyle: 'solid',
          borderLeftColor: t => t.palette[severity].main, // stripe like your RN version
          ...style, // allow external overrides
        }}
        action={
          action ? (
            <Button color="inherit" size="small" onClick={handleAction}>
              {action.label}
            </Button>
          ) : undefined
        }>
        {message}
      </Alert>
    </Snackbar>
  );
}
