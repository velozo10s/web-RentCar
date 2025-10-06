import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import AppShell from '../../../components/AppShell';
import useApi from '../../../lib/hooks/useApi';
import {useParams, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import type {
  CustomerDetail,
  CustomerDocument,
} from '../../../lib/types/customers.ts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';

export default function CustomerDetailPage() {
  const {id} = useParams<{id: string}>();
  const personId = Number(id);
  const api = useApi();
  const {t} = useTranslation();
  const navigate = useNavigate();

  const [data, setData] = React.useState<CustomerDetail | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : '—';

  React.useEffect(() => {
    if (!personId) return;
    setLoading(true);
    api.getCustomer(personId).handle({
      onSuccess: res => setData(res || null),
      onFinally: () => setLoading(false),
    });
  }, [api, personId]);

  return (
    <AppShell>
      <Box
        component="main"
        sx={{p: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between">
          <Typography variant="h6">
            {t('customers.detail.title') || 'Customer detail'}
          </Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            {t('common.back') || 'Back'}
          </Button>
        </Stack>

        {loading && <LinearProgress />}

        {data && (
          <>
            {/* Datos generales */}
            <Paper variant="outlined" sx={{p: 2}}>
              <Stack
                direction={{xs: 'column', sm: 'row'}}
                spacing={2}
                alignItems="center"
                justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers.detail.name') || 'Name'}
                  </Typography>
                  <Typography variant="h6">{data.name}</Typography>
                </Stack>

                <Stack spacing={0.5} sx={{minWidth: 220}}>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers.detail.document') || 'Document'}
                  </Typography>
                  <Typography variant="body1">
                    {data.documentType} · {data.documentNumber}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{minWidth: 220}}>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers.detail.birth') || 'Birth date'}
                  </Typography>
                  <Typography variant="body1">
                    {fmtDate(data.birthDate)}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{minWidth: 220}}>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers.detail.phone') || 'Phone'}
                  </Typography>
                  <Typography variant="body1">
                    {data.phoneNumber || '—'}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{minWidth: 150}}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.status') || 'Status'}
                  </Typography>
                  <Chip
                    label={
                      data.isActive
                        ? t('common.active') || 'Active'
                        : t('common.inactive') || 'Inactive'
                    }
                    color={data.isActive ? 'success' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Documentos */}
            <Paper variant="outlined" sx={{p: 2}}>
              <Typography variant="subtitle1" mb={1}>
                {t('customers.detail.documents') || 'Documents'}
              </Typography>

              {!data.documents || data.documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('customers.detail.noDocuments') ||
                    'No documents uploaded.'}
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {data.documents.map((doc, idx) => (
                    <DocumentBlock key={idx} doc={doc} />
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        )}
      </Box>
    </AppShell>
  );
}

function DocumentBlock({doc}: {doc: CustomerDocument}) {
  const labelForType =
    doc.type === 'license'
      ? 'Driver license'
      : doc.type === 'document'
        ? 'Identity document'
        : doc.type;

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Typography variant="subtitle2">{labelForType}</Typography>
        {doc.expirationDate && (
          <Chip
            size="small"
            label={`Expires: ${new Date(doc.expirationDate).toLocaleDateString()}`}
            color="warning"
            variant="outlined"
          />
        )}
      </Stack>

      <ImageList
        cols={Math.min(
          2,
          ['frontFilePath', 'backFilePath'].filter(k => (doc as any)[k]).length,
        )}
        gap={8}
        sx={{m: 0}}>
        {doc.frontFilePath && (
          <ImageListItem>
            <img
              src={doc.frontFilePath}
              alt="front"
              loading="lazy"
              style={{
                borderRadius: 4,
                objectFit: 'cover',
                width: '100%',
                height: 220,
              }}
            />
            <ImageListItemBar title="Front" position="bottom" />
          </ImageListItem>
        )}
        {doc.backFilePath && (
          <ImageListItem>
            <img
              src={doc.backFilePath}
              alt="back"
              loading="lazy"
              style={{
                borderRadius: 4,
                objectFit: 'cover',
                width: '100%',
                height: 220,
              }}
            />
            <ImageListItemBar title="Back" position="bottom" />
          </ImageListItem>
        )}
      </ImageList>
    </Box>
  );
}
