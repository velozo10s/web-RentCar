import {createTheme} from '@mui/material/styles';
import {sharedColors} from './sharedColors';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {main: sharedColors.pink}, // antes: colors.pink
    secondary: {main: sharedColors.info}, // opcional según tu UI
    error: {main: sharedColors.danger},
    warning: {main: sharedColors.warning},
    info: {main: sharedColors.info},
    success: {main: sharedColors.success},
    common: {
      black: sharedColors.black,
      white: sharedColors.white,
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
});
