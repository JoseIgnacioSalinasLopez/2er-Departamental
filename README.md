MotoStore - Tienda Online de Motocicletas
📋 Descripción del Proyecto
MotoStore es una aplicación web de comercio electrónico desarrollada con React + Vite y Supabase, especializada en la venta de motocicletas. El proyecto implementa autenticación de usuarios, gestión de productos, carrito de compras persistente, sistema de pedidos con pagos simulados y panel de administración completo con seguridad a nivel de fila (RLS).


 Características Principales
 Para Usuarios Públicos (Modo Invitado)

 Navegación del catálogo sin necesidad de registro
 Búsqueda en tiempo real de productos
 Filtrado múltiple por categorías
 Vista detallada de productos (nombre, precio, stock, imágenes)
 Interfaz responsive y accesible (WCAG AA)

 Para Usuarios Autenticados

 Registro: Email/contraseña con verificación por correo electrónico
 Inicio de sesión: Seguro con JWT tokens
 Carrito persistente: Agregar, actualizar cantidad y eliminar productos
 Validación de stock: Previene agregar más productos de los disponibles
 Checkout completo: Proceso de pago simulado
 Direcciones de envío: Gestión de múltiples direcciones
 Historial de pedidos: Consulta de pedidos anteriores con detalles
 Perfil de usuario: Actualización de datos personales

 Para Administradores

 CRUD de Productos: Crear, leer, actualizar y eliminar productos
 CRUD de Categorías: Gestión completa de categorías
 Control de inventario: Actualización de stock en tiempo real
 Activar/Desactivar: Control de visibilidad de productos y categorías
 Panel dedicado: Interfaz administrativa completa
 Gestión de usuarios: Visualización de perfiles (futuro)


 Arquitectura del Sistema
Stack Tecnológico
Frontend

 React 18 - Biblioteca de UI
 Vite - Build tool y dev server
 CSS Inline - Estilos en línea para simplicidad
 React Router DOM v6 - Navegación SPA
 React Hooks - Gestión de estado (useState, useEffect, useCallback)

Backend

 Supabase - Backend as a Service

 PostgreSQL Database
 Supabase Auth (JWT)
 Row Level Security (RLS)
 Storage (para imágenes)




 Estructura del Proyecto
