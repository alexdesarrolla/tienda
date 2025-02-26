-- Productos table
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

-- Clientes table
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  detalles TEXT
);

-- Movimientos de Stock table
CREATE TABLE movimientos_stock (
  id SERIAL PRIMARY KEY,
  productoId INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ventas table
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  clienteId INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  productoId INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fiado BOOLEAN NOT NULL DEFAULT FALSE,
  pagado BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT
);

-- Notas table
CREATE TABLE notas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_ventas_cliente ON ventas(clienteId);
CREATE INDEX idx_ventas_producto ON ventas(productoId);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_fiado ON ventas(fiado, pagado);
CREATE INDEX idx_movimientos_producto ON movimientos_stock(productoId);
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(fecha);
CREATE INDEX idx_notas_fecha ON notas(fecha);

-- Initial RLS (Row Level Security) policies
-- These policies allow anyone with the anon key to perform CRUD operations
-- In a production environment, you'd want to restrict these appropriately

-- Enable RLS on all tables
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now
CREATE POLICY "Allow all for productos" ON productos FOR ALL USING (true);
CREATE POLICY "Allow all for clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all for movimientos_stock" ON movimientos_stock FOR ALL USING (true);
CREATE POLICY "Allow all for ventas" ON ventas FOR ALL USING (true);
CREATE POLICY "Allow all for notas" ON notas FOR ALL USING (true);

