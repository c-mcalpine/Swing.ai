-- database_records/database_functions/set_user_goal_updated_at.sql
begin
  new.updated_at = now();
  return new;
end;
