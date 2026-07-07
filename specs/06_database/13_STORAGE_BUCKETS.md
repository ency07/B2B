# STORAGE BUCKETS — Arquitectura de Almacenamiento

## 1. Arquitectura de Buckets

```
storage/
├── logos/              # Logos de tenants (público)
├── avatares/           # Fotos de perfil de usuarios
├── productos/          # Imágenes de productos del catálogo
├── documentos/         # Documentos (PDF, DWG, STEP)
│   ├── cotizaciones/   # PDFs de cotizaciones
│   ├── facturas/       # PDFs de facturas
│   ├── planos/         # Archivos CAD (.dwg, .dxf, .step)
│   ├── manuales/       # Manuales de operación
│   └── certificados/   # Certificados y garantías
├── evidencias/         # Fotos y videos de OTs
├── cms/                # Contenido del CMS
│   ├── imagenes/       # Imágenes generales
│   ├── banners/        # Banners promocionales
│   └── blog/           # Imágenes del blog
├── firmas/             # Firmas digitales
└── backups/            # Backups del sistema
```

---

## 2. Estructura de paths

```
/{bucket}/{tenant_id}/{entidad}/{id}/{archivo}
```

| Ejemplo |
|---|
| `/productos/uuid-tenant/uuid-producto/imagen_01.webp` |
| `/documentos/cotizaciones/uuid-tenant/uuid-cotizacion/cotizacion_0042.pdf` |
| `/evidencias/uuid-tenant/uuid-ot/foto_instalacion_01.jpg` |
| `/logos/uuid-tenant/logo_principal.svg` |
| `/avatares/uuid-usuario/avatar.jpg` |
| `/cms/imagenes/uuid-tenant/hero_bg.webp` |
| `/backups/uuid-tenant/backup_2025_01_15.dump` |

---

## 3. Políticas de Storage

### Productos (público)

```sql
-- SELECT: público (cualquiera puede ver)
CREATE POLICY "productos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

-- INSERT: solo usuario autenticado del tenant
CREATE POLICY "productos_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'productos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );
```

### Documentos (privado)

```sql
-- SELECT: solo usuarios autenticados del tenant
CREATE POLICY "documentos_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );

-- Portal: clientes solo ven sus documentos
-- (Se maneja via RLS en la tabla 'documentos' que tiene URLs de storage)
```

### Logos (público)

```sql
CREATE POLICY "logos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
```

### Firmas (privado)

```sql
CREATE POLICY "firmas_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'firmas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text
  );
```

---

## 4. Transformación de Imágenes

Supabase Storage soporta transformación on-the-fly:

| Imagen | Width | Formato | Uso |
|---|---|---|---|
| Producto thumbnail | 400px | webp | Grid de catálogo |
| Producto ficha | 1200px | webp | Página de ficha técnica |
| Avatar | 80px | webp | Avatares en listas |
| Banner | 2000px | webp | Hero y banners |
| Blog thumbnail | 600px | webp | Grid de blog |
| Evidencia thumbnail | 300px | jpg | Gallery de OT |

### URL de transformación

```
{SUPABASE_URL}/storage/v1/render/image/public/productos/{path}?width=400&format=webp
```

---

## 5. Tipos de archivo permitidos

| Bucket | Extensiones | Tamaño máximo |
|---|---|---|
| logos | .svg, .png, .webp | 2 MB |
| avatares | .jpg, .png, .webp | 1 MB |
| productos | .jpg, .png, .webp, .svg | 5 MB |
| documentos | .pdf, .dwg, .dxf, .step, .igs | 25 MB |
| evidencias | .jpg, .png, .webp, .mp4 | 50 MB |
| cms | .jpg, .png, .webp, .svg, .mp4 | 10 MB |
| firmas | .png, .svg | 500 KB |
| backups | .dump, .sql.gz | 500 MB |

---

## 6. Convenciones de nombres de archivo

```
{tipo}_{descripcion}.{extension}
```

| Ejemplo |
|---|
| `hero_bg.webp` |
| `producto_extractor_axial_01.webp` |
| `cotizacion_COT_0042.pdf` |
| `plano_asbuilt_rev3.dwg` |
| `foto_instalacion_2025_01_15_01.jpg` |
| `firma_aprobacion.png` |

---

## 7. Configuración de Buckets

### Creación

```sql
-- Buckets se crean via Supabase Dashboard o CLI
-- No via migraciones SQL

supabase storage create logos --public
supabase storage create avatares
supabase storage create productos --public
supabase storage create documentos
supabase storage create evidencias
supabase storage create cms
supabase storage create firmas
supabase storage create backups
```

### Propiedades

| Bucket | Público | Size Limit | Allowed MIME |
|---|---|---|---|
| logos | Sí | 2 MB | image/* |
| avatares | No | 1 MB | image/* |
| productos | Sí | 5 MB | image/* |
| documentos | No | 25 MB | application/pdf, application/vnd.dwg, application/vnd.dxf, application/step |
| evidencias | No | 50 MB | image/*, video/mp4 |
| cms | Sí | 10 MB | image/*, video/mp4 |
| firmas | No | 500 KB | image/png, image/svg+xml |
| backups | No | 500 MB | application/octet-stream |

---

## 8. Limpieza y mantenimiento

### Archivos huérfanos

Script para detectar archivos en storage sin referencia en base de datos:

```sql
-- Productos: archivos no referenciados por ningún producto activo
SELECT s.name FROM storage.objects s
WHERE s.bucket_id = 'productos'
AND NOT EXISTS (
  SELECT 1 FROM productos p
  WHERE p.imagenes::jsonb @> to_jsonb(s.name)::jsonb
  AND p.deleted_at IS NULL
);
```

### Retención

| Tipo | Retención |
|---|---|
| Logos y avatares | Indefinido (mientras el tenant esté activo) |
| Productos | Indefinido |
| Documentos | 7 años (requisito legal) |
| Evidencias | 5 años |
| CMS | Indefinido |
| Backups | 30 días (rotación diaria) |