react-supabase-auth-crud/
│
├── public/
│   ├── assets/
│   │   ├── fondo1.gif          # Fondo animado login
│   │   ├── fondo2.gif          # Fondo animado catálogo
│   │   └── fondo3.gif          # Fondo animado checkout
│   ├── favicon.ico
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── pages/
│   │   ├── Login.js            # Autenticación y registro
│   │   ├── Catalogo.js         # Listado de productos
│   │   ├── Carrito.js          # Carrito de compras
│   │   ├── Checkout.js         # Proceso de checkout
│   │   ├── Pago.js             # Formulario de pago simulado
│   │   └── Admin.js            # Panel administrativo
│   │
│   ├── supabase/
│   │   └── client.js           # Configuración de Supabase
│   │
│   ├── App.js                  # Rutas y protección
│   ├── App.css                 # Estilos globales
│   ├── index.js                # Entry point
│   └── index.css               # Estilos base
│
├── .env.example                # Variables de entorno ejemplo
├── .gitignore
├── package.json
├── vite.config.js
└── README.md                   # Este archivo
```

---
Descripción de Tablas
1. perfiles (Tabla principal de usuarios)
sql- id (UUID, PK) → Referencia a auth.users
- nombre_completo (TEXT, NOT NULL)
- rol (TEXT, DEFAULT 'user') → 'admin' o 'user'
- creado_en (TIMESTAMPTZ)
2. direcciones_envio
sql- id (UUID, PK)
- usuario_id (UUID, FK → perfiles)
- linea_direccion_1 (TEXT, NOT NULL)
- linea_direccion_2 (TEXT)
- ciudad (TEXT, NOT NULL)
- estado (TEXT)
- codigo_postal (TEXT, NOT NULL)
- pais (TEXT, NOT NULL)
- es_predeterminada (BOOLEAN)
3. categorias
sql- id (UUID, PK)
- nombre (TEXT, UNIQUE, NOT NULL)
- descripcion (TEXT)
- esta_activa (BOOLEAN, DEFAULT TRUE)
4. productos
sql- id (UUID, PK)
- categoria_id (UUID, FK → categorias)
- nombre (TEXT, NOT NULL)
- descripcion (TEXT)
- precio (NUMERIC(10,2), NOT NULL, CHECK >= 0)
- stock (INTEGER, NOT NULL, CHECK >= 0)
- url_imagen (TEXT)
- esta_activo (BOOLEAN, DEFAULT TRUE)
5. carritos
sql- usuario_id (UUID, PK/FK → perfiles)
- creado_en (TIMESTAMPTZ)
- actualizado_en (TIMESTAMPTZ)
6. items_carrito
sql- id (UUID, PK)
- carrito_id (UUID, FK → carritos.usuario_id)
- producto_id (UUID, FK → productos)
- cantidad (INTEGER, CHECK > 0)
- UNIQUE (carrito_id, producto_id)
7. pagos
sql- id (UUID, PK)
- usuario_id (UUID, FK → auth.users)
- total (NUMERIC(10,2), NOT NULL)
- moneda (TEXT, DEFAULT 'MXN')
- tipo_tarjeta (TEXT) → 'Crédito' o 'Débito'
- ultimos_4_digitos (TEXT)
- nombre_titular (TEXT)
- estado (TEXT) → 'pendiente', 'completado', 'fallido'
- fecha_pago (TIMESTAMPTZ)
8. pedidos
sql- id (UUID, PK)
- pago_id (UUID, FK → pagos)
- usuario_id (UUID, FK → perfiles)
- direccion_envio_id (UUID, FK → direcciones_envio)
- estado (TEXT) → 'pendiente', 'confirmado', 'enviado', 'entregado'
- numero_rastreo (TEXT)
- numero_pedido (TEXT, UNIQUE)
- fecha_pedido (TIMESTAMPTZ)
9. items_pedido
sql- id (UUID, PK)
- pedido_id (UUID, FK → pedidos)
- producto_id (UUID, FK → productos)
- cantidad (INTEGER, CHECK > 0)
- precio_unitario (NUMERIC(10,2)) → Precio congelado
- subtotal (NUMERIC(10,2))
- nombre_producto (TEXT) → Snapshot

 Políticas de Seguridad (RLS)
Principios de Seguridad Implementados

 RLS habilitado en todas las tablas
 Autenticación JWT mediante auth.uid()
 Separación de roles: admin vs user
 Principio de mínimo privilegio

Políticas por Tabla
perfiles
sql-- Los usuarios ven/editan SOLO su propio perfil
CREATE POLICY "Usuarios ven su perfil"
ON perfiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan su perfil"
ON perfiles FOR UPDATE
USING (auth.uid() = id);

-- Los admins ven TODO
CREATE POLICY "Admin acceso total"
ON perfiles FOR ALL
USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
);
productos y categorias
sql-- Público ve solo productos/categorías ACTIVOS
CREATE POLICY "Solo productos activos visibles"
ON productos FOR SELECT
USING (
  esta_activo = TRUE 
  OR 
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
);

-- Solo ADMINS pueden modificar
CREATE POLICY "Admin gestiona productos"
ON productos FOR ALL
USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
);
carritos e items_carrito
sql-- Usuario gestiona SOLO su carrito
CREATE POLICY "Usuario gestiona su carrito"
ON carritos FOR ALL
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario gestiona sus items del carrito"
ON items_carrito FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM carritos c
    WHERE c.usuario_id = auth.uid() 
    AND c.usuario_id = carrito_id
  )
);
pedidos y pagos
sql-- Usuario ve SOLO sus pedidos
CREATE POLICY "Usuario ve sus pedidos"
ON pedidos FOR SELECT
USING (auth.uid() = usuario_id);

-- Admins ven TODOS los pedidos
CREATE POLICY "Admin ve todos"
ON pedidos FOR SELECT
USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
);

-- Usuario ve SOLO sus pagos
CREATE POLICY "Usuarios ven sus pagos"
ON pagos FOR SELECT
USING (auth.uid() = usuario_id);
direcciones_envio
sqlCREATE POLICY "Usuario gestiona sus direcciones"
ON direcciones_envio FOR ALL
USING (auth.uid() = usuario_id);

⚙️ Configuración e Instalación
Prerrequisitos

 Node.js 16+ y npm
 Cuenta en Supabase
 Git

1. Clonar el Repositorio
bashgit clone https://github.com/tu-usuario/motostore.git
cd motostore
2. Instalar Dependencias
bashnpm install
3. Configurar Variables de Entorno
Crea un archivo .env en la raíz:
envVITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
4. Configurar Supabase
A. Crear Proyecto en Supabase

Ve a supabase.com
Crea un nuevo proyecto
Copia la URL y la ANON KEY

B. Ejecutar Scripts SQL
En el SQL Editor de Supabase, ejecuta el siguiente script completo (disponible en /sql/schema.sql del proyecto):
sql-- Ver archivo completo en el documento proporcionado
-- Incluye:
-- - Creación de todas las tablas
-- - Habilitación de RLS
-- - Creación de políticas
-- - Trigger para crear perfil automáticamente
-- - Datos de prueba (categorías y productos)
C. Configurar Storage (Opcional)
Si quieres usar imágenes propias:

Ve a Storage en Supabase
Crea un bucket llamado Imagenes_Motos
Hazlo público
Sube tus imágenes

5. Crear Usuario Administrador
Después de registrar un usuario, ejecuta en SQL Editor:
sqlUPDATE public.perfiles 
SET rol = 'admin' 
WHERE id = 'uuid-del-usuario';

Decisiones Técnicas Clave
1. Modo Invitado
Problema: Los usuarios no querían registrarse solo para ver productos.
Solución: Implementamos un modo invitado que almacena estado en localStorage:
javascript// En Login.js
localStorage.setItem('modoInvitado', 'true')

// En Catalogo.js
const modoInvitado = localStorage.getItem('modoInvitado') === 'true'
2. Estructura de Carrito
Decisión: El carrito_id es igual al usuario_id para simplicidad.
Ventaja: No hay necesidad de consultas adicionales para obtener el carrito.
javascript// Directo
await supabase
  .from('items_carrito')
  .select('*')
  .eq('carrito_id', usuario.id)
3. Precio Congelado en Pedidos
Problema: Si el precio del producto cambia, los pedidos históricos se afectan.
Solución: Guardamos precio_al_momento en items_pedido:
sqlprecio_unitario DECIMAL(10,2) NOT NULL, -- Precio fijo
4. Gestión de Estado

Local: useState y useEffect
Sin Redux: Scope pequeño no lo justifica
Callbacks: Optimización con useCallback

javascriptconst cargarCantidadCarrito = useCallback(async (userId) => {
  // ...
}, [supabase])
5. Validación de Stock
Client-side:
javascriptif (itemExistente.cantidad >= producto.stock) {
  alert(`Solo hay ${producto.stock} unidades disponibles`)
  return
}
