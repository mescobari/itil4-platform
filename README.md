# ITIL 4 Funnel

Embudo de ventas para el libro digital **"ITIL 4 Foundation: Guía Completa de Certificación"**. Incluye página de ventas, checkout con PayPal, entrega de descarga por token y página de upsell.

---

## Tecnologías

### Frontend

| Herramienta                                                  | Versión | Rol                      |
| ------------------------------------------------------------ | ------- | ------------------------ |
| [Vite](https://vite.dev)                                     | v8      | Build tool / dev server  |
| [React](https://react.dev)                                   | v19     | UI library               |
| TypeScript                                                   | v5.9    | Tipado estático          |
| [Tailwind CSS](https://tailwindcss.com)                      | v4      | Estilos utilitarios      |
| [React Router DOM](https://reactrouter.com)                  | v7      | Ruteo cliente            |
| [Lucide React](https://lucide.dev)                           | latest  | Iconos                   |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | latest  | Animación de confeti     |
| clsx + tailwind-merge                                        | latest  | Utilidades de clases CSS |

### Backend (`/server`)

| Herramienta        | Rol                                           |
| ------------------ | --------------------------------------------- |
| Node.js + Express  | API REST                                      |
| Helmet             | Headers de seguridad HTTP                     |
| express-rate-limit | Rate limiting por ruta                        |
| cors               | Control de origen cruzado                     |
| Nodemailer         | Envío de emails de entrega                    |
| PayPal REST API    | Procesamiento de pagos                        |
| uuid               | Generación de tokens de descarga              |
| JSON flat-files    | Persistencia de datos (leads, orders, tokens) |

---

## Estructura del proyecto

```
itil4-funnel/
├── public/
│   └── images/          # Imágenes estáticas (portada, etc.)
├── server/              # Backend Express independiente
│   ├── assets/          # PDFs (no expuestos directamente)
│   ├── data/            # JSON de leads, orders, tokens, email log
│   └── src/
│       ├── index.js     # Entry point del servidor
│       ├── db.js        # Inicialización de base de datos JSON
│       ├── routes/
│       │   ├── leads.js     # POST /api/leads
│       │   ├── paypal.js    # POST /api/paypal/create-order, capture
│       │   └── download.js  # GET /api/download/:token
│       └── utils/
│           ├── email.js  # Servicio de email (Nodemailer)
│           └── token.js  # Generación y validación de tokens
├── src/
│   ├── hooks/
│   │   ├── useCountdown.ts   # Temporizador persistente en localStorage
│   │   └── useTypewriter.ts  # Efecto máquina de escribir
│   ├── lib/
│   │   ├── api.ts    # Cliente HTTP hacia el backend
│   │   └── utils.ts  # Utilidades (cn, etc.)
│   ├── pages/        # Ver tabla de páginas abajo
│   ├── App.tsx       # Definición de rutas del funnel
│   ├── index.css     # Tailwind + animaciones ITIL
│   └── main.tsx      # Entry point de React
├── .env.local         # Variables de entorno del frontend
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
└── vite.config.ts
```

---

## Páginas y rutas

| Ruta                | Componente       | Descripción                                                       |
| ------------------- | ---------------- | ----------------------------------------------------------------- |
| `/`                 | → redirect       | Redirige automáticamente a `/itil4`                               |
| `/#/itil4`          | `ITIL4SalesPage` | Página de ventas principal (hero, beneficios, FAQ, CTA con modal) |
| `/#/libro-itil`     | `ITIL4SalesPage` | Alias alternativo de la página de ventas                          |
| `/#/ventas`         | `SalesPage`      | Página de ventas simplificada estilo long-form                    |
| `/#/checkout`       | `CheckoutPage`   | Formulario de datos + botones PayPal (libro o upsell)             |
| `/#/entrega/:token` | `DeliveryPage`   | Entrega del archivo PDF validada por token único                  |
| `/#/upsell`         | `UpsellPage`     | Oferta de audiobook post-compra con PayPal                        |
| `/#/gracias`        | `ThankYouPage`   | Confirmación de compra con confeti y enlace de descarga           |

> El router usa `HashRouter`, por lo que todas las rutas llevan prefijo `#`.

---

## Variables de entorno

### Frontend — `.env.local`

```env
VITE_API_URL=http://localhost:3001
VITE_PAYPAL_CLIENT_ID=sb
```

### Backend — `server/.env`

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox              # sandbox | live
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_password
EMAIL_FROM="ITIL4 Certification <no-reply@example.com>"
```

---

## Instalación y uso

### Requisitos

- Node.js ≥ 18
- npm ≥ 9

### 1. Instalar dependencias del frontend

```bash
cd itil4-funnel
npm install
```

### 2. Instalar dependencias del backend

```bash
cd server
npm install
```

### 3. Configurar variables de entorno

Copiar y completar los archivos `.env`:

```bash
# Frontend
cp .env.local.example .env.local   # o editar .env.local directamente

# Backend
cp server/.env.example server/.env
```

### 4. Colocar el PDF en el servidor

Guardar el archivo PDF dentro de `server/assets/`. El nombre debe coincidir con el configurado en `server/src/routes/download.js`.

### 5. Arrancar en desarrollo

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — backend
cd server && npm run dev
```

Frontend disponible en: `http://localhost:5173`  
Backend disponible en: `http://localhost:3001`

### 6. Build de producción

```bash
npm run build      # genera dist/
npm run preview    # previsualiza el build
```

---

## API del backend

| Método | Endpoint                    | Descripción                                  |
| ------ | --------------------------- | -------------------------------------------- |
| `POST` | `/api/leads`                | Registra un lead (nombre + email)            |
| `GET`  | `/api/leads/count`          | Retorna el total de leads registrados        |
| `POST` | `/api/paypal/create-order`  | Crea una orden PayPal                        |
| `POST` | `/api/paypal/capture-order` | Captura el pago y genera token de descarga   |
| `GET`  | `/api/download/:token`      | Valida el token y retorna la URL de descarga |

---

## Animaciones CSS personalizadas

Definidas en `src/index.css`, disponibles como clases de utilidad:

| Clase                 | Efecto                                    |
| --------------------- | ----------------------------------------- |
| `.itil-float`         | Flotación suave de 4s (portada del libro) |
| `.itil-float-delayed` | Flotación con traslación diagonal de 5s   |
| `.itil-float-slow`    | Flotación lenta de 6s                     |
| `.itil-pulse`         | Pulso de sombra naranja en botones CTA    |
| `.itil-btn-primary`   | Estilo base del botón naranja con hover   |
| `.itil4-page`         | Fade-in de entrada de página (0.6s)       |
| `.tabular-nums`       | Números tabulares para el countdown       |

---

## Seguridad

- Headers HTTP seguros con **Helmet**
- Rate limiting: 100 req/15 min en rutas generales, 10 req/hora en pagos
- Los PDFs **nunca se exponen directamente** — solo se sirven via token validado de un solo uso
- CORS configurado explícitamente por origen
- Variables sensibles en `.env` (nunca en el repositorio)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
