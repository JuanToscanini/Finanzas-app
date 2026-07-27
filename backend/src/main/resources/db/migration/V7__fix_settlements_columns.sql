ALTER TABLE settlements ADD COLUMN currency VARCHAR(3) DEFAULT 'ARS';
ALTER TABLE settlements ADD COLUMN settled_at TIMESTAMP;
ALTER TABLE settlements ADD COLUMN created_at TIMESTAMP DEFAULT now();
ALTER TABLE settlements ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE settlements RENAME COLUMN paid_by_user_id TO paid_by;
ALTER TABLE settlements RENAME COLUMN paid_to_user_id TO paid_to;
ALTER TABLE settlements RENAME COLUMN note TO notes;
ALTER TABLE settlements ALTER COLUMN amount TYPE NUMERIC(12,2);

