ALTER TABLE colony_settings ADD claude_state text NOT NULL DEFAULT 'unverified';
ALTER TABLE colony_settings ADD claude_error text NOT NULL DEFAULT '';
ALTER TABLE colony_settings ADD claude_checked_at text NOT NULL DEFAULT '';
