ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP;

