-- cabin_grades: CCF/NCCF/TAX/TIP 요금 세부 항목 추가
ALTER TABLE cabin_grades
  ADD COLUMN IF NOT EXISTS ccf  numeric,
  ADD COLUMN IF NOT EXISTS nccf numeric,
  ADD COLUMN IF NOT EXISTS tax  numeric,
  ADD COLUMN IF NOT EXISTS tip  numeric;
