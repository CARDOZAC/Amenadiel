# Medidas de Seguridad - Sistema DLE

## 🔒 Protección contra Ataques de Supply Chain

### 1. Bloqueo de Scripts de Instalación

**Archivo:** `.npmrc`

```ini
ignore-scripts=true
```

**Propósito:** Neutraliza el vector de ataque #1 (scripts `postinstall` maliciosos).

**Impacto:** Algunos paquetes legítimos pueden requerir scripts de build. Estos deben ser aprobados explícitamente con:

```bash
pnpm rebuild <package-name>
```

---

### 2. Lockfile Inmutable

**Comando seguro de instalación:**

```bash
pnpm run install:safe
# Equivalente a: pnpm install --frozen-lockfile
```

**Garantía:** Solo se instalan las versiones exactas especificadas en `pnpm-lock.yaml`. Cualquier discrepancia causa un error en lugar de una actualización silenciosa.

---

### 3. Auditoría de Vulnerabilidades

**Auditoría manual:**

```bash
pnpm run audit
```

**Auto-reparación (con precaución):**

```bash
pnpm run audit:fix
```

**Importante:** Revisar el diff del lockfile después de `audit:fix`.

---

### 4. Librería de Precisión Decimal: `big.js`

**Justificación:** 
- ✅ **0 sub-dependencias** (minimiza superficie de ataque)
- ✅ Battle-tested (500K descargas/semana)
- ✅ Auditable (<1000 líneas de código)
- ✅ Precisión arbitraria (crítico para cálculos financieros)

**Uso:**

```typescript
import Big from 'big.js';

const capital = new Big('10000.00');
const tasaDiaria = new Big('0.013424'); // 490.99% TEA
const interesDiario = capital.times(tasaDiaria);
```

---

### 5. Principio de Mínimas Dependencias

**Regla de oro:** Cada dependencia es un ladrillo de dinamita potencial.

**Antes de agregar una dependencia, preguntarse:**
1. ¿Es realmente necesaria o puedo implementarlo en <100 líneas?
2. ¿Cuántas sub-dependencias tiene? (Revisar en npm)
3. ¿Está activamente mantenida? (Último commit < 6 meses)
4. ¿Es de un autor/organización confiable?

---

### 6. Revisión Manual del Lockfile

**Antes de cada commit que modifique dependencias:**

```bash
git diff pnpm-lock.yaml
```

**Verificar:**
- No aparecen paquetes sospechosos (typosquatting)
- Las versiones son las esperadas
- No hay cambios no solicitados en sub-dependencias

---

## 🚨 Vectores de Ataque Mitigados

| Vector de Ataque | Medida de Mitigación |
|------------------|----------------------|
| Scripts `postinstall` maliciosos | `.npmrc` con `ignore-scripts=true` |
| Hijacking de sub-dependencia | Lockfile inmutable + auditoría |
| Dependency confusion | Auditoría manual de dependencias nuevas |
| Typosquatting | Revisión manual del lockfile |
| Versiones vulnerables | `pnpm audit` automatizado |

---

## 📋 Checklist de Seguridad (para nuevos desarrolladores)

- [ ] Nunca ejecutar `npm install` o `pnpm install` directamente
- [ ] Siempre usar `pnpm run install:safe` en producción
- [ ] Ejecutar `pnpm run audit` semanalmente
- [ ] Revisar el diff de `pnpm-lock.yaml` antes de cada commit
- [ ] No instalar dependencias "por las dudas" - principio YAGNI
- [ ] Reportar cualquier paquete sospechoso al equipo de seguridad

---

## 🔗 Referencias

- [pnpm Security](https://pnpm.io/cli/audit)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

## ⚠️ Vulnerabilidades Conocidas (Aceptadas por Bajo Riesgo)

### glob@10.4.x (HIGH - Command Injection)

**Path:** `eslint-config-next > @next/eslint-plugin-next > glob`

**Descripción:** Vulnerabilidad de command injection en la CLI de glob cuando se usa con opciones `-c/--cmd`.

**Evaluación de Riesgo:**
- ✅ **Mitigado:** No utilizamos glob con opciones `-c/--cmd`
- ✅ **Scope limitado:** Solo afecta a herramientas de desarrollo (ESLint), no al runtime de producción
- ✅ **Dependencia transitiva:** No podemos actualizar directamente hasta que `eslint-config-next` actualice

**Acción:** Monitorear actualizaciones de `eslint-config-next`. Reevaluar cuando se publique una versión con glob >= 10.5.0.

**Fecha de registro:** 2025-12-13
