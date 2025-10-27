import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {useFormik, FormikProvider, Field} from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import {type TextFieldProps} from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import {useNavigate} from 'react-router-dom';

import useApi from '../lib/hooks/useApi';
import {useStore} from '../lib/hooks/useStore';
import {ROUTES} from '../routes/routes.ts';
import LanguageSwitcher from '../components/organisms/LanguageSwitcher.tsx';
import i18n from 'i18next';

type LoginValues = {
  user: string;
  password: string;
  context: string; // "APP" o "WEB"
};

const FormikTextField: React.FC<TextFieldProps & {name: keyof LoginValues}> = ({
  name,
  ...props
}) => {
  return (
    <Field name={name}>
      {({field, meta}: any) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          error={Boolean(meta.touched && meta.error)}
          helperText={meta.touched && meta.error ? meta.error : ' '}
        />
      )}
    </Field>
  );
};

export default function LoginPage() {
  const {t} = useTranslation();
  const api = useApi();
  const rootStore = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const initialValues: LoginValues = {
    user: '',
    password: '',
    context: 'WEB',
  };

  const validationSchema = Yup.object({
    user: Yup.string().required(
      t('errors.required', {field: t('login.user')}) || 'User is required',
    ),
    password: Yup.string().required(
      t('errors.required', {field: t('login.password')}) ||
        'Password is required',
    ),
  });

  const login = (data: LoginValues) => {
    setLoading(true);
    api.login(data).handle({
      onSuccess: res => {
        rootStore.userStore.setAuth(res);
        rootStore.uiStore.showSnackbar(
          i18n.t('snackBarMessages.loginSuccess', {
            username: rootStore.userStore.user?.username,
          }),
          'success',
        );
      },
      successMessage: t('snackBarMessages.loginSuccess'),
      //errorMessage: t('snackBarMessages.loginError'),
      onFinally: () => {
        setLoading(false);
        navigate(ROUTES.RESERVATIONS);
      },
    });
  };

  const formik = useFormik<LoginValues>({
    initialValues,
    validationSchema,
    onSubmit: login,
  });

  const onLoginPress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(formik.values);
  };

  return (
    <Box
      sx={{
        position: 'fixed', // ignora padding/márgenes de padres
        inset: 0, // top:0 right:0 bottom:0 left:0
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'background.default',
        p: 2, // respiro en móviles
      }}>
      <LanguageSwitcher
        iconButtonProps={{sx: {position: 'absolute', top: 8, right: 8}}}
      />
      <Paper
        elevation={6}
        sx={{width: '100%', maxWidth: 420, p: {xs: 3, sm: 4}, borderRadius: 3}}>
        <Typography variant="h4" fontWeight={700} mb={3} textAlign="center">
          {t('login.title')}
        </Typography>

        <FormikProvider value={formik}>
          <Box component="form" noValidate onSubmit={onLoginPress}>
            <Stack spacing={2.5}>
              <FormikTextField
                name="user"
                label={t('login.user')}
                placeholder={t('login.userPlaceholder') || ''}
                type="email"
                autoComplete="email"
              />
              <FormikTextField
                name="password"
                label={t('login.password')}
                placeholder={t('login.passwordPlaceholder') || ''}
                type="password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{mt: 1}}>
                {loading ? (
                  <CircularProgress size={22} />
                ) : (
                  t('login.loginButton')
                )}
              </Button>
            </Stack>
          </Box>
        </FormikProvider>
      </Paper>
    </Box>
  );
}
