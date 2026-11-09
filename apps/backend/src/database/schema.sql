-- Esquema mínimo del catálogo. Se aplica al arrancar y es idempotente,
-- de modo que un redespliegue sobre la misma base no duplica ni destruye datos.

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL UNIQUE,
  category    VARCHAR(40)   NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0.01 AND price <= 1000000),
  description VARCHAR(300)  NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
