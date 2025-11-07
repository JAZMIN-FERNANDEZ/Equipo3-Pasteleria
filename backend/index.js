// 1. Importar las herramientas
import express from 'express';
import cors from 'cors';
import path from 'path'; // Módulo para manejar rutas de archivos
import multer from 'multer';
import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { startOfMonth, endOfMonth } from 'date-fns';


const autenticarUsuario = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No hay token' });
    }
    
    const token = authHeader.split(' ')[1]; // "Bearer TOKEN_AQUI"
    if (!token) {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    // Usamos el mismo secreto que en el login
    const payload = jwt.verify(token, JWT_SECRET);
    
    // ¡IMPORTANTE! Adjuntamos el usuario (ID y Rol) al objeto 'req'
    req.usuario = { id: payload.id, rol: payload.rol };
    
    next(); // Pasa a la siguiente función (la ruta)
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

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
const esPersonalAutorizado = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes el rol adecuado.' });
    }
    next();
  };
};
const upload = multer({ storage: storage });

// 2. Inicializar las herramientas
const app = express();
// 2.1 Haz que la carpeta 'public' sea accesible para el navegador
// Esto permite que el frontend vea las imágenes en http://localhost:3000/uploads/imagen.jpg
app.use(express.static('public'));
const prisma = new PrismaClient();
const JWT_SECRET = 'Equipo3LasFokinCabrasDeLaIS'; 

const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'Administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
  next();
};

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
  - Aquí van todas las rutas que el frontend puede usar para interactuar con la bd chavales
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




// ============ RUTAS DEL CARRITO ==============
// Todas estas rutas están protegidas y requieren un token
// 1. OBTENER el carrito del usuario logueado
app.get('/api/cart', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    
    const items = await prisma.carrito_items.findMany({ 
      where: { 
        id_usuario: idUsuario // <-- 🛠️ CORREGIDO (minúscula)
      },
      include: { 
        productos: true 
      } 
    });
    
    res.json(items);
  } catch (error) {
    console.error("Error al obtener el carrito:", error);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
});

// 2. AÑADIR un item al carrito 
app.post('/api/cart', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    const { id_producto, cantidad, personalizacion } = req.body;

    const newItem = await prisma.carrito_items.create({
      data: {
        id_usuario: idUsuario,
        id_producto: id_producto,
        cantidad: cantidad,
        personalizacion: personalizacion
      }
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error al añadir al carrito:", error);
    res.status(500).json({ error: 'Error al añadir al carrito' });
  }
});

