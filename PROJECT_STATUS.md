# Khael Tarotista - Estado del Proyecto (MVP funcional Diario + Relecturas + sesión multiusuario)

## Stack actual
- Next.js App Router (v16)
- Prisma ORM v7 con cliente generado en `src/generated/prisma`
- PostgreSQL (Supabase)
- Prisma adapter PG en servidor (`@prisma/adapter-pg`)

## Reglas respetadas en esta iteración
- No rediseño de UI global.
- No cambios en estilos globales.
- No se volvió a localStorage como fuente principal.
- Se mantiene Prisma v7 + cliente generado + `lib/prisma.ts`.

## Implementado hoy

### 1) Autenticación real mínima (multiusuario)
- Se reemplazó la sesión temporal única por cookie de sesión por usuario.
- Login ahora valida contra tabla `User` en PostgreSQL.
- Logout funcional mantiene limpieza de cookie.
- Middleware protege rutas/API con sesión válida.
- Helper server-side para resolver usuario actual desde cookie + DB:
  - `lib/auth-server.ts`

Detalles:
- Cookie: `codexkhael_session`
- Payload de sesión: `userId` + `email` (formato querystring en cookie)
- Validación server-side en cada endpoint: usuario activo y coincidencia cookie/DB

### 2) Registro mínimo de usuarios (para flujo crear usuario/login)
- Nuevo endpoint:
  - `POST /api/auth/register`
- Crea usuario `ACTIVE` en `User`.
- Asigna rol `STUDENT` si existe.
- Crea suscripción `FREE` si existe plan.

Nota de seguridad actual:
- `passwordHash` sigue temporal en texto plano (MVP).
- Debe migrarse a hash real en siguiente fase.

### 3) Diario/Bitácora en DB por usuario real
- Endpoints activos y funcionales:
  - `GET /api/diario/entries`
  - `POST /api/diario/entries`
  - `GET /api/diario/entries/[id]`
- Se eliminó dependencia de usuario fijo en backend.
- `userId` se resuelve desde sesión actual.
- Ownership aplicado: cada usuario ve solo sus entradas.

`cardsJson` preserva reconstrucción completa:
- carta (`cardId`, `cardName`, `image`)
- orientación
- posición exacta en canvas (`positionId`, `positionName`)
- `x`, `y`
- `rotation`
- `order`
- `meaningUsed`
- metadata/reflection/canvas y tracking de flips

### 4) Relecturas futuras en DB por usuario real
- Endpoint activo:
  - `POST /api/diario/entries/[id]/rereadings`
- Guarda:
  - `bitacoraEntryId`
  - `userId` (desde sesión)
  - `fulfilled`
  - `comment`
  - `reflection`
  - `newInterpretation`
  - `lessonLearned`
- Validaciones:
  - entrada existe
  - entrada pertenece al usuario actual
  - no permite crear relecturas en entradas ajenas

UI detalle:
- Muestra historial de relecturas
- Permite agregar múltiples relecturas
- Sin edición ni eliminación
- `createdAt` visible vía fecha/hora mostrada en historial
- Orden coherente: ascendente por `createdAt`

### 5) Listado de bitácora mejorado (sin rediseño)
- Se agregó indicador discreto cuando hay relecturas.
- Se agregó indicador discreto cuando existe relectura cumplida (`didComeTrue = "si"`).

### 6) Dashboard mínimo
- Se integraron métricas en dashboard (sin rediseño):
  - total de entradas
  - total de relecturas
  - lecturas cumplidas
  - última lectura registrada
- Métricas calculadas por usuario de sesión actual.

### 7) Flujo de registro de usuario desde UI
- Nueva ruta: `/register`
- Pantalla de registro con campos:
  - email (requerido, tipo email)
  - password (requerido, mínimo 8 caracteres)
  - confirm password (debe coincidir con password)
- Conecta con endpoint existente: `POST /api/auth/register`
- Validaciones frontend:
  - email requerido y válido (tipo input email)
  - password mínimo 8 caracteres
  - confirm password debe coincidir
- UX implementada:
  - Muestra error si falla el registro (usuario duplicado, datos inválidos, error de red)
  - Muestra mensaje de éxito al registrarse
  - Redirige a `/login` automáticamente tras 1.5 segundos
- Login page actualizada:
  - Enlace "¿No tienes cuenta? Regístrate" que lleva a `/register`
- Register page incluye:
  - Enlace "¿Ya tienes cuenta? Inicia sesión" que lleva a `/login`
- Sin cambios en estilos globales:
  - Reutiliza clases existentes: `auth-shell`, `auth-card`, `auth-form`, `auth-error`, `auth-submit`, `app-kicker`
  - No se modificó `globals.css`

## Endpoints activos
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/diario/entries`
- `POST /api/diario/entries`
- `GET /api/diario/entries/[id]`
- `POST /api/diario/entries/[id]/rereadings`

## Archivos modificados/creados en esta fase
- `lib/auth.ts`
- `lib/auth-server.ts` (nuevo)
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts` (nuevo)
- `middleware.ts`
- `app/api/diario/entries/route.ts`
- `app/api/diario/entries/[id]/route.ts`
- `app/api/diario/entries/[id]/rereadings/route.ts`
- `app/api/diario/_lib/bitacora-mapper.ts`
- `app/diario/api-client.ts`
- `app/diario/diario-hub.tsx`
- `app/dashboard/page.tsx`
- `app/register/page.tsx` (nuevo — página de registro)
- `app/register/register-form.tsx` (nuevo — formulario de registro)
- `app/login/page.tsx` (modificado — enlace a registro)

## Validación técnica
- Comando ejecutado: `npm run build`
- Resultado: exitoso (exit code 0)
- Rutas detectadas por build incluyen los endpoints de auth + diario + relecturas + registro.
- Ruta `/register` generada como static (○).

## Validación manual MVP multiusuario
- Registro de usuario probado correctamente.
- Login probado correctamente.
- Persistencia de sesión tras refresh: OK.
- Rutas privadas `/diario` y `/dashboard` protegidas sin sesión: OK.
- API `/api/diario/entries` sin sesión devuelve error controlado "No autenticado": OK.
- Ownership validado:
  - Usuario Khael no ve entradas de usuario André.
  - Usuario André no ve entradas de usuario Khael.
- Bitácora y relecturas quedan separadas por `userId` real de sesión.

## Pendientes reales
1. Migrar `passwordHash` a hashing real (bcrypt/argon2) y actualizar login/register.
2. Reemplazar esquema de sesión actual por sesión firmada/JWT o tabla de sesiones.
3. Migrar `middleware.ts` a `proxy.ts` por deprecación de Next.
4. Agregar tests de integración (auth + ownership + diario/relecturas).
5. Limpiar textos con encoding roto aún presentes en archivos legacy de contenido tarot.

