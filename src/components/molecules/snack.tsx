import * as React from 'react';
import {Snackbar, Alert, Button} from '@mui/material';
import type {SnackbarProps} from '../../lib/types/snackbar';

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
  const severity = variant === 'danger' ? 'error' : variant;

  const handleClose = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    onDismiss?.();
  };

  return (
    <Snackbar
      open={isVisible}
      onClose={handleClose}
      autoHideDuration={duration}
      anchorOrigin={{vertical: 'top', horizontal: 'right'}} // change to 'left' if you prefer
    >
      <Alert
        severity={severity as any}
        variant="filled"
        onClose={showCloseIcon ? () => onDismiss?.() : undefined}
        sx={{
          alignItems: 'center',
          ...style,
        }}
        action={
          action ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                action.onPress();
                onDismiss?.();
              }}>
              {action.label}
            </Button>
          ) : undefined
        }>
        {message}
      </Alert>
    </Snackbar>
  );
}
