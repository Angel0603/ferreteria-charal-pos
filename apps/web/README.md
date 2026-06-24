# 🔧 Ferretería POS

> Sistema de punto de venta y gestión empresarial para ferreterías con múltiples sucursales.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## ✨ Características

### 🛒 Punto de Venta (POS)
- Búsqueda de productos por nombre, SKU o código de barras
- Escáner de cámara para códigos de barras
- Productos varios (sin registro previo, para revisión posterior)
- Descuentos por venta
- Métodos de pago: efectivo, tarjeta, transferencia, mixto y **crédito**
- Cálculo de cambio automático con sugerencias de billetes
- Ticket térmico (80mm) e impresión en hoja carta con vista previa escalada
- Atajos de teclado para operación rápida (F2, F4, F6, F8, F10)

### 📦 Inventario
- Stock en tiempo real por sucursal
- Entradas de mercancía con costo unitario y alertas de stock bajo
- Traspasos entre sucursales
- Ajuste manual de inventario con motivo y registro de diferencias
- Historial de movimientos paginado con filtro por tipo

### 💳 Sistema de Crédito
- Ventas a crédito con validación de límite por cliente
- Registro de abonos con método de pago (efectivo, tarjeta, transferencia)
- Historial de crédito por cliente: cargos y abonos con saldo progresivo
- Acceso rápido a abono desde el buscador de clientes en el POS

### 🗂️ Catálogo de Productos
- Gestión de productos con imagen, SKU, código de barras y categoría
- Precios de venta al público y mayoreo
- Stock mínimo configurable con alertas automáticas
- Activar/desactivar productos (inactivos excluidos del POS automáticamente)
- Creación de categorías sin salir del formulario de producto

### 👥 Clientes y Proveedores
- Directorio con límite de crédito y saldo pendiente
- Historial de movimientos de crédito por cliente
- Switch de activo/inactivo consistente con el resto del sistema
- Búsqueda con debounce para no saturar la base de datos

### 👤 Usuarios y Roles
- Tres roles: **Administrador**, **Cajero** y **Almacén**
- Acceso diferenciado por sucursal
- Protección de auto-desactivación del propio usuario

### 📊 Reportes
- Ventas por día, por cajero y comparativa entre sucursales
- Productos más vendidos en el período
- KPIs del período: total vendido, tickets emitidos y ticket promedio
- Filtro por sucursal y período (7, 30 o 90 días)

### 🎨 Diseño
- Modo oscuro y claro con paleta **ámbar/óxido**
- Toggle manual persistido entre sesiones
- Tipografía Inter + JetBrains Mono para precios, folios y códigos
- Dropdowns animados, switches, paginación y scrollbar personalizada
- Skeleton loaders diferenciados entre carga inicial y búsquedas

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 · TailwindCSS 4 · Lucide Icons |
| Lenguaje | TypeScript |
| Backend | Supabase (PostgreSQL · Auth · Storage · RLS) |
| Monorepo | pnpm workspaces |
| Despliegue | Vercel + GitHub (CI/CD) |

---

## 📁 Estructura del proyecto

```
ferreteria-pos/
├── apps/
│   └── web/                  # Aplicación Next.js
│       ├── src/
│       │   ├── app/          # Rutas (App Router)
│       │   ├── components/   # Componentes por módulo
│       │   └── lib/          # Hooks, contextos y utilidades
│       └── .env.local        # Variables de entorno (no incluido)
└── packages/
    └── types/                # Tipos generados de Supabase
```

---

## 🚀 Instalación local

### Requisitos
- Node.js 20+
- pnpm 9+
- Cuenta en [Supabase](https://supabase.com)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ferreteria-pos.git
cd ferreteria-pos

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Iniciar el servidor de desarrollo
pnpm --filter web dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

---

## 🌿 Flujo de trabajo con Git

Este proyecto usa un flujo de ramas protegidas:

- `main` → **Producción** (protegida, solo acepta Pull Requests)
- `develop` → **Desarrollo** (rama de trabajo diaria)

```bash
# Trabajar siempre en develop
git checkout develop

# Al terminar una funcionalidad
git add .
git commit -m "feat: descripción del cambio"
git push origin develop

# Vercel genera un preview URL automáticamente
# Si todo funciona, abrir un Pull Request develop → main
# Al mergear, Vercel despliega a producción automáticamente
```

---

## 📄 Licencia

Uso privado. Todos los derechos reservados.