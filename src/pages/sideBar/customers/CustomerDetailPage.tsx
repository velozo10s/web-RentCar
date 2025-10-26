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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

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

  // Simple viewer state — stores which image is open
  const [viewer, setViewer] = React.useState<{
    open: boolean;
    src: string;
    title: string;
  } | null>(null);

  const openViewer = (src: string, title: string) =>
    setViewer({open: true, src, title});
  const closeViewer = () => setViewer(null);

  const cols = Math.min(
    2,
    ['frontFilePath', 'backFilePath'].filter(k => (doc as any)[k]).length,
  );

  async function downloadImageBlob(
    url: string,
    filename?: string,
    extraHeaders?: Record<string, string>,
  ) {
    try {
      const res = await fetch(url, {
        // Sends cookies for same-origin and cookie-based auth
        credentials: 'include',
        headers: {
          ...(extraHeaders || {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      // Try to get filename from headers if server provides it
      const cd = res.headers.get('content-disposition') || '';
      const headerNameMatch = cd.match(
        /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i,
      );
      const headerName = headerNameMatch
        ? decodeURIComponent(headerNameMatch[1])
        : undefined;

      const finalName =
        headerName || filename || deriveFileNameFromUrl(url) || 'download';

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab if download fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function deriveFileNameFromUrl(url: string) {
    try {
      const u = new URL(url, window.location.href);
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (!last) return undefined;
      // If it has no extension, add one; most ID/back photos are jpeg/png
      if (!/\.[a-z0-9]{2,4}$/i.test(last)) return `${last}.jpg`;
      return last;
    } catch {
      return undefined;
    }
  }

  function extractBaseName(url: string): string {
    try {
      // Tomamos la última parte del path (ej: "1111111-CI-document_back-1761482508738.jpg")
      const fileName = url.split('/').pop() || '';

      // Quitamos la extensión (.jpg, .png, etc.)
      const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

      // Si hay un número o timestamp al final separado por guiones, lo removemos
      return nameWithoutExt.replace(/-\d+$/, '');
    } catch {
      return '';
    }
  }

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

      <ImageList cols={cols} gap={8} sx={{m: 0}}>
        {doc.frontFilePath && (
          <ImageThumb
            src={doc.frontFilePath}
            title="Front"
            onPreview={() =>
              openViewer(doc.frontFilePath!, extractBaseName(doc.backFilePath!))
            }
          />
        )}
        {doc.backFilePath && (
          <ImageThumb
            src={doc.backFilePath}
            title="Back"
            onPreview={() =>
              openViewer(doc.backFilePath!, extractBaseName(doc.backFilePath!))
            }
          />
        )}
      </ImageList>

      {/* Viewer Dialog */}
      <Dialog
        open={!!viewer?.open}
        onClose={closeViewer}
        maxWidth="lg"
        fullWidth>
        <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
          <Typography variant="subtitle1" sx={{flex: 1}}>
            {viewer?.title}
          </Typography>
          <Tooltip title="Close">
            <IconButton onClick={closeViewer} aria-label="Close preview">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 0,
            backgroundColor: theme => theme.palette.grey[100],
          }}>
          {viewer?.src && (
            <Box sx={{width: '100%', textAlign: 'center'}}>
              <img
                src={viewer.src}
                alt={viewer.title}
                style={{
                  width: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{px: 2, py: 1.5}}>
          {viewer?.src && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadImageBlob(
                  viewer.src,
                  viewer.title?.replace(/\s+/g, '_').toLowerCase() + '.jpg',
                )
              }>
              Download
            </Button>
          )}
          <Button
            onClick={closeViewer}
            variant="contained"
            startIcon={<CloseIcon />}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ImageThumb({
  src,
  title,
  onPreview,
}: {
  src: string;
  title: string;
  onPreview: () => void;
}) {
  return (
    <ImageListItem sx={{position: 'relative'}}>
      <Box
        component="img"
        src={src}
        alt={title}
        loading="lazy"
        onClick={onPreview}
        style={{
          borderRadius: 4,
          objectFit: 'cover',
          width: '100%',
          height: 220,
          cursor: 'zoom-in',
          display: 'block',
        }}
      />
      <ImageListItemBar
        title={title}
        position="bottom"
        actionIcon={
          <Tooltip title="Preview">
            <IconButton
              sx={{color: 'white'}}
              aria-label={`Preview ${title}`}
              onClick={onPreview}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        }
        actionPosition="right"
      />
    </ImageListItem>
  );
}
