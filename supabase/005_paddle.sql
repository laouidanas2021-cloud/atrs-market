-- Run in SQL Editor (after 001-004).
alter table purchases add column if not exists paddle_txn_id text unique;
