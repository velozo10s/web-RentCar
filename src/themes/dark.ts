import {createTheme} from '@mui/material/styles';
import {sharedColors} from './sharedColors';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {main: sharedColors.pink},
    secondary: {main: sharedColors.info},
    error: {main: sharedColors.danger},
    warning: {main: sharedColors.warning},
    info: {main: sharedColors.info},
    success: {main: sharedColors.success},
    common: {
      black: sharedColors.black,
      white: sharedColors.white,
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
