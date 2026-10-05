# RLS (Row Level Security) - Guía rápida

Este archivo explica qué hace la migración `003_enable_rls_policies.sql` y cómo probarla.

Resumen:
- Activa RLS en tablas sensibles.
- Crea políticas básicas que limitan SELECT/INSERT/UPDATE según `auth.uid()` y el `role` almacenado en `users`.

Pasos recomendados para probar en staging:
1. Hacer backup de la BD (snapshots en Supabase).
2. Crear usuarios de prueba para cada rol: `collector`, `accountant`, `owner`.
3. Ejecutar la migración (`003_enable_rls_policies.sql`) usando el SQL Editor de Supabase o psql con la `service_role`.
4. Generar JWT para los usuarios de prueba (inicia sesión con sus cuentas para obtener tokens).
5. Llamar los endpoints REST (PostgREST) con la cabecera `Authorization: Bearer <JWT>` y verificar que:
   - `collector` puede insertar `collection_events` y ver sólo sus eventos.
   - `owner` puede ver todas las entidades relevantes.
   - `accountant` puede ver datos de contabilidad (loans, installments, ledger) según políticas.

Notas y recomendaciones:
- No dejar `spatial_ref_sys` expuesta públicamente; se revocaron permisos.
- Ajusta los nombres de columnas (por ejemplo `assigned_collector_id`) si tu esquema usa otros nombres.
- Las políticas proporcionadas son un punto de partida; afínalas según reglas de negocio más precisas.

Si quieres, puedo generar scripts de seeding para crear usuarios de prueba y comandos curl para validar cada caso.
