import * as React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Divider,
  Rating as MuiRating,
  TextField,
  Button,
  LinearProgress,
} from '@mui/material';
import {useStore} from '../../lib/hooks/useStore';
import useApi from '../../lib/hooks/useApi';
import type {Reservation} from '../../lib/types/reservations';
import type {Rating, RatingDirection} from '../../lib/types/ratings.ts';
import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

function normalizeByDirection(payload: Rating[] | Rating | null | undefined) {
  const byDir: Partial<Record<RatingDirection, Rating>> = {};
  if (!payload) return byDir;
  const list: Rating[] = Array.isArray(payload) ? payload : [payload];
  for (const r of list) byDir[r.direction] = r;
  return byDir;
}

export default function ReservationRatings({
  reservation,
}: {
  reservation: Reservation;
}) {
  const {userStore, uiStore} = useStore();
  const role = userStore.user?.role; // 'admin' | 'employee' | 'customer'
  const api = useApi();
  const {t} = useTranslation();

  const [loading, setLoading] = useState(false);
  const [byDirection, setByDirection] = useState<
    Partial<Record<RatingDirection, Rating>>
  >({});

  const eligible =
    reservation.status === 'completed' &&
    new Date(reservation.end_at).getTime() <= Date.now();

  const canCustomerRate =
    role === 'customer' && eligible && !byDirection['customer_to_company'];

  const canStaffRate =
    (role === 'admin' || role === 'employee') &&
    reservation.status === 'completed' &&
    !byDirection['employee_to_customer'];

  const refresh = useCallback(() => {
    setLoading(true);
    api.getReservationRatings(reservation.id).handle({
      onSuccess: (res: Rating[] | Rating) =>
        setByDirection(normalizeByDirection(res)),
      onFinally: () => setLoading(false),
    });
  }, [api, reservation.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Paper variant="outlined" sx={{p: 2}}>
      <Typography variant="subtitle1" mb={1}>
        {t('reservations.rating.title')}
      </Typography>
      {loading && <LinearProgress sx={{mb: 2}} />}

      {/* Already rated states */}
      {byDirection.customer_to_company && (
        <>
          <RatedCard
            //title="Experiencia del cliente (hacia la empresa)"
            title={t('reservations.rating.customerToCompany')}
            rating={byDirection.customer_to_company}
          />
          <Divider sx={{my: 2}} />
        </>
      )}
      {byDirection.employee_to_customer && (
        <RatedCard
          //title="Evaluación del cliente (hecha por staff)"
          title={t('reservations.rating.staffToCustomer')}
          rating={byDirection.employee_to_customer}
        />
      )}

      {/* Forms (only if allowed & not yet rated) */}
      {canCustomerRate && (
        <>
          <Divider sx={{my: 2}} />
          <CreateRatingForm
            title="Calificar tu experiencia"
            direction="customer_to_company"
            onSubmit={(score, comment) => {
              api
                .addReservationRating(reservation.id, {
                  direction: 'customer_to_company',
                  score,
                  comment,
                })
                .handle({
                  onSuccess: () => {
                    uiStore?.showSnackbar?.(
                      '¡Gracias por tu calificación!',
                      'success',
                    );
                    refresh();
                  },
                  onError: (err: any) => {
                    uiStore?.showSnackbar?.(
                      err?.response?.data?.error ||
                        'No se pudo guardar la calificación',
                      'danger',
                    );
                  },
                });
            }}
          />
        </>
      )}

      {canStaffRate && (
        <>
          <Divider sx={{my: 2}} />
          <CreateRatingForm
            title="Calificar comportamiento del cliente"
            direction="employee_to_customer"
            onSubmit={(score, comment) => {
              api
                .addReservationRating(reservation.id, {
                  direction: 'employee_to_customer',
                  score,
                  comment,
                })
                .handle({
                  onSuccess: () => {
                    uiStore?.showSnackbar?.(
                      'Calificación registrada',
                      'success',
                    );
                    refresh();
                  },
                  onError: (err: any) => {
                    uiStore?.showSnackbar?.(
                      err?.response?.data?.error ||
                        'No se pudo guardar la calificación',
                      'danger',
                    );
                  },
                });
            }}
          />
        </>
      )}

      {!loading &&
        !canCustomerRate &&
        !canStaffRate &&
        !byDirection.customer_to_company &&
        !byDirection.employee_to_customer && (
          <Typography variant="body2" color="text.secondary">
            No hay calificaciones disponibles para esta reserva todavía.
          </Typography>
        )}
    </Paper>
  );
}

function RatedCard({title, rating}: {title: string; rating: Rating}) {
  return (
    <Stack spacing={0.5} sx={{mb: 1.5}}>
      <Typography variant="subtitle2">{title}</Typography>
      <MuiRating value={rating.score} readOnly />
      {rating.comment && (
        <Typography variant="body2" color="text.secondary">
          “{rating.comment}”
        </Typography>
      )}
    </Stack>
  );
}

function CreateRatingForm({
  title,
  onSubmit,
}: {
  title: string;
  direction: RatingDirection;
  onSubmit: (score: number, comment?: string) => void;
}) {
  const [score, setScore] = useState<number | null>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handle = () => {
    if (!score) return;
    setSubmitting(true);
    Promise.resolve(onSubmit(score, comment)).finally(() =>
      setSubmitting(false),
    );
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2">{title}</Typography>
      <MuiRating value={score} onChange={(_, v) => setScore(v)} size="large" />
      <TextField
        value={comment}
        onChange={e => setComment(e.target.value)}
        size="small"
        placeholder="Comentario (opcional)"
        multiline
        minRows={2}
      />
      <Button
        onClick={handle}
        disabled={!score || submitting}
        variant="contained"
        sx={{alignSelf: 'flex-start'}}>
        {submitting ? 'Guardando…' : 'Enviar calificación'}
      </Button>
    </Stack>
  );
}
