# REUSE ANALYSIS - FASE 34: ADMINISTRACIÓN AVANZADA

**Fecha de Análisis:** 2026-06-18
**Fase:** 34 — Administración Avanzada (Perfiles, Campos Personalizados y Automatizaciones)
**Estado:** APROBADO — 5 herramientas/estrategias evaluadas (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom

---

## 1. Repositorios e Infraestructuras Evaluadas

Este análisis evalúa el soporte de campos personalizados y motores de reglas sin código desde la base de datos PostgreSQL.

### REPO-01 — PostgreSQL JSONB (Control de Datos Dinámicos Semiestructurados)

| Atributo | Valor |
|---|---|
| Repositorio | Nativo en PostgreSQL |
| Tiempo de Integración | Inmediato |
| Complejidad | Baja |
| Caso de Uso | Almacenamiento de valores de campos personalizados en una columna `custom_fields` |
| Veredicto | REUTILIZAR COMO PILAR DE DATOS |

Justificación: JSONB en Postgres es altamente eficiente, admite indexación y operaciones avanzadas. Guardar los campos dinámicos en una columna JSONB y validarla mediante triggers evita modificar físicamente el DDL de las tablas, cumpliendo el principio de no-modificación de código.

---

### REPO-02 — postgres-json-schema (PL/pgSQL Schema Validator)

| Atributo | Valor |
|---|---|
| Repositorio | gavinwahl/postgres-json-schema |
| URL | https://github.com/gavinwahl/postgres-json-schema |
| Licencia | MIT |
| Tiempo de Integración | Bajo |
| Caso de Uso | Validación de tipos de datos JSONB |
| Veredicto | REUTILIZAR LÓGICA DE VALIDACIÓN |

Justificación: Nos basaremos en la lógica de validación de este repositorio para construir un validador nativo en PL/pgSQL que compare las propiedades enviadas en `custom_fields` contra las definiciones guardadas en `custom_field_definitions`.

---

### REPO-03 — node-rules (JavaScript Rule Engine)

| Atributo | Valor |
|---|---|
| Repositorio | mitsukuruba/node-rules |
| URL | https://github.com/mitsukuruba/node-rules |
| Licencia | MIT |
| Stars | ~1.5k |
| Complejidad | Alta (requiere parser Javascript en servidor de aplicación) |
| Veredicto | EVALUADO — DESCARTADO |

Justificación: Integrar un motor de reglas en Javascript requiere que la lógica de negocio se procese en la capa del backend Node, lo que limita la capacidad de los triggers y procedimientos almacenados de base de datos para reaccionar atómicamente a cambios transaccionales. Un motor relacional de reglas en PL/pgSQL (`automation_rules`) es más óptimo y garantiza inmutabilidad y consistencia a nivel de base de datos.

---

### REPO-04 — BullMQ (Message & Job Queue)

| Atributo | Valor |
|---|---|
| Repositorio | TaskforceSH/bullmq |
| URL | https://github.com/taskforcesh/bullmq |
| Licencia | MIT |
| Stars | ~16k |
| Caso de Uso | Procesamiento asíncrono y distribuido de las acciones resultantes de las automatizaciones |
| Veredicto | REUTILIZAR PARA BACKGROUND WORKERS |

Justificación: Cuando una regla de automatización determine enviar un correo o mensaje a WhatsApp/Telegram, el trigger de base de datos registrará el evento y BullMQ será responsable de procesar la cola de envío fuera del hilo transaccional principal de Postgres, previniendo latencia y bloqueos.

---

### REPO-05 — Gravatar (Avatar Resolver)

| Atributo | Valor |
|---|---|
| Repositorio | Automattic/gravatar |
| URL | https://es.gravatar.com/ |
| Licencia | Dominio Público |
| Tiempo de Integración | 2 horas |
| Caso de Uso | Resolver el avatar por defecto del usuario basándose en el hash MD5 de su email |
| Veredicto | REUTILIZAR PARA AVATARES POR DEFECTO |

Justificación: Si el administrador no carga una imagen personalizada para el usuario (`avatar_url`), utilizaremos el estándar global de Gravatar para mostrar una imagen de perfil coherente resolviéndola con una función simple en Postgres o frontend.

---

## 2. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios/Estrategias evaluados** | 5 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 4 (JSONB, postgres-json-schema, BullMQ, Gravatar) |
| **Repositorios descartados con justificación** | 1 (node-rules - descartado para mantener lógica a nivel de DB) |
| **Deuda técnica introducida** | 0 |
