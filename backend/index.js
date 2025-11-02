// 1. Importar las herramientas
import express from 'express';
import cors from 'cors';
import path from 'path'; // Módulo para manejar rutas de archivos
import multer from 'multer';
import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Dónde guardar los archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guardaremos las imágenes en la carpeta 'public/uploads'
    // (Asegúrate de crear estas carpetas: backend/public/uploads)
    cb(null, 'public/uploads'); 
  },
  filename: (req, file, cb) => {
    // Crea un nombre de archivo único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 2. Inicializar las herramientas
const app = express();
// 2.1 Haz que la carpeta 'public' sea accesible para el navegador
// Esto permite que el frontend vea las imágenes en http://localhost:3000/uploads/imagen.jpg
app.use(express.static('public'));
const prisma = new PrismaClient();
const JWT_SECRET = 'Equipo3LasFokinCabrasDeLaIS'; 

// 3. Configurar Middlewares (Herramientas intermedias)
app.use(cors({
  origin: 'http://localhost:5173' // Solo permite peticiones del frontend
}));
app.use(express.json()); // Permite al servidor entender JSON

// Simple request logger to help diagnose incoming requests (including probes)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

/* ================================================================================
                                RUTAS DEL API
  - Aquí van todas las rutas que el frontend puede usar para interactuar con el backend
 ================================================================================ */

// 4. Crear la ruta de LOGIN (Primera funcionalidad)
app.post('/api/auth/login', async (req, res) => {
  try {
    // Log 1: Ver qué llega del frontend
    console.log('Datos recibidos:', req.body); 
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      console.log('Error: Faltan correo o contraseña en req.body');
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Log 2: Buscar al usuario (Verificar nombre del campo en where)
    console.log(`Buscando usuario con correo: ${correo}`);
    const usuario = await prisma.usuarios.findUnique({
      // ¡¡REVISA ESTE NOMBRE DE CAMPO!! Debe coincidir EXACTO con tu schema.prisma
      where: { correoelectronico: correo }, 
      include: { 
        // ¡¡REVISA ESTE NOMBRE DE RELACIÓN Y CAMPO!!
        roles: true // Asumiendo que la relación se llama 'roles'
      } 
    });

    // Log 3: Ver si se encontró el usuario
    console.log('Usuario encontrado en BD:', usuario); 

    if (!usuario) {
      console.log('Resultado: Usuario NO encontrado en la base de datos.');
      // Devolver 401 para seguridad (no decir si el usuario existe o no)
      return res.status(401).json({ error: 'Credenciales inválidas' }); 
    }

    // Log 4: Comparar contraseñas
    console.log('Comparando contraseña recibida con hash de BD...');
    const esContrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    console.log('Resultado de bcrypt.compare:', esContrasenaValida); // ¿Es true o false?

    if (!esContrasenaValida) {
      console.log('Resultado: La contraseña NO coincide.');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Log 5: Verificar acceso al nombre del rol
    // ¡¡REVISA ESTE NOMBRE DE CAMPO DEL ROL!!
    const roleName = usuario.roles?.nombrerol ?? 'RolDesconocido'; 
    console.log('Rol obtenido:', roleName);

    // --- Si llegas hasta aquí, el login fue exitoso ---
    console.log('¡Login Exitoso!');
    const token = jwt.sign(
      { id: usuario.id_usuario, rol: roleName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login exitoso',
      token: token,
      usuario: {
        id: usuario.id_usuario,
        // Usamos el correo como nombre temporal si no hay más datos
        nombre: usuario.correoelectronico, 
        rol: roleName
      }
    });

  } catch (error) {
    console.error('Error CRÍTICO en /api/auth/login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// ========= RUTA PARA OBTENER TODOS LOS PRODUCTOS =========
app.get('/api/products', async (req, res) => {
  try {
    // 1. Usamos Prisma para buscar todos los productos
    const productos = await prisma.productos.findMany({
      where: {
        activo: true // Solo mostramos los productos que están activos
      },
      include: {
        // Opcional: si queremos incluir la categoría
        // categorias: true 
      }
    });

    // 2. Enviamos los productos de vuelta al frontend
    res.json(productos);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========= RUTA PARA OBTENER UN SOLO PRODUCTO Y SUS OPCIONES =========
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params; // Obtiene el ID de la URL

    // 1. Busca el producto específico por su ID
    const producto = await prisma.productos.findUnique({
      where: { id_producto: parseInt(id) }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 2. Busca TODAS las opciones de personalización disponibles
    // (Asumimos que todos los pasteles pueden tener las mismas opciones)
    const atributos = await prisma.product_attributes.findMany({
      include: {
        // Incluye las opciones de cada atributo (Pequeño, Mediano, Chocolate...)
        attribute_options: true 
      }
    });

    // 3. Envía ambos como respuesta
    res.json({ producto, atributos });

  } catch (error) {
    console.error(`Error al obtener producto ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============== RUTA PARA UTILIZAR EL CARRITO =======================

//=============== RUTA PARA EL ÁREA DE PAGOS ========================== 

// Ruta para crear un nuevo producto (protegida por admin, pero lo omitiremos por ahora)
app.post('/api/admin/products', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, sku, descripcion, precioBase, id_categoria } = req.body;

    // req.file contiene la información de la imagen subida por multer
    if (!req.file) {
      return res.status(400).json({ error: 'La imagen es requerida' });
    }

    // 1. Obtenemos la ruta de la imagen para guardarla en la BD
    // (Guardamos la URL, no la ruta completa del disco)
    const imagenURL = `/uploads/${req.file.filename}`;

    // 2. Creamos el producto en la BD (¡Prisma ya sabe de ImagenURL!)
    const nuevoProducto = await prisma.productos.create({
      data: {
        SKU: sku,
        Nombre: nombre,
        Descripcion: descripcion,
        PrecioBase: parseFloat(precioBase), // Asegúrate de que sea un número
        ID_Categoria: parseInt(id_categoria), // Asegúrate de que sea un número
        ImagenURL: imagenURL // <-- ¡AQUÍ ESTÁ!
      }
    });

    res.status(201).json(nuevoProducto);

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// =========================== FIN RUTAS DEL API =========================== //

// 5. Iniciar el servidor
const PORT = 3000; // Elige un puerto (ej. 3000)
// Root route - helpful for browser checks
app.get('/', (req, res) => {
  res.json({ message: 'Backend running. Use /api/auth/login for auth endpoints.' });
});

// Respond to common devtools/extension probes under .well-known
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({ name: 'DulceSys backend', status: 'ok' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});