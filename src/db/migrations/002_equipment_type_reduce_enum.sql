-- Réduit equipment.type à pc | screen | printer | other (spec certification)
UPDATE equipment SET type = 'pc' WHERE type = 'laptop';
UPDATE equipment SET type = 'other' WHERE type = 'phone';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipment_type_check'
  ) THEN
    ALTER TABLE equipment
      ADD CONSTRAINT equipment_type_check CHECK (type IN ('pc', 'screen', 'printer', 'other'));
  END IF;
END $$;
