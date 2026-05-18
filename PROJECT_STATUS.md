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
- `POST /api/auth/forgot-password` (nuevo)
- `POST /api/auth/reset-password` (nuevo)
- `GET /api/diario/entries`
- `POST /api/diario/entries`
- `GET /api/diario/entries/[id]`
- `POST /api/diario/entries/[id]/rereadings`

### 8) Hardening de seguridad para demo privada

#### FASE 1 — Sesión única por usuario
- Se agregó campo `sessionToken` en modelo `User` (Prisma).
- Al hacer login, se genera un `sessionToken` (UUID) y se guarda en DB.
- El cookie ahora incluye el `sessionToken` junto con `userId` y `email`.
- `auth-server.ts` valida que el `sessionToken` del cookie coincida con el de la DB.
- Si el usuario inicia sesión en otro navegador/dispositivo, el `sessionToken` se regenera y el anterior queda inválido automáticamente.
- Al hacer logout, se limpia `sessionToken` en DB (`null`), invalidando la sesión globalmente.

#### FASE 2 — Protección de demo privada
- Se creó modelo `AccessLog` en Prisma con campos: `userId`, `email`, `action`, `userAgent`, `createdAt`.
- Se creó helper `lib/access-log.ts` que registra accesos de forma no bloqueante.
- Acciones registradas: `login`, `logout`, `register`, `password_reset`.
- `userAgent` capturado en cada acción si está disponible.
- Se actualizó `InternalNav` (async) para mostrar marca discreta:
  `"Demo privada para [email]"` visible junto al botón de logout.

#### FASE 3 — Recuperación de cuenta
- Se creó modelo `PasswordResetToken` en Prisma con: `tokenHash` (SHA-256), `used`, `expiresAt`.
- Se creó `lib/token-utils.ts` con `generateResetToken()` y `hashToken()`.
- Token almacenado como hash SHA-256, nunca en texto plano en DB.
- Expiración configurable (30 minutos por defecto).
- Token de un solo uso (`used: true` tras consumirse).
- Endpoint `POST /api/auth/forgot-password`:
  - No revela si el email existe (anti-enumeración).
  - En modo desarrollo, imprime el enlace de reset en consola del servidor.
  - Pendiente: integrar proveedor de email para producción.
- Endpoint `POST /api/auth/reset-password`:
  - Valida hash del token.
  - Verifica expiración y uso único.
  - Actualiza contraseña.
  - Invalida todas las sesiones activas (`sessionToken = null`).
  - Registra access log.
- Páginas UI:
  - `/forgot-password` — formulario con campo email.
  - `/reset-password?token=xxx` — formulario con nueva contraseña + confirmación.

#### FASE 4 — UX mínima
- Login page actualizada con:
  - Enlace "¿Olvidaste tu contraseña?" → `/forgot-password`
  - Enlace "¿No tienes cuenta? Regístrate" → `/register`
- Errores claros en cada flujo:
  - "Token inválido o expirado."
  - "Este enlace ya fue utilizado."
  - "Este enlace ha expirado. Solicita uno nuevo."
  - "Las contraseñas no coinciden."
  - "La contraseña debe tener al menos 8 caracteres."

## Archivos modificados/creados en esta fase
- `prisma/schema.prisma` (modificado — sessionToken, AccessLog, PasswordResetToken)
- `lib/auth.ts` (modificado — sessionToken en cookie payload)
- `lib/auth-server.ts` (modificado — validación de sessionToken contra DB)
- `lib/access-log.ts` (nuevo — helper de registro de accesos)
- `lib/token-utils.ts` (nuevo — generación y hash SHA-256 de tokens)
- `app/api/auth/login/route.ts` (modificado — genera sessionToken + access log)
- `app/api/auth/logout/route.ts` (modificado — invalida sessionToken + access log)
- `app/api/auth/register/route.ts` (modificado — access log)
- `app/api/auth/forgot-password/route.ts` (nuevo)
- `app/api/auth/reset-password/route.ts` (nuevo)
- `app/forgot-password/page.tsx` (nuevo)
- `app/forgot-password/forgot-password-form.tsx` (nuevo)
- `app/reset-password/page.tsx` (nuevo)
- `app/reset-password/reset-password-form.tsx` (nuevo)
- `app/components/internal-nav.tsx` (modificado — marca demo + async)
- `app/login/page.tsx` (modificado — enlace forgot-password)
- `middleware.ts` (modificado — rutas públicas forgot/reset-password)

