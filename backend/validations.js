import { z } from 'zod';

// 1. Reglas de Contraseña Robusta
const passwordRules = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(100, "La contraseña es demasiado larga")
  .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
  .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
  .regex(/[0-9]/, "La contraseña debe contener al menos un número")
  .regex(/[\W_]/, "La contraseña debe contener al menos un carácter especial (!@#$%)");

// 2. Reglas de Teléfono (10 dígitos exactos)
const phoneRules = z.string()
  .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 dígitos numéricos");

// 3. Reglas de Nombre
const nameRules = z.string()
  .min(3, "El nombre debe tener al menos 3 caracteres")
  .max(100, "El nombre no puede exceder los 100 caracteres")
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios");


// ==========================================
// ============ ESQUEMAS DEFINIDOS ==========
// ==========================================

// --- 1. ESQUEMA PARA REGISTRO DE USUARIO (PÚBLICO) ---
export const registerSchema = z.object({
  nombre: nameRules,
  telefono: phoneRules,
  correo: z.string().email("El formato del correo electrónico no es válido").max(100),
  contrasena: passwordRules
});

// --- 2. ESQUEMA PARA GESTIÓN DE CLIENTES (ADMIN) ---
export const clientSchema = z.object({
  nombre: nameRules,
  telefono: phoneRules,
  correoelectronico: z.string().email("El formato del correo no es válido").max(100),
  
  // En edición (Admin), la contraseña puede venir vacía si no se cambia.
  // Si trae algo, debe cumplir las reglas.
  contrasena: passwordRules.optional().or(z.literal('')), 
});

// --- 3. ESQUEMA PARA PRODUCTOS ---
export const productSchema = z.object({
  sku: z.string().trim().min(3).max(5).regex(/^[0-9A-Z]+$/, "El SKU solo puede tener números y letras mayúsculas, con mínimo 3 y máximo 5 caracteres"),
  nombre: nameRules,
  descripcion: z.string().optional().or(z.literal('')),
    precioBase: z.coerce.number().positive("El precio debe ser mayor a 0"),
  id_categoria: z.coerce.number().int().positive(),
  stockProductosTerminados: z.coerce.number().int().min(0, "El stock no puede ser negativo") 
});

// --- 4. ESQUEMA PARA INGREDIENTES ---
export const ingredientSchema = z.object({
  sku: z.string().min(3).max(50),
  nombre: z.string().min(3).max(100),
  stockactual: z.coerce.number().min(0),
  stockminimo: z.coerce.number().min(0),
  unidadmedida: z.string().min(1).max(20),
  id_proveedor: z.coerce.number().int().positive().optional().or(z.literal(''))
});

// --- 5. ESQUEMA PARA PROVEEDORES ---
export const supplierSchema = z.object({
  nombre: z.string().min(3).max(100),
  contacto: z.string().max(100).optional().or(z.literal('')),
  telefono: phoneRules.optional().or(z.literal('')),
  rfc: z.string()
    .trim() 
    .length(13, "El RFC debe tener exactamente 13 caracteres")
    .regex(/^[A-Z0-9Ñ]+$/, "El RFC solo puede contener letras mayúsculas y números (sin espacios)")
    .optional()
    .or(z.literal(''))
});

// --- 6. ESQUEMA PARA CAJEROS ---
export const cashierSchema = z.object({
  nombrecompleto: nameRules,
  correoelectronico: z.string().email(),
  contrasena: passwordRules.optional().or(z.literal('')),
  turno: z.enum(['Matutino', 'Vespertino', 'Nocturno'])
});

// --- 7. ESQUEMA PARA RECETAS ---
export const recipeSchema = z.object({
  ingredientes: z.array(
    z.object({
      id_ingrediente: z.coerce.number().int().positive("ID de ingrediente inválido"),
      cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0")
    })
  ).nonempty("La receta debe tener al menos un ingrediente")
});

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // 🛠️ EXTRACCIÓN SEGURA DEL MENSAJE
      // Usamos .issues que es la propiedad nativa de Zod
      const errorMessages = result.error.issues.map(issue => {
        return `${issue.message}`; // Solo devolvemos el mensaje amigable
      }).join('. ');
      
      // Enviamos el error 400 al frontend
      return res.status(400).json({ error: errorMessages });
    }

    req.body = result.data; 
    next();
  } catch (error) {
    console.error("CRASH EN VALIDACIÓN:", error);
    return res.status(500).json({ error: 'Error interno al validar datos' });
  }
};