# 📍📷 Configuración GPS y Fotos - Guía Completa

## Estado de Implementación

✅ Hooks personalizados creados (`useGeolocation`, `useImageCapture`)
✅ Integración con Supabase Storage
✅ Server Action para guardar pagos con GPS y fotos
✅ UI actualizada con validaciones y feedback visual
✅ Configuración LAN para acceso desde móvil
✅ Compresión automática de imágenes >2MB

---

## Paso 1: Aplicar Migración SQL (Funciones de Daysheet)

1. Ir a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/sql

2. Click en **"New Query"**

3. Copiar y pegar el contenido completo de:
   `database/migrations/002_daysheet_functions.sql`

4. Click en **"Run"** (Ctrl+Enter)

5. Deberías ver: **"Success. No rows returned"**

---

## Paso 2: Crear Bucket de Supabase Storage

### Desde el Dashboard de Supabase:

1. Ir a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/storage/buckets

2. Click en **"New bucket"**

3. Configurar:
   - **Name**: `collection-receipts`
   - **Public bucket**: ❌ NO (dejar desmarcado, requiere autenticación)
   - Click **"Create bucket"**

### Configurar RLS Policies (Row Level Security):

4. Click en el bucket `collection-receipts` recién creado

5. Ve a la pestaña **"Policies"**

6. Click en **"New Policy"**

7. **Política 1: Permitir INSERT a usuarios autenticados**
   - Template: **"Custom"**
   - Policy name: `Allow authenticated users to upload`
   - Policy command: **INSERT**
   - Target roles: `authenticated`
   - USING expression:
     ```sql
     (bucket_id = 'collection-receipts')
     ```
   - WITH CHECK expression:
     ```sql
     (bucket_id = 'collection-receipts')
     ```
   - Click **"Review"** → **"Save policy"**

8. **Política 2: Permitir SELECT solo al propietario**
   - Click **"New Policy"** de nuevo
   - Template: **"Custom"**
   - Policy name: `Allow users to read own files`
   - Policy command: **SELECT**
   - Target roles: `authenticated`
   - USING expression:
     ```sql
     (bucket_id = 'collection-receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```
   - Click **"Review"** → **"Save policy"**

---

## Paso 3: Configurar Acceso LAN (Acceso desde Celular)

### 3.1 Obtener tu IP Local

**En Windows:**
```cmd
ipconfig
```
Buscar "IPv4 Address" (ejemplo: `192.168.1.105`)

**En macOS/Linux:**
```bash
ifconfig | grep inet
```

**Anotar tu dirección IP local** (ejemplo: `192.168.1.105`)

### 3.2 Iniciar Servidor con LAN habilitado

El proyecto ya está configurado con el flag `-H 0.0.0.0`:

```bash
pnpm dev
```

El servidor se iniciará en:
- **Localhost**: http://localhost:3002
- **Red local**: http://192.168.1.105:3002 (usar tu IP real)

### 3.3 Acceder desde el Celular

1. **Conectar el celular a la misma red WiFi** que tu computadora

2. **Abrir el navegador en el celular** (Chrome, Safari, Firefox, etc.)

3. **Ir a**: `http://192.168.1.105:3002` (reemplazar con tu IP real)

4. **Login** con:
   - `cobrador@amenadiel.com`
   - `12345`

---

## Paso 4: Configurar Permisos en el Navegador (Móvil)

### En Chrome/Safari (iOS y Android):

Cuando accedas a la página del cobrador, el navegador pedirá permisos:

1. **Permiso de Ubicación (GPS)**:
   - El navegador mostrará: "Allow [sitio] to access your location?"
   - Click **"Allow"** o **"Permitir"**

2. **Permiso de Cámara**:
   - Al hacer click en "Tomar Foto", el navegador mostrará: "Allow [sitio] to access your camera?"
   - Click **"Allow"** o **"Permitir"**

**Si negaste los permisos por error:**
- Chrome Android: Menú (3 puntos) → Configuración del sitio → Permisos
- Safari iOS: Ajustes → Safari → Ajustes de sitios web → Cámara/Ubicación

---

## Paso 5: Probar la Funcionalidad

### En Desktop (Desarrollo):

1. **Abrir**: http://localhost:3002
2. **Login**: `cobrador@amenadiel.com` / `12345`
3. **Ir a**: Registrar Pago
4. **Paso 1**: Seleccionar cliente (mock por ahora)
5. **Paso 2**:
   - Ingresar monto (ej: `150.00`)
   - Click **"Capturar GPS"** → Debe mostrar ✓ GPS Capturado
   - Click **"Tomar Foto"** → Seleccionar archivo → Debe mostrar preview
   - (Opcional) Agregar notas
   - Click **"Siguiente"**
6. **Paso 3**: Verificar resumen con foto y coordenadas
   - Click **"Confirmar y Guardar Pago"**
7. **Resultado**: Debe mostrar animación de éxito

### En Móvil (Prueba Real):