## Validación técnica
- Comando ejecutado: `npm run build`
- Resultado: exitoso (exit code 0, sin warnings de node:crypto)
- Rutas detectadas por build:
  - Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`
  - Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/diario`, `/cartas`, `/tiradas`
- Rutas públicas: `/forgot-password` (○ static), `/reset-password` (ƒ dynamic por searchParams)
- `prisma db push` ejecutado exitosamente.

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
1. Migrar `passwordHash` a hashing real (bcrypt/argon2) y actualizar login/register/reset-password.
2. Migrar `middleware.ts` a `proxy.ts` por deprecación de Next.
3. Agregar tests de integración (auth + ownership + diario/relecturas + reset).
4. Limpiar textos con encoding roto aún presentes en archivos legacy de contenido tarot.
5. Integrar proveedor de email (Resend/SES/Mailgun) para enviar enlaces de recuperación en producción.
6. Validar sesión única: login en segundo navegador invalida el primero.
7. Validar recuperación completa: token expirado, token reutilizado, cambio efectivo de contraseña.


---

## Incidente Vercel - Login falla en producción (diagnóstico y corrección)

### Síntoma reportado
- Local: login funciona.
- Vercel producción: login no permite iniciar sesión.

### Causa más probable detectada
1. **Diferencia de datos entre local y producción**:
   - Usuario existente en local no necesariamente existe en DB de producción.
   - Se recomienda registrar usuario directamente en producción vía `/register` y luego login.
2. **Posible desalineación de schema en producción**:
   - Login actual requiere columnas/modelos ya incorporados:
     - `User.sessionToken`
     - `AccessLog`
     - `PasswordResetToken`
   - Si producción no tiene ese schema, el login puede fallar en runtime.

### Corrección aplicada en código
1. **Logs controlados temporales en `POST /api/auth/login`** (sin exponer password/hash):
   - `request_received`
   - `validation_failed`
   - `user_lookup` (found/active/passwordValid)
   - `session_token_generated`
   - `session_token_persisted`
   - `cookie_set`
   - `unexpected_error`
2. **Hardening de logout cookie en producción**:
   - Se fuerza expiración explícita (`maxAge: 0`) con los mismos atributos de cookie (`httpOnly`, `secure`, `sameSite`, `path="/"`) antes de delete.
3. **Variables legacy temporales removidas de `.env.example`**:
   - Ya no se documentan `TEMP_AUTH_*` porque auth real usa DB.

### Variables de entorno (lista exacta)
#### Requeridas (Vercel)
- `DATABASE_URL`
- `DIRECT_URL`

#### Opcionales
- `AUTH_DEBUG` (`1` para logs detallados fuera de prod; en prod el login ya emite logs controlados)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Verificación cookie/auth
- Login escribe cookie: `codexkhael_session`
- Opciones de cookie en login:
  - `httpOnly: true`
  - `secure: true` en producción
  - `sameSite: "lax"`
  - `path: "/"`
  - `maxAge: 7 días`
- Middleware y `auth-server` leen la misma cookie y validan:
  - `userId`
  - `email`
  - `sessionToken` contra DB

### Comando seguro de sincronización schema (producción)
Ejecutar desde local apuntando a la DB de producción (NO en cliente web):

```bash
npx prisma db push
```

Si quieres forzar explícitamente variables de prod en shell:

```bash
DATABASE_URL="<PROD_DATABASE_URL>" DIRECT_URL="<PROD_DIRECT_URL>" npx prisma db push
```

### Validación funcional sugerida en Vercel
1. Crear usuario en `/register`.
2. Login con ese usuario en `/login`.
3. Confirmar sesión persistente tras refresh.
4. Abrir `/diario` (ruta protegida).
5. Probar `GET /api/diario/entries` autenticado.
6. Logout y confirmar cierre de sesión.

### Build
- `npm run build` ejecutado: **OK** (incluye auth + diario endpoints).

