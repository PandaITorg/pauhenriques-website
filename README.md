# ✨ Pau Henriques - E-commerce de Vida Natural

Este proyecto es el frontend para el sitio de e-commerce de Pau Henriques, una marca dedicada a promover un estilo de vida saludable y libre de tóxicos a través de productos naturales y cuidadosamente seleccionados.

El sitio está construido con tecnologías web modernas y se conecta a Shopify para toda la gestión de productos, carritos y pagos.

## 🎨 Paleta de Colores: Bosque Natural

Para evocar una sensación de naturaleza, bienestar y confianza, se ha seleccionado una paleta de colores inspirada en un bosque:

- **Verde Profundo (Principal):** `#2F4F4F` - Para títulos, botones principales y acentos.
- **Verde Musgo (Secundario):** `#556B2F` - Para elementos secundarios y fondos sutiles.
- **Tierra (Acentos):** `#8B4513` - Para toques cálidos y llamados a la acción específicos.
- **Beige Claro (Fondo):** `#F5F5DC` - Para los fondos principales, asegurando legibilidad y una sensación de calma.
- **Blanco Hueso (Texto):** `#FFFAF0` - Para el texto sobre fondos oscuros.

## 🚀 Stack Tecnológico

- **Framework Frontend:** [React](https://react.dev/)
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router](https://reactrouter.com/)
- **Backend & E-commerce:** [Shopify Storefront API (GraphQL)](https://shopify.dev/docs/api/storefront)

## 🛠️ Cómo Empezar

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local.

### **1. Prerrequisitos**

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (generalmente viene con Node.js)

### **2. Instalación**

Clona el repositorio e instala las dependencias:

```bash
git clone <URL-DEL-REPOSITORIO>
cd pauhenriques-website
npm install
```

### **3. Variables de Entorno**

Para conectar el sitio con Shopify, necesitarás crear un archivo `.env` en la raíz del proyecto. Puedes copiar el ejemplo de abajo:

```env
# .env

# URL del endpoint de la API de GraphQL de tu tienda Shopify
VITE_SHOPIFY_STOREFRONT_API_URL="https://TU_TIENDA.myshopify.com/api/2023-10/graphql.json"

# Token de acceso público de la Storefront API
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN="TU_TOKEN_DE_ACCESO"
```

> **Importante:** Pide estos valores al administrador de la tienda de Shopify.

### **4. Ejecutar el Servidor de Desarrollo**

Una vez instaladas las dependencias y configuradas las variables de entorno, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

El sitio estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Hot-Module Replacement.
- `npm run build`: Compila y empaqueta la aplicación para producción en la carpeta `dist/`.
- `npm run lint`: Ejecuta el linter (ESLint) para analizar el código en busca de errores y problemas de estilo.
- `npm run preview`: Levanta un servidor local para previsualizar el build de producción.