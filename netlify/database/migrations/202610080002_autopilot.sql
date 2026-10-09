CREATE TABLE colony_settings (
  id integer PRIMARY KEY,
  enabled integer NOT NULL DEFAULT 0,
  next_run text NOT NULL DEFAULT '',
  daily_date text NOT NULL DEFAULT '',
  daily_runs integer NOT NULL DEFAULT 0,
  cursor integer NOT NULL DEFAULT 0
);
INSERT INTO colony_settings(id) VALUES(1);
ALTER TABLE orders ADD max_reads integer NOT NULL DEFAULT 100;
ALTER TABLE orders ADD automatic integer NOT NULL DEFAULT 0;
