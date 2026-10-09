CREATE TABLE ants (id text PRIMARY KEY, name text NOT NULL, paused integer NOT NULL DEFAULT 0, created text NOT NULL);
CREATE TABLE documents (id text PRIMARY KEY, url text NOT NULL UNIQUE, title text NOT NULL, content text NOT NULL, tokens integer NOT NULL, ant_id text NOT NULL REFERENCES ants(id), created text NOT NULL);
CREATE TABLE orders (id text PRIMARY KEY, url text NOT NULL, ant_id text NOT NULL REFERENCES ants(id), status text NOT NULL, pages integer NOT NULL DEFAULT 0, message text NOT NULL DEFAULT '', target integer NOT NULL DEFAULT 1, queue text NOT NULL DEFAULT '[]', visited text NOT NULL DEFAULT '[]', lease text, created text NOT NULL);
CREATE TABLE events (id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), ant_id text NOT NULL REFERENCES ants(id), kind text NOT NULL, url text NOT NULL, message text NOT NULL, created text NOT NULL);
CREATE TABLE answers (id text PRIMARY KEY, question text NOT NULL, answer text NOT NULL, sources text NOT NULL, created text NOT NULL);
CREATE INDEX orders_pending ON orders(status, created);
CREATE INDEX documents_ant_created ON documents(ant_id, created DESC);
CREATE INDEX events_order_created ON events(order_id, created DESC);
CREATE INDEX answers_created ON answers(created DESC);
