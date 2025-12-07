import express from 'express';
import cors from 'cors';
import path from 'path'; // Módulo para manejar rutas de archivos
import multer from 'multer';
import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { validate, productSchema, ingredientSchema, supplierSchema, cashierSchema, registerSchema, clientSchema, recipeSchema, rewardSchema} from './validations.js';
import crypto from 'crypto';
import fs from 'fs';

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
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // Límite de 8MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('¡Solo se permiten imágenes!'));
    }
  }
});

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


const handlePrismaError = (res, error, mensajeContexto) => {
  console.error(mensajeContexto, error); // Sigue imprimiendo en consola 

  // 1. Error de restricción única (P2002)
  // Ej: Intentar crear un usuario con un correo que ya existe o un proveedor con el mismo RFC
  if (error.code === 'P2002') {
    const campo = error.meta?.target ? error.meta.target.join(', ') : 'campo';
    return res.status(409).json({ 
      error: `El valor del campo '${campo}' ya existe en la base de datos.` 
    });
  }

  // 2. Error de registro no encontrado (P2025)
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'El registro solicitado no fue encontrado.' });
  }

  // 3. Error de llave foránea (P2003)
  // Ej: Intentar crear un producto con una categoría que no existe
  if (error.code === 'P2003') {
    return res.status(400).json({ error: 'Operación inválida: El registro relacionado no existe.' });
  }

  // 4. Error por defecto (Muestra el mensaje técnico si no es ninguno de los anteriores)
    res.status(500).json({ 
    error: error.message || 'Error interno desconocido' 
  });
};

const getFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

/* ================================================================================
                                RUTAS DEL API
  - Aquí van todas las rutas que el frontend puede usar para interactuar con la bd chavales
 ================================================================================ */

