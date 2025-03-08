-- Create the productos table
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

-- Create the clientes table
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  detalles TEXT
);

-- Create the ventas table
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER,
  total DECIMAL(10, 2) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiado BOOLEAN NOT NULL DEFAULT FALSE,
  pagado BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  multipleProducts BOOLEAN NOT NULL DEFAULT FALSE,
  items_json TEXT
);

-- Create the movimientos_stock table
CREATE TABLE movimientos_stock (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the notas table
CREATE TABLE notas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

