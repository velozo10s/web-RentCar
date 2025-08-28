import {useTheme as useThemeMui} from '@mui/material/styles';
import {lightTheme} from '../../themes/light.ts';

export type AppTheme = typeof lightTheme;

export const useTheme = () => useThemeMui<AppTheme>();