// ==================== RUTA de LOGIN ====================
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
      // Debe coincidir EXACTO con schema.prisma
      where: { correoelectronico: correo }, 
      include: { 
        // Debe coincidir EXACTO con schema.prisma
        roles: true 
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

// ============ RUTA DE REGISTRO (PÚBLICA) =====
// =============================================
app.post('/api/auth/register', validate(registerSchema), async (req, res) => {
  // 1. Obtenemos los datos del formulario de React
  const { nombre, telefono, correo, contrasena } = req.body;

  // Validación simple
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
  }

  try {
    // 2. Buscar el ID del rol 'Cliente'
    const clienteRole = await prisma.roles.findUnique({
      where: { nombrerol: 'Cliente' },
      select: { id_rol: true }
    });
    if (!clienteRole) {
      return res.status(500).json({ error: "Error de configuración: El rol 'Cliente' no existe." });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 4. Crear 'usuarios' y 'clientes' en una transacción
    const nuevoCliente = await prisma.$transaction(async (tx) => {
      // 4a. Crear el registro en 'usuarios'
      const nuevoUsuario = await tx.usuarios.create({
        data: {
          correoelectronico: correo,
          contrasena: hashedPassword,
          id_rol: clienteRole.id_rol,
        }
      });

      // 4b. Crear el registro en 'clientes' usando el ID del nuevo usuario
      const nuevoCliente = await tx.clientes.create({
        data: {
          id_usuario: nuevoUsuario.id_usuario,
          nombre: nombre,
          telefono: telefono
        }
      });
      return nuevoCliente;
    });

    // 5. Éxito
    res.status(201).json({ message: 'Usuario registrado con éxito', id_cliente: nuevoCliente.id_cliente });

  } catch (error) {
    console.error("Error al registrar usuario:", error);
    // Manejo de error de email duplicado
    if (error.code === 'P2002' && error.meta?.target.includes('correoelectronico')) {
      return res.status(409).json({ error: 'Este correo electrónico ya está en uso.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DEL CARRITO ==============
app.get('/api/cart', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    let recompensaAplicada = null;
    let descuento = 0;

    const items = await prisma.carrito_items.findMany({ 
      where: { id_usuario: idUsuario },
      include: { productos: true } 
    });

    let subtotal = 0;
    const formattedItems = items.map(item => {
      // Recalcular precio base + extras (simplificado para el ejemplo)
      // En un sistema real, recalcularías los extras de personalización aquí también
      const precioItem = parseFloat(item.productos.preciobase); 
      const subtotalItem = precioItem * item.cantidad;
      subtotal += subtotalItem;

      return {
        cartId: item.id_item_carrito,
        productId: item.id_producto,
        name: `${item.productos.nombre} (${Object.values(item.personalizacion || {}).join(', ')})`,
        quantity: item.cantidad,
        stockMaximo: item.productos.stockproductosterminados, // <-- IMPORTANTE: Enviamos el stock real
        price: precioItem,
        subtotal: subtotalItem,
      };
    });

    // Lógica de Recompensas (Cliente)
    if (req.usuario.rol === 'Cliente') {
      const cliente = await prisma.clientes.findUnique({ where: { id_usuario: idUsuario }, select: { id_cliente: true } });
      if (cliente) {
        const recompensaActiva = await prisma.cliente_recompensas.findFirst({
          where: { id_cliente: cliente.id_cliente, estado: 'activa' },
          include: { recompensas: true }
        });
        if (recompensaActiva) {
          const regla = recompensaActiva.recompensas;
          recompensaAplicada = regla;
          if (regla.tipo === 'PORCENTAJE_DESCUENTO') descuento = subtotal * (parseFloat(regla.valor) / 100);
          else if (regla.tipo === 'MONTO_FIJO_DESCUENTO') descuento = parseFloat(regla.valor);
        }
      }
    }

    const totalFinal = Math.max(0, subtotal - descuento);

    res.json({ items: formattedItems, recompensa: recompensaAplicada, subtotal, descuento, totalFinal });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
});

// 2. AÑADIR un item al carrito (Sin cambios)
app.post('/api/cart', autenticarUsuario, async (req, res) => {
  // ... (Tu código actual de POST está bien) ...
  // Solo asegúrate de que guarde la 'cantidad' que recibe del body
  try {
    const idUsuario = req.usuario.id;
    const { id_producto, cantidad, personalizacion } = req.body;
    const newItem = await prisma.carrito_items.create({
      data: { id_usuario: idUsuario, id_producto, cantidad, personalizacion }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir' });
  }
});

// 3. 🛠️ NUEVO: ACTUALIZAR CANTIDAD (PUT)
app.put('/api/cart/:itemId', autenticarUsuario, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad } = req.body; // La nueva cantidad deseada
    const idUsuario = req.usuario.id;

    if (cantidad < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser al menos 1' });
    }

    // 1. Verificar que el item pertenece al usuario y obtener stock
    const itemActual = await prisma.carrito_items.findUnique({
      where: { id_item_carrito: parseInt(itemId) },
      include: { productos: true }
    });

    if (!itemActual || itemActual.id_usuario !== idUsuario) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // 2. Validar Stock (Pivote de 2)
    const BUFFER_EXHIBICION = 2;
    const stockDisponible = itemActual.productos.stockproductosterminados - BUFFER_EXHIBICION;

    if (cantidad > stockDisponible) {
      return res.status(400).json({ error: `Solo hay ${stockDisponible} unidades disponibles.` });
    }

    // 3. Actualizar
    const itemActualizado = await prisma.carrito_items.update({
      where: { id_item_carrito: parseInt(itemId) },
      data: { cantidad: parseInt(cantidad) }
    });

    res.json(itemActualizado);

  } catch (error) {
    console.error("Error al actualizar cantidad:", error);
    res.status(500).json({ error: 'Error al actualizar cantidad' });
  }
});

// 4. BORRAR un item (Sin cambios mayores)
app.delete('/api/cart/:itemId', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    const { itemId } = req.params;
    await prisma.carrito_items.deleteMany({ // deleteMany es más seguro por si el ID no es del usuario
      where: { id_item_carrito: parseInt(itemId), id_usuario: idUsuario }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar item' });
  }
});

// 5. 🛠️ NUEVO: VACIAR CARRITO COMPLETO (DELETE)
app.delete('/api/cart', autenticarUsuario, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    await prisma.carrito_items.deleteMany({
      where: { id_usuario: idUsuario }
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    res.status(500).json({ error: 'Error al vaciar el carrito' });
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

// ============ RUTA DE CHECKOUT (CREAR PEDIDO) ====================
app.post('/api/orders', autenticarUsuario, async (req, res) => {
  const { id: idUsuarioAuth, rol: rolUsuarioAuth } = req.usuario;
  const { metodoPago, montoPagoCon, total, descuentoAplicado, estado } = req.body;

  try {
    const nuevoPedidoResultado = await prisma.$transaction(async (tx) => {
      let clientePedidoId;
      let empleadoPedidoId = null;

      // --- 1. Lógica de Roles (Identificar quién es el cliente) ---
      if (rolUsuarioAuth === 'Cliente') {
        const cliente = await tx.clientes.findUnique({ 
            where: { id_usuario: idUsuarioAuth }, 
            select: { id_cliente: true } 
        });
        if (!cliente) throw new Error('Usuario no es un cliente válido.');
        clientePedidoId = cliente.id_cliente;

      } else if (rolUsuarioAuth === 'Cajero' || rolUsuarioAuth === 'Administrador') {
        const empleado = await tx.empleados.findUnique({ 
            where: { id_usuario: idUsuarioAuth }, 
            select: { id_empleado: true }
        });
        if (empleado) empleadoPedidoId = empleado.id_empleado;
        
        const clienteMostrador = await tx.clientes.findFirst({
          where: { usuarios: { correoelectronico: 'mostrador@dulsys.com' } },
          select: { id_cliente: true }
        });

        if (!clienteMostrador) {
          throw new Error("Error crítico: El cliente 'Venta en Tienda' no existe.");
        }
        clientePedidoId = clienteMostrador.id_cliente; 
      }

      // --- 2. Validar Stock y Preparar Detalles ---
      const itemsDelCarrito = await tx.carrito_items.findMany({
        where: { id_usuario: idUsuarioAuth },
        include: { productos: true }
      });
      if (itemsDelCarrito.length === 0) throw new Error('Tu carrito está vacío.');

      const BUFFER_EXHIBICION = 2;
      const itemsParaDetalle = [];

      for (const item of itemsDelCarrito) {
        const producto = item.productos;
        const stockDisponible = producto.stockproductosterminados - BUFFER_EXHIBICION;

        if (item.cantidad > stockDisponible) {
          throw new Error(`¡Stock insuficiente! El producto "${producto.nombre}" solo tiene ${stockDisponible} disponibles.`);
        }

        itemsParaDetalle.push({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          preciounitario: parseFloat(producto.preciobase),
          personalizacion: item.personalizacion
        });

        // Descontar Stock
        await tx.productos.update({
          where: { id_producto: item.id_producto },
          data: { stockproductosterminados: { decrement: item.cantidad } }
        });
      }

      // --- 3. Crear el Pedido (LO MOVEMOS ANTES DE LAS RECOMPENSAS) ---
      const safeFloat = (valor) => {
        const numero = parseFloat(valor);
        return isNaN(numero) ? 0 : numero;
      };

      const pedidoCreado = await tx.pedidos.create({
        data: {
          id_cliente: clientePedidoId,
          id_empleado: empleadoPedidoId,
          total: safeFloat(total), 
          descuento: safeFloat(descuentoAplicado), 
          estado: estado || 'Pendiente',
          metodo_pago: metodoPago,
          monto_pago_con: metodoPago === 'Efectivo' ? safeFloat(montoPagoCon) : null
        }
      });

      // --- 4. Asignar Recompensa (Solo si es Cliente) ---
      // CORRECCIÓN: Usamos 'clientePedidoId' que ya definimos arriba, NO 'nuevoPedido'
      if (rolUsuarioAuth === 'Cliente') {
        const totalPagado = parseFloat(total); 

        // Revisamos si ya tiene una recompensa activa
        const recompensaExistente = await tx.cliente_recompensas.findFirst({
          where: { id_cliente: clientePedidoId, estado: 'activa' }
        });

        if (!recompensaExistente) {
          const reglas = await tx.recompensas.findMany({
            where: { activo: true },
            orderBy: { puntosrequeridos: 'desc' }
          });

          for (const regla of reglas) {
            if (totalPagado >= parseFloat(regla.puntosrequeridos)) {
              await tx.cliente_recompensas.create({
                data: {
                  id_cliente: clientePedidoId, // Usamos la variable local correcta
                  id_recompensa: regla.id_recompensa,
                  estado: 'activa'
                }
              });
              console.log(`¡Recompensa asignada al cliente ${clientePedidoId}!`);
              break; 
            }
          }
        }
      }

      // --- 5. Guardar Detalles del Pedido ---
      await tx.detalle_pedido.createMany({
        data: itemsParaDetalle.map(item => ({ ...item, id_pedido: pedidoCreado.id_pedido }))
      });

      // --- 6. Limpiar Carrito ---
      await tx.carrito_items.deleteMany({ where: { id_usuario: idUsuarioAuth } });

      return pedidoCreado; // Retornamos el pedido creado dentro de la transacción
    });

    res.status(201).json({ id_pedido: nuevoPedidoResultado.id_pedido, estado: nuevoPedidoResultado.estado });

  } catch (error) {
    console.error("Error al crear el pedido:", error);
    res.status(400).json({ error: error.message || 'Error interno del servidor' });
  }
});
// ============ RUTAS DE GESTIÓN DE PEDIDOS ====================
// (Accesible por Admin y Cajero)

// --- 1. OBTENER TODOS LOS PEDIDOS 
app.get('/api/admin/orders', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const { status } = req.query; 

    let statusFilter;
    let orderByFilter;

    if (status === 'completed') {
      statusFilter = { in: ['Completado', 'Listo', 'Cancelado'] }; 
      orderByFilter = { fechapedido: 'desc' }; // Lo más nuevo arriba
    } else {
      statusFilter = { in: ['Pendiente', 'En preparación'] };
      orderByFilter = { fechapedido: 'asc' }; // Lo más viejo arriba (urgente)
    }

    const pedidos = await prisma.pedidos.findMany({
      where: {
        activo: true,
        estado: statusFilter
      },
      include: {
        clientes: { select: { nombre: true } },
        detalle_pedido: {
          include: { 
            productos: { select: { nombre: true, preciobase: true } } 
          }
        }
      },
      orderBy: orderByFilter
    });

    const pedidosFormateados = pedidos.map(p => {
      const fechaObj = new Date(p.fechapedido);
      
      // Preparamos el array completo de productos para el modal
      const itemsDetallados = p.detalle_pedido.map(d => ({
        id_producto: d.id_producto,
        nombre: d.productos.nombre,
        cantidad: d.cantidad,
        precioUnitario: d.preciounitario, // El precio al momento de la compra
        subtotal: d.cantidad * d.preciounitario,
        personalizacion: d.personalizacion // El JSON con los detalles
      }));

      return {
        id_pedido: p.id_pedido,
        cliente: p.clientes?.nombre || "Cliente General",
        // Mantenemos este campo para la vista rápida en la tabla
        producto: p.detalle_pedido[0] ? `${p.detalle_pedido[0].productos.nombre} ${p.detalle_pedido.length > 1 ? '...' : ''}` : 'Sin productos',
        cantidad: p.detalle_pedido.reduce((acc, item) => acc + item.cantidad, 0), // Suma total de items
        
        fecha: fechaObj.toLocaleDateString('es-MX'),
        hora: fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        
        estado: p.estado,
        total: p.total,
        descuento: p.descuento,
        metodo_pago: p.metodo_pago,
        monto_pago_con: p.monto_pago_con,
        items: itemsDetallados // <-- 🛠️ NUEVO CAMPO CON TODO EL DETALLE
      };
    });

        res.json(pedidosFormateados);

      } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
});

// --- 2. ACTUALIZAR EL ESTADO DE UN PEDIDO 
app.put('/api/admin/orders/:id/status', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const { id } = req.params;
    // Agregamos metodoPago y montoPagoCon a la desestructuración
    const { estado, metodoPago, montoPagoCon } = req.body; 

    if (!estado) {
      return res.status(400).json({ error: 'El campo "estado" es requerido' });
    }

    // Preparamos el objeto de datos dinámicamente
    const dataUpdate = { estado };

    // Solo actualizamos el pago si nos envían los datos (caso "Procesar Pago")
    if (metodoPago) {
      dataUpdate.metodo_pago = metodoPago;
    }
    // Validamos que venga el monto y lo convertimos a número
    if (montoPagoCon !== undefined && montoPagoCon !== null) {
      dataUpdate.monto_pago_con = parseFloat(montoPagoCon);
    }

    const pedidoActualizado = await prisma.pedidos.update({
      where: { id_pedido: parseInt(id) },
      data: dataUpdate
    });

    res.status(200).json({ 
      message: 'Pedido actualizado correctamente', 
      pedido: pedidoActualizado 
    });

  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    // Usamos tu función handlePrismaError si está disponible en el ámbito, o respuesta genérica
    res.status(500).json({ error: 'Error interno del servidor al actualizar el pedido' });
  }
});


// ============ RUTAS DE INVENTARIO (ADMIN) ===============
//=========================================================
// --- 1. CREAR UN PRODUCTO ---
app.post('/api/admin/products', autenticarUsuario, esAdmin, upload.single('imagen'), validate(productSchema), async (req, res) => {
  try {
    const { nombre, sku, descripcion, precioBase, id_categoria, stockProductosTerminados } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'La imagen es requerida' });
    }

    // 1. Calcular el Hash de la imagen que se intenta subir
    const newFileHash = await getFileHash(req.file.path);
    
    // 2. Buscar si ya existe OTRO producto con esa misma imagen
    const productoExistente = await prisma.productos.findFirst({
      where: { imagehash: newFileHash } // (recuerda que en prisma es minúscula)
    });

    if (productoExistente) {      
      // a) Borramos inmediatamente el archivo que Multer acaba de subir para no dejar basura
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // b) Devolvemos el error al frontend y TERMINAMOS la función
      return res.status(409).json({ 
        error: `Operación rechazada: Esa imagen ya está siendo utilizada por el producto "${productoExistente.nombre}".` 
      });
    }

    // 3. Si llegamos aquí, la imagen es nueva y única. Procedemos a guardar.
    const imagenURL = `/uploads/${req.file.filename}`;

    const nuevoProducto = await prisma.productos.create({
      data: {
        sku,
        nombre,
        descripcion,
        preciobase: parseFloat(precioBase),
        id_categoria: parseInt(id_categoria),
        stockproductosterminados: parseInt(stockProductosTerminados),
        imagenurl: imagenURL,
        imagehash: newFileHash 
      }
    });

    res.status(201).json(nuevoProducto);

  } catch (error) {
    // Limpieza de emergencia si ocurre otro error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    handlePrismaError(res, error, "Error al crear producto");
  }
});

// --- 2. ACTUALIZAR UN PRODUCTO (CORREGIDO) ---
app.put('/api/admin/products/:id', autenticarUsuario, esAdmin, upload.single('imagen'), validate(productSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, nombre, descripcion, precioBase, id_categoria, stockProductosTerminados } = req.body;

    const dataToUpdate = {
      sku,
      nombre,
      descripcion,
      preciobase: parseFloat(precioBase),
      id_categoria: parseInt(id_categoria),
      stockproductosterminados: parseInt(stockProductosTerminados)
    };

    // 🛡️ LÓGICA DE IMAGEN
    if (req.file) {
      // 1. Calcular el Hash de la NUEVA imagen
      const newFileHash = await getFileHash(req.file.path);

      // 2. Buscar si ALGUIEN MÁS (que no sea yo mismo) ya tiene esa imagen
      const duplicado = await prisma.productos.findFirst({
        where: { 
          imagehash: newFileHash,
          id_producto: { not: parseInt(id) } // <--- ¡LA CLAVE! Excluye al producto actual
        }
      });

      if (duplicado) {
        // 🛑 ¡ALTO! Es duplicada.
        // Borramos el archivo temporal que Multer subió
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(409).json({ 
          error: `Operación rechazada: Esa imagen ya pertenece al producto "${duplicado.nombre}".` 
        });
      }

      // 3. Si no es duplicada, procedemos a limpiar la imagen VIEJA del disco
      const productoAnterior = await prisma.productos.findUnique({
        where: { id_producto: parseInt(id) }
      });

      if (productoAnterior && productoAnterior.imagenurl) {
        const rutaVieja = path.join(__dirname, 'public', productoAnterior.imagenurl); // Ajusta según tu estructura
        // Ojo: Asegúrate de que 'public' sea la carpeta correcta. Si usaste 'uploads' directo en multer:
        
        if (fs.existsSync(rutaVieja)) {
          try {
            fs.unlinkSync(rutaVieja);
          } catch (err) {
            console.error("No se pudo borrar la imagen vieja:", err);
          }
        }
      }

      // 4. Actualizamos los datos para la BD
      dataToUpdate.imagenurl = `/uploads/${req.file.filename}`;
      dataToUpdate.imagehash = newFileHash; // <--- ¡IMPORTANTE! Actualizar el hash
    }

    // 5. Guardar cambios en la BD
    const productoActualizado = await prisma.productos.update({
      where: { id_producto: parseInt(id) },
      data: dataToUpdate
    });
    
    res.json(productoActualizado);

  } catch (error) {
    // Limpieza de emergencia
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    handlePrismaError(res, error, "Error al actualizar producto");
  }
});

