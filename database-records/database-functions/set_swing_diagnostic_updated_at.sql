-- database_records/database_functions/set_swing_diagnostic_updated_at.sql
begin
  new.updated_at = now();
  return new;
end;
