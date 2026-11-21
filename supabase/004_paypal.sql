-- Run in SQL Editor (after 001-003). Adds PayPal columns.
alter table purchases add column if not exists paypal_order_id text unique;
alter table purchases add column if not exists paypal_capture_id text;