// 3. ELIMINAR (DESACTIVAR) UN PRODUCTO
app.delete('/api/admin/products/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar el producto antes de borrar
    const producto = await prisma.productos.findUnique({ where: { id_producto: parseInt(id) } });

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    // 2. Desactivar el producto (Soft Delete)
    await prisma.productos.update({
      where: { id_producto: parseInt(id) },
      data: { activo: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE RECETAS (ADMIN) ===============
//=========================================================

// --- 1. OBTENER RECETA DE UN PRODUCTO ---
app.get('/api/admin/products/:id/recipe', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const receta = await prisma.product_ingredients.findMany({
      where: { id_producto: parseInt(id) },
      include: { ingredientes: true } // Incluimos nombres para mostrar en el frontend
    });
    res.json(receta);
  } catch (error) {
    console.error("Error al obtener receta:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. GUARDAR (ACTUALIZAR) RECETA ---
app.post('/api/admin/products/:id/recipe', autenticarUsuario, esAdmin, validate(recipeSchema),  async (req, res) => {
    try {
      const { id } = req.params;
      const { ingredientes } = req.body;

      await prisma.$transaction(async (tx) => {
        await tx.product_ingredients.deleteMany({
          where: { id_producto: parseInt(id) }
        });

        if (ingredientes && ingredientes.length > 0) {
          await tx.product_ingredients.createMany({
            data: ingredientes.map(item => ({
              id_producto: parseInt(id),
              id_ingrediente: parseInt(item.id_ingrediente),
              cantidadrequerida: parseFloat(item.cantidad)
            }))
          });
        }
      });

      res.json({ message: 'Receta actualizada correctamente' });

    } catch (error) {
      handlePrismaError(res, error, "Error al guardar receta");
    }
});


// ============ INGREDIENTES (ADMIN) ===============
//=========================================================
// A. OBTENER TODOS LOS INGREDIENTES
app.get('/api/admin/ingredients', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const ingredientes = await prisma.ingredientes.findMany({
      where: { activo: true },
      // include: { proveedores: true } // Opcional
    });
    res.json(ingredientes);
  } catch (error) {
    console.error("Error al obtener ingredientes:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// B. CREAR UN NUEVO INGREDIENTE
app.post('/api/admin/ingredients', autenticarUsuario, esAdmin, validate(ingredientSchema), async (req, res) => {
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

// C. ACTUALIZAR UN INGREDIENTE
app.put('/api/admin/ingredients/:id', autenticarUsuario, esAdmin, validate(ingredientSchema), async (req, res) => {
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

// D. ELIMINAR (DESACTIVAR) UN INGREDIENTE
app.delete('/api/admin/ingredients/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ingredientes.update({
      where: { id_ingrediente: parseInt(id) },
      data: { activo: false }
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar ingrediente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ============ RUTA DE PRODUCCIÓN (NUEVA) =====
// =============================================
// Convierte Ingredientes -> Productos Terminados

app.post('/api/admin/inventory/produce', autenticarUsuario, esAdmin, async (req, res) => {
  // Recibimos: id_producto, cantidad (a producir), id_opcion_tamano (opcional)
  const { id_producto, cantidad, id_opcion_tamano } = req.body; 

  try {
    const cantidadProducir = parseInt(cantidad);
    if (isNaN(cantidadProducir) || cantidadProducir <= 0) {
      return res.status(400).json({ error: 'La cantidad a producir debe ser mayor a 0.' });
    }
    
    // 1. Obtener la receta
    const receta = await prisma.product_ingredients.findMany({
      where: { id_producto: parseInt(id_producto) },
      include: { ingredientes: true }
    });

    if (receta.length === 0) {
      return res.status(400).json({ error: 'Este producto NO tiene una receta configurada. Ve a "Receta" primero.' });
    }

    // 2. Obtener el Factor del Tamaño
    let factor = 1.0;
    let nombreTamano = "Estándar";

    if (id_opcion_tamano) {
      const opcion = await prisma.attribute_options.findUnique({
        where: { id_opcion: parseInt(id_opcion_tamano) }
      });
      if (opcion) {
        factor = parseFloat(opcion.factor || 1.0); // Aseguramos que tenga un valor
        nombreTamano = opcion.nombreopcion;
      }
    }

    // 3. Transacción de Producción
    await prisma.$transaction(async (tx) => {
      for (const item of receta) {
        const cantidadBase = parseFloat(item.cantidadrequerida);
        
        // Cálculo: (Base x Cantidad x Factor)
        let totalRequerido = cantidadBase * cantidadProducir * factor;
        
        // Redondeo inteligente para piezas
        const unidad = item.ingredientes.unidadmedida.toLowerCase();
        if (['pza', 'pieza', 'unidad', 'unidades'].includes(unidad)) {
            totalRequerido = Math.ceil(totalRequerido);
        }

        const stockActual = parseFloat(item.ingredientes.stockactual);

        // Validación de Stock
        if (stockActual < totalRequerido) {
          throw new Error(`Falta insumo: ${item.ingredientes.nombre}. Requieres ${totalRequerido.toFixed(2)} ${item.ingredientes.unidadmedida}, tienes ${stockActual.toFixed(2)}.`);
        }

        // Descontar Ingrediente
        await tx.ingredientes.update({
          where: { id_ingrediente: item.id_ingrediente },
          data: { stockactual: stockActual - totalRequerido }
        });
      }

      // Aumentar Stock de Producto Terminado
      await tx.productos.update({
        where: { id_producto: parseInt(id_producto) },
        data: { stockproductosterminados: { increment: cantidadProducir } }
      });
    });

    res.json({ message: `¡Éxito! Se produjeron ${cantidadProducir} ${nombreTamano}s.` });

  } catch (error) {
    console.error("Error en producción:", error);
    res.status(400).json({ error: error.message || 'Error al registrar producción' });
  }
});


// ============ RUTAS DE PROVEEDORES (ADMIN) ===============
//==========================================================
// A. OBTENER TODOS LOS PROVEEDORES 
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

// B. CREAR UN NUEVO PROVEEDOR 
app.post('/api/admin/suppliers', 
  autenticarUsuario, 
  esAdmin, 
  validate(supplierSchema), 
  async (req, res) => {
    try {
      const { nombre, contacto, telefono, rfc } = req.body;
      
      const nuevoProveedor = await prisma.proveedores.create({
        data: { nombre, contacto, telefono, rfc }
      });
      res.status(201).json(nuevoProveedor);

    } catch (error) {
      handlePrismaError(res, error, "Error al crear proveedor:");
    }
});

// --- 3. ACTUALIZAR UN PROVEEDOR  ---
app.put('/api/admin/suppliers/:id', 
  autenticarUsuario, 
  esAdmin, 
  validate(supplierSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, contacto, telefono, rfc } = req.body;

      const proveedorActualizado = await prisma.proveedores.update({
        where: { id_proveedor: parseInt(id) },
        data: { nombre, contacto, telefono, rfc }
      });
      res.json(proveedorActualizado);

    } catch (error) {
      // 🛠️ USAMOS LA NUEVA FUNCIÓN AQUÍ
      handlePrismaError(res, error, "Error al actualizar proveedor:");
    }
});

// D. ELIMINAR (DESACTIVAR) UN PROVEEDOR
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

// ==================================================
// =========== RUTAS DE CLIENTES (ADMIN) ===========
// --- 1. OBTENER TODOS LOS CLIENTES ---
app.get('/api/admin/clients', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const clientes = await prisma.clientes.findMany({
      where: {
        activo: true,
        // Opcional: Filtramos para no incluir el cliente "Venta Mostrador" (ID 1)
        id_cliente: { not: 1 } 
      },
      include: {
        // Incluimos los datos del usuario para obtener el correo
        usuarios: {
          select: { correoelectronico: true }
        }
      },
      orderBy: {
        fecharegistro: 'desc'
      }
    });
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 2. CREAR UN NUEVO CLIENTE ---
app.post('/api/admin/clients', autenticarUsuario, esAdmin, validate(clientSchema), async (req, res) => {
  const { nombre, correoelectronico, contrasena, telefono } = req.body;

  try {
    // 1. Buscar el ID del rol 'Cliente'
    const clienteRole = await prisma.roles.findUnique({
      where: { nombrerol: 'Cliente' },
      select: { id_rol: true }
    });
    if (!clienteRole) {
      return res.status(500).json({ error: "Configuración: El rol 'Cliente' no fue encontrado." });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 3. Crear 'usuarios' y 'clientes' en una transacción
    const nuevoCliente = await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuarios.create({
        data: {
          correoelectronico: correoelectronico,
          contrasena: hashedPassword,
          id_rol: clienteRole.id_rol,
        }
      });
      const nuevoCliente = await tx.clientes.create({
        data: {
          id_usuario: nuevoUsuario.id_usuario,
          nombre: nombre,
          telefono: telefono
        }
      });
      return nuevoCliente;
    });
    res.status(201).json(nuevoCliente);

  } catch (error) {
    console.error("Error al crear cliente:", error);
    if (error.code === 'P2002' && error.meta?.target.includes('correoelectronico')) {
      return res.status(409).json({ error: 'Este correo electrónico ya está en uso.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 3. ACTUALIZAR UN CLIENTE ---
app.put('/api/admin/clients/:id', autenticarUsuario, esAdmin, validate(clientSchema), async (req, res) => {
  try {
    const { id: idCliente } = req.params;
    const { nombre, correoelectronico, telefono } = req.body;

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar 'clientes'
      const cliente = await tx.clientes.update({
        where: { id_cliente: parseInt(idCliente) },
        data: {
          nombre: nombre,
          telefono: telefono
        },
        select: { id_usuario: true } 
      });

      // 2. Actualizar 'usuarios'
      await tx.usuarios.update({
        where: { id_usuario: cliente.id_usuario },
        data: { correoelectronico: correoelectronico }
      });
    });

    res.json({ message: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 4. ELIMINAR (DESACTIVAR) UN CLIENTE ---
app.delete('/api/admin/clients/:id', autenticarUsuario, esAdmin, async (req, res) => {
  try {
    const { id: idCliente } = req.params;

    await prisma.$transaction(async (tx) => {
      // 1. Obtener id_usuario
      const cliente = await tx.clientes.findUnique({
        where: { id_cliente: parseInt(idCliente) },
        select: { id_usuario: true }
      });
      if (!cliente) throw new Error('Cliente no encontrado');

      // 2. Desactivar 'clientes'
      await tx.clientes.update({
        where: { id_cliente: parseInt(idCliente) },
        data: { activo: false }
      });

      // 3. Desactivar 'usuarios'
      await tx.usuarios.update({
        where: { id_usuario: cliente.id_usuario },
        data: { activo: false }
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE CAJEROS (ADMIN) ===========
//==================================================
// A. OBTENER TODOS LOS CAJEROS 
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

// B. CREAR UN NUEVO CAJERO 
app.post('/api/admin/cashiers', autenticarUsuario, esAdmin, validate(cashierSchema), async (req, res) => {
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

// C. ACTUALIZAR UN CAJERO
app.put('/api/admin/cashiers/:id', autenticarUsuario, esAdmin, validate(cashierSchema), async (req, res) => {
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

// D. ELIMINAR (DESACTIVAR) UN CAJERO 
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
//==========================================================
// A. OBTENER TODAS LAS REGLAS DE RECOMPENSA 
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

// B. CREAR UNA NUEVA REGLA DE RECOMPENSA 
app.post('/api/admin/rewards', autenticarUsuario, esAdmin, validate(rewardSchema),async (req, res) => {
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

// C. ACTUALIZAR UNA REGLA DE RECOMPENSA 
app.put('/api/admin/rewards/:id', autenticarUsuario, esAdmin, validate(rewardSchema), async (req, res) => {
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

// D. ELIMINAR (DESACTIVAR) UNA REGLA DE RECOMPENSA
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

    // --- 1. KPIs (Tarjetas) ---
    const [ventasMes, pedidosTotales, clientesNuevos, productosActivos] = await Promise.all([
      prisma.pedidos.aggregate({
        _sum: { total: true },
        where: { fechapedido: { gte: inicioDeMes, lte: finDeMes } },
      }),
      prisma.pedidos.count(),
      prisma.clientes.count({
        where: { fecharegistro: { gte: inicioDeMes, lte: finDeMes } },
      }),
      prisma.productos.count({
        where: { activo: true },
      })
    ]);

    // --- 2. Gráfico 1: Top 5 Productos (Barras) ---
    const topProductosRaw = await prisma.detalle_pedido.groupBy({
      by: ['id_producto'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5,
    });
    
    // Obtenemos nombres de productos
    const productoIds = topProductosRaw.map(p => p.id_producto);
    const productosInfo = await prisma.productos.findMany({
      where: { id_producto: { in: productoIds } },
      select: { id_producto: true, nombre: true },
    });

    const productosMasVendidos = topProductosRaw.map(p => {
      const info = productosInfo.find(info => info.id_producto === p.id_producto);
      return {
        nombre: info ? info.nombre : 'Producto Desconocido',
        totalVendido: p._sum.cantidad,
      };
    });

    // --- 3. (REEMPLAZO) Gráfico 2: Ventas por Categoría (Dona) ---
    // Traemos detalles de pedidos completados para calcular categorías
    const detallesCategorias = await prisma.detalle_pedido.findMany({
        where: {
          pedidos: { estado: 'Completado' }
        },
        include: {
          productos: {
            include: { categorias: true } // Relación con categorías
          }
        }
    });

    // Agrupamos y sumamos en JavaScript
    const mapaCategorias = {};
    detallesCategorias.forEach(d => {
        const nombreCat = d.productos.categorias?.nombrecategoria || 'Otros';
        if (!mapaCategorias[nombreCat]) {
          mapaCategorias[nombreCat] = 0;
        }
        mapaCategorias[nombreCat] += d.cantidad;
    });

    // Convertimos a array para el frontend
    const ventasPorCategoria = Object.keys(mapaCategorias).map(key => ({
        categoria: key,
        cantidad: mapaCategorias[key]
    }));

    // --- 4. Gráfico 3: Tamaños Más Vendidos (Pastel) ---
    const tamanosMasVendidos = await prisma.$queryRaw`
      SELECT 
        (personalizacion->>'Tamaño') as "tamano", 
        SUM(cantidad) as "totalVendido"
      FROM detalle_pedido
      WHERE personalizacion->>'Tamaño' IS NOT NULL
      GROUP BY "tamano"
      ORDER BY "totalVendido" DESC;
    `;

    // --- 5. Gráfico 4: Ventas por Cajero (Barras) ---
    const ventasPorCajero = await prisma.$queryRaw`
      SELECT 
        e.nombrecompleto,
        COUNT(p.id_pedido) as "totalVentas"
      FROM pedidos p
      JOIN empleados e ON p.id_empleado = e.id_empleado
      WHERE p.id_empleado IS NOT NULL
      GROUP BY e.nombrecompleto
      ORDER BY "totalVentas" DESC;
    `;

    // --- 6. Enviar todos los datos juntos ---
    res.json({
      ventasDelMes: ventasMes._sum.total || 0,
      pedidosTotales: pedidosTotales || 0,
      clientesNuevos: clientesNuevos || 0,
      productosActivos: productosActivos || 0,
      
      productosMasVendidos: productosMasVendidos,
      ventasPorCategoria: ventasPorCategoria, // <--- Dato nuevo enviado correctamente
      
      tamanosMasVendidos: tamanosMasVendidos.map(t => ({ ...t, totalVendido: Number(t.totalVendido) })),
      ventasPorCajero: ventasPorCajero.map(v => ({ ...v, totalVentas: Number(v.totalVentas) })),
    });

  } catch (error) {
    console.error("Error al generar dashboard:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ RUTA DE CORTE DE CAJA ==========
// =============================================
// (Accesible por Admin y Cajero)

app.get('/api/admin/corte-caja', autenticarUsuario, esPersonalAutorizado(['Administrador', 'Cajero']), async (req, res) => {
  try {
    const fechaQuery = req.query.fecha || new Date().toISOString();
    const fecha = parseISO(fechaQuery);
    const inicioDelDia = startOfDay(fecha);
    const finDelDia = endOfDay(fecha);

    // 1. Ejecutar consultas
    // CONSULTA A: Dinero real en caja (Ventas Netas)
    // Esta consulta considera los descuentos globales del pedido porque suma el 'total' final.
    const ventasPorMetodo = await prisma.pedidos.groupBy({
      by: ['metodo_pago'],
      _sum: { total: true },
      where: {
        estado: 'Completado',
        fechapedido: { gte: inicioDelDia, lte: finDelDia },
      },
    });

    // CONSULTA B: Detalle de productos vendidos
    // Usamos findMany para obtener cada línea de venta y calcular con precisión
    const detallesVentas = await prisma.detalle_pedido.findMany({
      where: {
        pedidos: {
          estado: 'Completado',
          fechapedido: { gte: inicioDelDia, lte: finDelDia },
        }
      },
      include: {
        productos: { select: { nombre: true } } // Traemos el nombre directamente
      }
    });

    // Procesamiento en JS para agrupar por producto correctamente
    const mapaProductos = {};

    detallesVentas.forEach(detalle => {
      const id = detalle.id_producto;
      const totalLinea = detalle.cantidad * parseFloat(detalle.preciounitario);

      if (!mapaProductos[id]) {
        mapaProductos[id] = {
          id: id,
          nombre: detalle.productos?.nombre || 'Producto Eliminado',
          cantidad: 0,
          total: 0
        };
      }

      mapaProductos[id].cantidad += detalle.cantidad;
      mapaProductos[id].total += totalLinea;
    });

    // Convertimos el objeto a array
    const productosVendidos = Object.values(mapaProductos);

    // CONSULTA C: Inventario (Sin cambios)
    const inventarioActual = await prisma.ingredientes.findMany({
      where: { activo: true },
      select: {
        nombre: true,
        stockactual: true,
        stockminimo: true,
        unidadmedida: true,
      },
      orderBy: { stockactual: 'asc' },
    });

    res.json({
      ventasPorMetodo,
      productosVendidos,
      inventarioActual
    });

  } catch (error) {
    console.error("Error al generar corte de caja:", error);
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