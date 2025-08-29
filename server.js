const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar base de datos SQLite
const db = new sqlite3.Database('./productos.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Crear tabla de productos si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
  )`);
});

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ENDPOINTS DE LA API

// GET /productos - Listar todos los productos
app.get('/productos', (req, res) => {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      mensaje: 'Productos obtenidos exitosamente',
      productos: rows
    });
  });
});

// POST /productos - Crear un producto
app.post('/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;
  
  // Validaciones básicas
  if (!nombre || !precio || stock === undefined) {
    return res.status(400).json({ 
      error: 'Todos los campos son requeridos: nombre, precio, stock' 
    });
  }

  if (precio <= 0) {
    return res.status(400).json({ 
      error: 'El precio debe ser mayor a 0' 
    });
  }

  if (stock < 0) {
    return res.status(400).json({ 
      error: 'El stock no puede ser negativo' 
    });
  }

  const sql = `INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)`;
  
  db.run(sql, [nombre, precio, stock], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Obtener el producto recién creado
    db.get('SELECT * FROM productos WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.status(201).json({
        mensaje: 'Producto creado exitosamente',
        producto: row
      });
    });
  });
});

// PUT /productos/:id - Editar un producto
app.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;
  
  // Validaciones básicas
  if (!nombre || !precio || stock === undefined) {
    return res.status(400).json({ 
      error: 'Todos los campos son requeridos: nombre, precio, stock' 
    });
  }

  if (precio <= 0) {
    return res.status(400).json({ 
      error: 'El precio debe ser mayor a 0' 
    });
  }

  if (stock < 0) {
    return res.status(400).json({ 
      error: 'El stock no puede ser negativo' 
    });
  }

  const sql = `UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?`;
  
  db.run(sql, [nombre, precio, stock, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    // Obtener el producto actualizado
    db.get('SELECT * FROM productos WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        mensaje: 'Producto actualizado exitosamente',
        producto: row
      });
    });
  });
});

// DELETE /productos/:id - Eliminar un producto
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `DELETE FROM productos WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    res.json({
      mensaje: 'Producto eliminado exitosamente',
      id: parseInt(id)
    });
  });
});

// Middleware para manejar rutas de API no encontradas (debe ir al final)
app.use('/productos', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    mensaje: 'La ruta solicitada no existe'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cerrar base de datos al terminar el proceso
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexión a la base de datos cerrada.');
    process.exit(0);
  });
});