// 3. BORRAR un item del carrito 
app.delete('/api/cart/:itemId', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    const { itemId } = req.params;

    await prisma.carrito_items.delete({
      where: {
        id_item_carrito: parseInt(itemId), // <-- 🛠️ CORREGIDO (minúscula)
        id_usuario: idUsuario              // <-- 🛠️ CORREGIDO (minúscula)
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error("Error al borrar del carrito:", error);
    res.status(500).json({ error: 'Error al borrar del carrito' });
  }
});

// ========= RUTA PARA OBTENER TODOS LOS PRODUCTOS (USADO EN INICIO) =========
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

// ========= RUTA PRODUCT DETAIL (OBTIENE UN SOLO PRODUCTO) =========
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Busca el producto (como antes)
    const producto = await prisma.productos.findUnique({
      where: { id_producto: parseInt(id) }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 2. Busca los atributos (como antes)
    const atributos = await prisma.product_attributes.findMany({ 
      include: {
        attribute_options: true 
      }
    });

    // ===       USO DEL "PIVOTE"        ===
    const BUFFER_EXHIBICION = 2; // La regla de negocio 
    
    // Calcula el stock real que se puede vender en línea
    const stockDisponibleParaVenta = Math.max(0, producto.stockproductosterminados - BUFFER_EXHIBICION);

    // 3. Envía ambos como respuesta
    res.json({ 
      producto, 
      atributos, 
      stockDisponible: stockDisponibleParaVenta // <-- Enviamos el stock calculado
    });

  } catch (error) {
    console.error(`Error al obtener producto ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTA DE MIS PEDIDOS (CLIENTE) ====================
app.get('/api/orders/my-history', autenticarUsuario, async (req, res) => {
  try {
    const idUsuarioLogueado = req.usuario.id;

    // 1. Necesitamos encontrar el ID de CLIENTE del usuario
    // El req.usuario.id es el ID de la tabla 'usuarios'
    const cliente = await prisma.clientes.findUnique({
      where: { id_usuario: idUsuarioLogueado }
    });

    // 2. Manejar el caso de que el usuario no sea un cliente
    if (!cliente) {
      // Esto podría pasar si un Admin o Cajero intenta entrar
      return res.status(403).json({ error: 'No se encontró un perfil de cliente asociado.' });
    }

    // 3. Buscar todos los pedidos que coincidan con el ID de CLIENTE
    const pedidos = await prisma.pedidos.findMany({
      where: {
        id_cliente: cliente.id_cliente,
        activo: true // Opcional: solo mostrar pedidos activos
      },
      orderBy: {
        fechapedido: 'desc' // Mostrar los más recientes primero
      }
    });

    res.json(pedidos);

  } catch (error) {
    console.error("Error al obtener 'Mis Pedidos':", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



// ============ RUTAS DE GESTIÓN DE PEDIDOS ====================
// (Accesible por Admin y Cajero)

// --- 1. OBTENER TODOS LOS PEDIDOS PENDIENTES ---
app.get('/api/admin/orders', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const pedidos = await prisma.pedidos.findMany({
      where: {
        activo: true,
        estado: {
          // Solo traemos los que necesitan acción
          in: ['Pendiente', 'En preparación'] 
        }
      },
      include: {
        clientes: { // Para obtener el nombre del cliente
          select: { nombre: true }
        },
        // Para simular la UI, traemos el primer producto del pedido
        detalle_pedido: {
          take: 1, 
          include: {
            productos: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: {
        fechapedido: 'asc' // Los más antiguos primero
      }
    });

    // Reformateamos los datos para que coincidan con la UI
    const pedidosFormateados = pedidos.map(p => {
      const primerItem = p.detalle_pedido[0];
      return {
        id_pedido: p.id_pedido,
        cliente: p.clientes.nombre,
        producto: primerItem ? primerItem.productos.nombre : 'N/A',
        cantidad: primerItem ? primerItem.cantidad : 0,
        hora: new Date(p.fechapedido).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        estado: p.estado
      };
    });

    res.json(pedidosFormateados);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. ACTUALIZAR EL ESTADO DE UN PEDIDO ---
app.put('/api/admin/orders/:id/status', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // Ej: "Listo" o "En preparación"

    if (!estado) {
      return res.status(400).json({ error: 'El campo "estado" es requerido' });
    }

    await prisma.pedidos.update({
      where: { id_pedido: parseInt(id) },
      data: { estado: estado }
    });

    res.status(200).json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// ============ RUTAS DE INVENTARIO (ADMIN) ======================
// ----- 1. OBTENER TODOS LOS PRODUCTOS -----
app.post('/api/admin/products', autenticarUsuario, esAdmin, upload.single('imagen'), async (req, res) => {
  try {
    //  CORRECCIÓN 1: 
    const { nombre, sku, descripcion, precioBase, id_categoria, stockproductosterminados } = req.body;

    // req.file contiene la información de la imagen subida por multer
    if (!req.file) {
      return res.status(400).json({ error: 'La imagen es requerida' });
    }

    const imagenURL = `/uploads/${req.file.filename}`;

    //
    const nuevoProducto = await prisma.productos.create({
      data: {
        sku: sku,
        nombre: nombre,
        descripcion: descripcion,
        preciobase: parseFloat(precioBase),
        id_categoria: parseInt(id_categoria),
        stockproductosterminados: parseInt(stockproductosterminados), 
        imagenurl: imagenURL // 
      }
    });

    res.status(201).json(nuevoProducto);

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
app.put('/api/admin/products/:id', autenticarUsuario, esAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    // OJO: Los datos de un FormData vienen como strings
    const { sku, nombre, descripcion, precioBase, id_categoria, stockProductosTerminados } = req.body;

    // 1. Prepara los datos a actualizar
    const dataToUpdate = {
      sku,
      nombre,
      descripcion,
      preciobase: parseFloat(precioBase),
      id_categoria: parseInt(id_categoria),
      stockproductosterminados: parseInt(stockProductosTerminados)
    };

    // 2. Si se subió una NUEVA imagen, añade su URL
    if (req.file) {
      dataToUpdate.imagenurl = `/uploads/${req.file.filename}`;
      // (Opcional: Aquí podrías borrar la imagen antigua del disco duro)
    }

    // 3. Ejecuta la actualización
    const productoActualizado = await prisma.productos.update({
      where: { id_producto: parseInt(id) },
      data: dataToUpdate
    });

    res.json(productoActualizado);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// --- 4. ELIMINAR (DESACTIVAR) UN PRODUCTO ---
app.delete('/api/admin/products/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Usamos 'update' para un borrado lógico (soft delete)
    await prisma.productos.update({
      where: { id_producto: parseInt(id) },
      data: { activo: false }
    });
    
    res.status(204).send(); // Éxito, sin contenido
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// --- 2. OBTENER TODOS LOS INGREDIENTES ---
app.get('/api/admin/ingredients', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const ingredientes = await prisma.ingredientes.findMany({
      where: { activo: true },
      // include: { proveedores: true } // Opcional: para mostrar el nombre del proveedor
    });
    res.json(ingredientes);
  } catch (error) {
    console.error("Error al obtener ingredientes:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. CREAR UN NUEVO INGREDIENTE ---
app.post('/api/admin/ingredients', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { sku, nombre, stockactual, stockminimo, unidadmedida, id_proveedor } = req.body;
    
    const nuevoIngrediente = await prisma.ingredientes.create({
      data: {
        sku,
        nombre,
        stockactual: parseFloat(stockactual),
        stockminimo: parseFloat(stockminimo),
        unidadmedida,
        id_proveedor: id_proveedor ? parseInt(id_proveedor) : null
      }
    });
    res.status(201).json(nuevoIngrediente);
  } catch (error) {
    console.error("Error al crear ingrediente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 3. ACTUALIZAR UN INGREDIENTE ---
app.put('/api/admin/ingredients/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, nombre, stockactual, stockminimo, unidadmedida, id_proveedor } = req.body;

    const ingredienteActualizado = await prisma.ingredientes.update({
      where: { id_ingrediente: parseInt(id) },
      data: {
        sku,
        nombre,
        stockactual: parseFloat(stockactual),
        stockminimo: parseFloat(stockminimo),
        unidadmedida,
        id_proveedor: id_proveedor ? parseInt(id_proveedor) : null
      }
    });
    res.json(ingredienteActualizado);
  } catch (error) {
    console.error("Error al actualizar ingrediente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 4. ELIMINAR (DESACTIVAR) UN INGREDIENTE ---
app.delete('/api/admin/ingredients/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Usamos 'update' para un borrado lógico (soft delete)
    await prisma.ingredientes.update({
      where: { id_ingrediente: parseInt(id) },
      data: { activo: false }
    });
    res.status(204).send(); // Éxito, sin contenido
  } catch (error) {
    console.error("Error al eliminar ingrediente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE PROVEEDORES (ADMIN) ===============

// --- 1. OBTENER TODOS LOS PROVEEDORES ---
app.get('/api/admin/suppliers', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const proveedores = await prisma.proveedores.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(proveedores);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. CREAR UN NUEVO PROVEEDOR ---
app.post('/api/admin/suppliers', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    // Obtenemos los datos del body. Todos son strings.
    const { nombre, contacto, telefono, rfc } = req.body;
    
    const nuevoProveedor = await prisma.proveedores.create({
      data: {
        nombre,
        contacto,
        telefono,
        rfc
      }
    });
    res.status(201).json(nuevoProveedor);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 3. ACTUALIZAR UN PROVEEDOR ---
app.put('/api/admin/suppliers/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, rfc } = req.body;

    const proveedorActualizado = await prisma.proveedores.update({
      where: { id_proveedor: parseInt(id) },
      data: {
        nombre,
        contacto,
        telefono,
        rfc
      }
    });
    res.json(proveedorActualizado);
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 4. ELIMINAR (DESACTIVAR) UN PROVEEDOR ---
app.delete('/api/admin/suppliers/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.proveedores.update({
      where: { id_proveedor: parseInt(id) },
      data: { activo: false } // Borrado lógico
    });
    res.status(204).send(); // Éxito, sin contenido
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE CAJEROS (ADMIN) ===========

// --- 1. OBTENER TODOS LOS CAJEROS ---
app.get('/api/admin/cashiers', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const cajeros = await prisma.empleados.findMany({
      where: {
        activo: true,
        // Buscamos empleados cuyo rol de usuario sea 'Cajero'
        usuarios: {
          roles: {
            nombrerol: 'Cajero'
          }
        }
      },
      include: {
        // Incluimos los datos del usuario para obtener el correo
        usuarios: {
          select: { correoelectronico: true }
        }
      }
    });
    res.json(cajeros);
  } catch (error) {
    console.error("Error al obtener cajeros:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. CREAR UN NUEVO CAJERO (Con Transacción) ---
app.post('/api/admin/cashiers', autenticarUsuario, esAdmin, async (req, res) => {
  // Nota: Faltan 'usuario' y 'telefono' porque no están en el schema.prisma
  const { nombrecompleto, correoelectronico, contrasena, turno } = req.body;

  try {
    // 1. Buscar el ID del rol 'Cajero'
    const cajeroRole = await prisma.roles.findUnique({
      where: { nombrerol: 'Cajero' },
      select: { id_rol: true }
    });
    if (!cajeroRole) {
      return res.status(500).json({ error: "Configuración: El rol 'Cajero' no fue encontrado." });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 3. Crear 'usuarios' y 'empleados' en una transacción
    // Si algo falla, todo se revierte.
    const nuevoEmpleado = await prisma.$transaction(async (tx) => {
      // 3.a. Crear el registro en 'usuarios'
      const nuevoUsuario = await tx.usuarios.create({
        data: {
          correoelectronico: correoelectronico,
          contrasena: hashedPassword,
          id_rol: cajeroRole.id_rol,
        }
      });

      // 3.b. Crear el registro en 'empleados' usando el ID del nuevo usuario
      const nuevoEmpleado = await tx.empleados.create({
        data: {
          id_usuario: nuevoUsuario.id_usuario,
          nombrecompleto: nombrecompleto,
          turno: turno
        }
      });
      return nuevoEmpleado;
    });

    res.status(201).json(nuevoEmpleado);

  } catch (error) {
    console.error("Error al crear cajero:", error);
    // Manejo de error de email duplicado
    if (error.code === 'P2002' && error.meta?.target.includes('correoelectronico')) {
      return res.status(409).json({ error: 'Este correo electrónico ya está en uso.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 3. ACTUALIZAR UN CAJERO ---
// (Nota: No implementamos cambio de contraseña por simplicidad)
app.put('/api/admin/cashiers/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id: idEmpleado } = req.params;
    const { nombrecompleto, correoelectronico, turno } = req.body;

    // Actualizamos en una transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar la tabla 'empleados'
      const empleado = await tx.empleados.update({
        where: { id_empleado: parseInt(idEmpleado) },
        data: {
          nombrecompleto: nombrecompleto,
          turno: turno
        },
        select: { id_usuario: true } // Obtenemos el id_usuario para el siguiente paso
      });

      // 2. Actualizar la tabla 'usuarios'
      await tx.usuarios.update({
        where: { id_usuario: empleado.id_usuario },
        data: { correoelectronico: correoelectronico }
      });
    });

    res.json({ message: 'Cajero actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar cajero:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 4. ELIMINAR (DESACTIVAR) UN CAJERO ---
app.delete('/api/admin/cashiers/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id: idEmpleado } = req.params;

    // Borrado lógico en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Obtenemos el id_usuario
      const empleado = await tx.empleados.findUnique({
        where: { id_empleado: parseInt(idEmpleado) },
        select: { id_usuario: true }
      });

      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }

      // 2. Desactivamos al empleado
      await tx.empleados.update({
        where: { id_empleado: parseInt(idEmpleado) },
        data: { activo: false }
      });

      // 3. Desactivamos al usuario
      await tx.usuarios.update({
        where: { id_usuario: empleado.id_usuario },
        data: { activo: false }
      });
    });

    res.status(204).send(); // Éxito, sin contenido
  } catch (error) {
    console.error("Error al eliminar cajero:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE RECOMPENSAS (ADMIN) ===============

// --- 1. OBTENER TODAS LAS REGLAS DE RECOMPENSA ---
app.get('/api/admin/rewards', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const recompensas = await prisma.recompensas.findMany({
      where: { activo: true }
    });
    res.json(recompensas);
  } catch (error) {
    console.error("Error al obtener recompensas:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. CREAR UNA NUEVA REGLA DE RECOMPENSA ---
app.post('/api/admin/rewards', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    // 'puntosrequeridos' lo usaremos como 'monto_requerido' o 'cantidad_requerida'
    const { nombrerecompensa, descripcion, tipo, valor, puntosrequeridos } = req.body;
    
    const nuevaRecompensa = await prisma.recompensas.create({
      data: {
        nombrerecompensa,
        descripcion,
        tipo, // Ej: 'PORCENTAJE_DESCUENTO', 'PRODUCTO_GRATIS'
        valor: parseFloat(valor), // Ej: 10 (para 10%) o 0
        puntosrequeridos: parseInt(puntosrequeridos) // Ej: 500 (para $500 de compra)
      }
    });
    res.status(201).json(nuevaRecompensa);
  } catch (error) {
    console.error("Error al crear recompensa:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 3. ACTUALIZAR UNA REGLA DE RECOMPENSA ---
app.put('/api/admin/rewards/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombrerecompensa, descripcion, tipo, valor, puntosrequeridos } = req.body;

    const recompensaActualizada = await prisma.recompensas.update({
      where: { id_recompensa: parseInt(id) },
      data: {
        nombrerecompensa,
        descripcion,
        tipo,
        valor: parseFloat(valor),
        puntosrequeridos: parseInt(puntosrequeridos)
      }
    });
    res.json(recompensaActualizada);
  } catch (error) {
    console.error("Error al actualizar recompensa:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 4. ELIMINAR (DESACTIVAR) UNA REGLA DE RECOMPENSA ---
app.delete('/api/admin/rewards/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recompensas.update({
      where: { id_recompensa: parseInt(id) },
      data: { activo: false } // Borrado lógico
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar recompensa:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTA DEL DASHBOARD (ADMIN) =====
// =============================================

app.get('/api/admin/dashboard', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDeMes = startOfMonth(hoy);
    const finDeMes = endOfMonth(hoy);

    // 1. Ventas del Mes [cite: 785]
    const ventasMes = await prisma.pedidos.aggregate({
      _sum: {
        total: true,
      },
      where: {
        fechapedido: {
          gte: inicioDeMes,
          lte: finDeMes,
        },
      },
    });

    // 2. Pedidos Totales (históricos) [cite: 795]
    const pedidosTotales = await prisma.pedidos.count();

    // 3. Clientes Nuevos (este mes) [cite: 797]
    const clientesNuevos = await prisma.clientes.count({
      where: {
        fecharegistro: {
          gte: inicioDeMes,
          lte: finDeMes,
        },
      },
    });

    // 4. Productos Activos [cite: 798]
    const productosActivos = await prisma.productos.count({
      where: { activo: true },
    });

    // 5. Productos Más Vendidos (para el gráfico) [cite: 801, 803]
    const topProductosRaw = await prisma.detalle_pedido.groupBy({
      by: ['id_producto'],
      _sum: {
        cantidad: true,
      },
      orderBy: {
        _sum: {
          cantidad: 'desc',
        },
      },
      take: 5, // Top 5
    });

    // Necesitamos los nombres de esos productos
    const productoIds = topProductosRaw.map(p => p.id_producto);
    const productosInfo = await prisma.productos.findMany({
      where: {
        id_producto: { in: productoIds },
      },
      select: {
        id_producto: true,
        nombre: true,
      },
    });

    // Combinamos los datos para el gráfico
    const productosMasVendidos = topProductosRaw.map(p => {
      const info = productosInfo.find(info => info.id_producto === p.id_producto);
      return {
        nombre: info ? info.nombre : 'Producto Desconocido',
        totalVendido: p._sum.cantidad,
      };
    });

    // 6. Enviar todos los datos juntos
    res.json({
      ventasDelMes: ventasMes._sum.total || 0,
      pedidosTotales: pedidosTotales || 0,
      clientesNuevos: clientesNuevos || 0,
      productosActivos: productosActivos || 0,
      productosMasVendidos: productosMasVendidos,
    });

  } catch (error) {
    console.error("Error al generar dashboard:", error);
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