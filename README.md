# Sistema de Jueces

Sistema de gestión y administración para el sistema judicial.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15+ con App Router
- **Backend**: Supabase (Authentication & Database)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Temas**: next-themes (modo claro/oscuro)

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- npm, yarn o pnpm

## ⚙️ Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/JhonMG07/softwaresegurosistemadejueces.git
cd softwaresegurosistemadejueces
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Renombrar `.env.example` a `.env.local` y actualizar con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Las credenciales se encuentran en: [Dashboard de Supabase > Settings > API](https://supabase.com/dashboard/project/_/settings/api)

4. **Ejecutar el servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
├── app/                      # Rutas de Next.js (App Router)
│   ├── auth/                 # Páginas de autenticación
│   ├── protected/            # Páginas protegidas
│   └── page.tsx              # Página principal
├── components/               # Componentes React
│   ├── ui/                   # Componentes UI (shadcn)
│   └── ...                   # Componentes de la aplicación
├── lib/                      # Utilidades y configuración
│   ├── supabase/             # Clientes de Supabase
│   └── utils.ts              # Funciones utilitarias
└── public/                   # Archivos estáticos
```

## 🔐 Autenticación

El proyecto incluye un sistema completo de autenticación:

- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Recuperación de contraseña
- ✅ Actualización de contraseña
- ✅ Protección de rutas

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta el linter (ESLint) |

## 🎨 Personalización de UI

Este proyecto usa **shadcn/ui**. Para agregar componentes:

```bash
npx shadcn@latest add [component-name]
```

Ejemplo:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

## 🌐 Deployment

### Vercel (Recomendado)

1. Push tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura las variables de entorno
4. Deploy automático

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📝 Licencia

Este proyecto es de uso privado.

## 👥 Autor

JhonMG07