1. **Conectar a WiFi** (misma red que tu PC)
2. **Abrir navegador** en el celular
3. **Ir a**: `http://[TU-IP]:3002`
4. **Login**: `cobrador@amenadiel.com` / `12345`
5. **Probar flujo completo**:
   - GPS debe capturar ubicación real del dispositivo
   - Foto debe abrir la cámara del celular
   - Verificar que todo funciona end-to-end

---

## Funcionalidades Implementadas

### 🎯 GPS (Geolocalización)
- ✅ API nativa del navegador (gratuita y segura)
- ✅ Alta precisión (`enableHighAccuracy: true`)
- ✅ Timeout de 10 segundos
- ✅ Manejo de errores (permiso denegado, no disponible, timeout)
- ✅ Feedback visual (spinner, checkmark, mensajes de error)
- ✅ Coordenadas guardadas en formato GeoJSON Point

### 📸 Captura de Fotos
- ✅ Input file con `capture="environment"` (abre cámara trasera en móvil)
- ✅ Preview en tiempo real
- ✅ Compresión automática si la imagen > 2MB
- ✅ Validación de tamaño (máx 5MB)
- ✅ Validación de tipo (JPEG, PNG, WebP)
- ✅ Subida a Supabase Storage con estructura organizada

### 💾 Almacenamiento
- ✅ Bucket: `collection-receipts`
- ✅ Estructura: `{user_id}/{timestamp}_{random}.jpg`
- ✅ RLS activado (solo el propietario puede ver sus fotos)
- ✅ URL pública generada automáticamente

### 🔒 Validaciones
- ✅ Monto > 0
- ✅ GPS capturado obligatorio
- ✅ Foto obligatoria
- ✅ Usuario autenticado
- ✅ Solo cobradores pueden registrar pagos
- ✅ Préstamo debe existir y estar activo

### 🎨 UX/UI
- ✅ Loading states en botones
- ✅ Indicadores visuales (verde = capturado)
- ✅ Mensajes de error claros
- ✅ Preview de foto en confirmación
- ✅ Coordenadas GPS mostradas en confirmación
- ✅ Botones grandes (mobile-friendly)

---

## Troubleshooting

### ❌ Error: "Permiso denegado. Active el GPS..."
**Solución**:
- Desktop: Revisar configuración del navegador (Configuración → Privacidad → Ubicación)
- Móvil: Ajustes del navegador → Permisos del sitio

### ❌ Error: "No se pudo obtener ubicación"
**Solución**:
- Verificar que el dispositivo tiene GPS activo
- Si estás en desktop, el GPS puede no estar disponible (usa móvil)
- Reintentar captura

### ❌ Error: "Solo se permiten imágenes (JPEG, PNG, WebP)"
**Solución**:
- Seleccionar un archivo de imagen válido
- Si es desde la cámara, debería funcionar automáticamente

### ❌ Error: "La imagen no puede superar 5MB"
**Solución**:
- La compresión automática debería manejar esto
- Si persiste, tomar foto con menor resolución

### ❌ No puedo acceder desde el celular
**Solución**:
1. Verificar que PC y celular están en la MISMA red WiFi
2. Verificar IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
3. Desactivar firewall temporalmente (puede bloquear puerto 3002)
4. Verificar que el puerto 3002 no esté bloqueado por antivirus

### ❌ Error: "Error al subir foto"
**Solución**:
1. Verificar que el bucket `collection-receipts` existe en Supabase
2. Verificar que las RLS policies están configuradas correctamente
3. Verificar que el usuario está autenticado
4. Revisar console del navegador para más detalles

---

## Comandos Útiles

```bash
# Iniciar servidor con acceso LAN
pnpm dev

# Iniciar servidor solo local (sin LAN)
pnpm dev:local

# Obtener IP (Windows)
ipconfig

# Obtener IP (macOS/Linux)
ifconfig | grep inet

# Verificar que el puerto 3002 está escuchando
netstat -an | findstr :3002
```

---

## Próximos Pasos (Opcional)

1. **Implementar búsqueda real de clientes** (reemplazar mock)
2. **Agregar mapas** para visualizar ubicaciones de cobros
3. **Implementar galería de fotos** en el dashboard del contador
4. **Agregar filtros geográficos** en reportes
5. **Implementar notificaciones** cuando se sube una foto
6. **Agregar modo offline** con sincronización posterior

---

## ✅ Checklist de Configuración

- [ ] Migración SQL 002 aplicada
- [ ] Bucket `collection-receipts` creado
- [ ] RLS Policies configuradas (INSERT y SELECT)
- [ ] Servidor iniciado con `pnpm dev`
- [ ] IP local obtenida con `ipconfig`
- [ ] Acceso desde móvil probado
- [ ] Permisos de GPS y Cámara otorgados en el navegador
- [ ] Flujo completo de captura probado en móvil
- [ ] Pago guardado exitosamente con GPS y foto

---

**¡Tu sistema DLE ahora tiene captura GPS y fotos funcional!** 🎉

Para soporte adicional, revisar:
- Logs del servidor en la terminal
- Console del navegador (F12)
- Network tab para errores de API
