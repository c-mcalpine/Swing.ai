-- database_records/database_functions/set_profiles_updated_at.sql
begin
  new.updated_at = now();
  return new;
end;
