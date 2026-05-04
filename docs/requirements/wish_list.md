# 💡 Wish List — Ideas Adicionales

> **Proyecto:** Micro SaaS — Sistema de Registro de Jornales  
> **Última actualización:** 2026-05-04  
> **Nota:** Estas funcionalidades NO están en los documentos originales. Son sugerencias adicionales que podrían agregar valor al producto.

---

## Leyenda de estados

| Emoji | Estado |
|-------|--------|
| ⬜ | Sin evaluar |
| 🟢 | Aprobada para incluir |
| 🟡 | En evaluación |
| ❌ | Descartada |

---

## 1. Experiencia del Empleado

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-EMP-001 | **Geolocalización al fichar** | Registrar coordenadas GPS al iniciar/cerrar jornada. Útil para empleados que trabajan en campo o en distintas obras. RRHH puede validar ubicación | ⬜ |
| WL-EMP-002 | **Foto al fichar (selfie check-in)** | Captura de foto al iniciar jornada como prueba de presencia. Opcional y configurable por empresa | ⬜ |
| WL-EMP-003 | **QR Code para fichaje rápido** | Generar QR en un punto fijo (oficina, obra). Empleado escanea para iniciar/cerrar jornada sin necesidad de navegar la app | ⬜ |
| WL-EMP-004 | **NFC para fichaje** | Similar a QR pero con tag NFC en punto de trabajo. Fichaje instantáneo al acercar el celular | ⬜ |
| WL-EMP-005 | **Resumen semanal para el empleado** | Email o notificación push con resumen de horas de la semana. Motiva al empleado y reduce consultas a RRHH | ⬜ |
| WL-EMP-006 | **Widget de celular para inicio/fin rápido** | Widget nativo que permite iniciar/cerrar jornada desde la pantalla de inicio sin abrir la app | ⬜ |

---

## 2. Gestión y RRHH

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-RRHH-001 | **Calendario visual de jornadas** | Vista de calendario tipo Gantt o mensual donde RRHH ve las jornadas de todos los empleados de un vistazo | ⬜ |
| WL-RRHH-002 | **Plantillas de horarios** | Definir turnos estándar (ej: 8-17, 6-14, 14-22) y asignarlos a empleados. Simplifica la carga y permite detectar desvíos | ⬜ |
| WL-RRHH-003 | **Gestión de feriados** | Calendario de feriados nacional configurable. Los feriados trabajados pueden tener multiplicador especial (ej: x2.5) | ⬜ |
| WL-RRHH-004 | **Gestión de licencias y vacaciones** | Registro de días de licencia, vacaciones, enfermedad. Se descuentan del cómputo de ausencias | ⬜ |
| WL-RRHH-005 | **Alertas de horas extra excesivas** | Notificación automática cuando un empleado acumula más de X horas extra en la semana/mes. Previene sobrecostos | ⬜ |
| WL-RRHH-006 | **Comentarios en jornadas** | RRHH o supervisor puede dejar notas en un WorkLog (ej: "Trabajó en obra de Punta del Este") | ⬜ |
| WL-RRHH-007 | **Etiquetas/tags por jornada** | Clasificar jornadas por proyecto, obra, cliente o tipo de tarea. Permite reportes cruzados por categoría | ⬜ |

---

## 3. Reportes y Analytics Avanzados

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-ANA-001 | **Predicción de costos mensuales** | Basado en tendencia de últimas semanas, estimar el costo total del mes en curso. Ayuda a presupuestar | ⬜ |
| WL-ANA-002 | **Mapa de calor de horas** | Visualización de qué días/horarios se trabaja más. Identifica patrones de trabajo | ⬜ |
| WL-ANA-003 | **Reportes por proyecto/obra** | Si se implementan tags (WL-RRHH-007), generar reportes de horas y costos por proyecto u obra | ⬜ |
| WL-ANA-004 | **Dashboards personalizables (drag & drop)** | Cada usuario puede armar su propio dashboard moviendo y redimensionando widgets | ⬜ |
| WL-ANA-005 | **Exportar a Google Sheets** | Además de Excel, exportar directamente a Google Sheets para empresas que usan el ecosistema Google | ⬜ |
| WL-ANA-006 | **Reportes automáticos programados** | Configurar envío automático de reporte semanal/mensual por email a RRHH o gerencia | ⬜ |

---

## 4. Comercial y SaaS

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-SAAS-001 | **Trial gratuito de 14 días** | Período de prueba sin tarjeta de crédito para que las empresas evalúen la plataforma | ⬜ |
| WL-SAAS-002 | **Sistema de billing integrado** | Cobro automático mensual con Stripe o MercadoPago según plan y cantidad de empleados | ⬜ |
| WL-SAAS-003 | **Portal de autoservicio de empresa** | Cada empresa gestiona su suscripción, facturación y configuración sin contactar soporte | ⬜ |
| WL-SAAS-004 | **Onboarding guiado** | Tour interactivo al primer uso que guía al admin/RRHH paso a paso en la configuración inicial | ⬜ |
| WL-SAAS-005 | **Landing page pública** | Página de marketing con precios, features y formulario de registro | ⬜ |
| WL-SAAS-006 | **Multi-idioma del producto** | Soporte completo para español, portugués e inglés para expandir a otros mercados | ⬜ |
| WL-SAAS-007 | **Programa de referidos** | Empresas pueden referir otras empresas y obtener descuento en su suscripción | ⬜ |

---

## 5. Técnico / Infraestructura

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-TECH-001 | **API pública documentada** | API abierta con documentación Swagger/OpenAPI para que empresas integren con sus propios sistemas | ⬜ |
| WL-TECH-002 | **Backups automáticos con restore** | Backups diarios automáticos con opción de restaurar datos a un punto anterior | ⬜ |
| WL-TECH-003 | **Health check y uptime monitoring** | Endpoint `/health` público y dashboard de estado del servicio | ⬜ |
| WL-TECH-004 | **Feature flags** | Sistema de feature flags para habilitar/deshabilitar funcionalidades por empresa o globalmente | ⬜ |
| WL-TECH-005 | **Modo mantenimiento** | Pantalla de mantenimiento con estimación de tiempo sin perder datos offline | ⬜ |
| WL-TECH-006 | **Logs centralizados y alertas** | Integración con servicio de logging (ej: Datadog, Sentry) para monitorear errores en producción | ⬜ |

---

## 6. Experiencia Social / Engagement

| ID | Funcionalidad | Descripción / Valor | Estado |
|----|--------------|---------------------|--------|
| WL-SOC-001 | **Ranking gamificado de puntualidad** | Ranking interno de empleados más puntuales. Puede usarse para incentivos | ⬜ |
| WL-SOC-002 | **Reconocimientos/badges** | Badges automáticos como "Semana perfecta" o "Mes sin ausencias" para motivar empleados | ⬜ |
| WL-SOC-003 | **Encuesta de satisfacción** | Encuesta periódica breve (1-3 preguntas) al cerrar jornada para medir clima laboral | ⬜ |

---

## Notas

> [!TIP]
> Las ideas marcadas como 🟢 se moverán al documento de requerimientos de la versión correspondiente cuando se decida implementarlas.

> [!IMPORTANT]
> Antes de implementar funcionalidades de geolocalización (WL-EMP-001), foto (WL-EMP-002) o similares, es necesario evaluar implicaciones legales y de privacidad según la legislación uruguaya.

> [!NOTE]
> Las funcionalidades de billing y landing page (sección 4) son críticas para la monetización del SaaS pero no afectan la funcionalidad core del producto.
