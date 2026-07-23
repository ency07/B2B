# Quickstart: Validar el filtro por categoría del catálogo

## Prerrequisitos

- Dependencias instaladas (`npm install` ya hecho en el repo)
- Variables de entorno de Supabase configuradas (o aceptar que se use `FALLBACK_CAPACITIES` si el
  catálogo de BD viene vacío — el filtro debe funcionar igual en ambos casos, ver spec.md Edge Cases)

## Levantar el entorno

```bash
npm run dev
```

Abrir `http://localhost:3000/` (o el subdominio/tenant configurado) y hacer scroll hasta la sección
`#capacidades` ("Equipos de ingeniería diseñados para su operación").

## Escenarios a validar (mapean 1:1 a spec.md → Acceptance Scenarios)

1. **Pills visibles**: la fila de filtros muestra "Todos" (activo por defecto) + una pill por cada
   categoría distinta presente en los productos cargados.
2. **Filtrar**: clic en una pill de categoría → la grilla muestra solo productos de esa categoría;
   la pill queda visualmente marcada como activa.
3. **Volver a "Todos"**: clic en "Todos" con un filtro activo → vuelve a mostrar el catálogo
   completo (máx. 9, comportamiento actual sin cambios).
4. **Estado vacío**: si una categoría no tiene productos (difícil de forzar con datos reales/
   fallback actuales, pero verificar que el código lo contempla) → se muestra un mensaje, no una
   grilla en blanco.
5. **No regresión**: abrir el modal de detalle técnico de un producto filtrado, confirmar que el
   botón "Solicitar Ingeniería · Cotizador" sigue enlazando a `/wizard?tenant=...&product=...`
   correctamente, y que `Escape`/click-fuera sigue cerrando el modal.

## Verificación técnica

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

Los tres deben pasar sin errores nuevos antes de considerar la tarea completa (gate de pre-commit
de la constitución, Principio VI).
