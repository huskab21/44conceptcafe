-- Allow table bookings without an account (inserted by the server API with the secret key).
alter table public.reservations alter column user_id drop not null;
