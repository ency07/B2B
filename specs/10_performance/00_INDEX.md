# PERFORMANCE — Estrategia de Optimización

## Métricas objetivo

| Métrica | Desktop | Mobile | Herramienta |
|---|---|---|---|
| LCP | < 2.5s | < 3.5s | Lighthouse |
| FID | < 100ms | < 150ms | Lighthouse |
| CLS | < 0.1 | < 0.15 | Lighthouse |
| TTFB | < 800ms | < 1.2s | Vercel Analytics |
| JS Bundle | < 200KB | < 150KB | Bundle Analyzer |
| Lighthouse Score | > 90 | > 85 | Lighthouse |

---

## Estrategia por capa

```
1. DATA FETCHING   → Joins, pagination, caching
2. RENDERING       → RSC, streaming, Suspense
3. BUNDLE          → Dynamic imports, tree shaking
4. IMAGES          → WebP, lazy, responsive sizes
5. FONTS           → Subset, preload, display swap
```

---

## Archivos

| Archivo | Contenido |
|---|---|
| `00_INDEX.md` | Métricas, estrategia |
| `01_SERVER_COMPONENTS.md` | RSC, streaming, Suspense |
| `02_DATA_FETCHING.md` | Joins, caching, pagination, N+1 |
| `03_IMAGES_BUNDLE.md` | Imágenes, dynamic imports, lazy loading |
