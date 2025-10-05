export type RatingDirection = 'customer_to_company' | 'employee_to_customer';

export type Rating = {
  id: number;
  reservation_id: number;
  direction: RatingDirection;
  rater_user_id: number;
  ratee_user_id?: number | null;
  score: number; // 1..5
  comment?: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyStats = {
  ratings_count: number;
  rating_avg: string; // numeric(3,2) as string from API
};

export type CustomerStats = {
  customer_user_id: number;
  ratings_count: number;
  rating_avg: string;
};

export type CreateRatingDto = {
  direction: RatingDirection;
  score: number; // 1..5
  comment?: string;
};
