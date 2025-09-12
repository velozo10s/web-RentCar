import React from 'react';
import {observer} from 'mobx-react-lite';
import {useStore} from '../hooks/useStore';
import MainSnackbar from '../../components/molecules/snack'; // points to the MUI version above

export const SnackbarProvider = observer(
  ({children}: {children: React.ReactNode}) => {
    const {uiStore} = useStore();
    const {isVisible, message, variant, duration} = uiStore.snackbar;

    return (
      <>
        {children}
        {isVisible && (
          <MainSnackbar
            isVisible
            message={message}
            variant={variant}
            duration={duration}
            onDismiss={() => uiStore.hideSnackbar()}
          />
        )}
      </>
    );
  },
);
