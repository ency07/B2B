"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { resolveTenantOwnerUserIdAsync } from "@/platform/tenant/tenant-resolver";
import { requireAction, validateTenantAccess } from "@/platform/auth/server-guards";
import {
  invalidateCatalogCache as _invalidateCache,
} from "@/web/actions/catalog-cache";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("web:catalog");

export interface ProductMedia {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  altText: string;
}

export interface ProductDetail {
  id: string;
  productCode: string;
  name: string;
  description: string;
  status: string;
  specifications: Record<string, string>;
  images: ProductMedia[];
  documents: ProductMedia[];
  cadFiles: ProductMedia[];
  seo?: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    slug: string;
  };
}

export interface CatalogSeries {
  id: string;
  seriesCode: string;
  name: string;
  description: string;
  products: ProductDetail[];
}

export interface CatalogFamily {
  id: string;
  familyCode: string;
  name: string;
  description: string;
  series: CatalogSeries[];
}

export interface CatalogSubcategory {
  id: string;
  subcategoryCode: string;
  name: string;
  description: string;
  families: CatalogFamily[];
}

export interface CatalogCategory {
  id: string;
  categoryCode: string;
  name: string;
  description: string;
  subcategories: CatalogSubcategory[];
}

// Forma cruda de cada nivel tal como la trae el SELECT anidado de abajo. El
// cliente Supabase de este proyecto no usa tipos generados (Database), así
// que esta jerarquía se tipa a mano — un único cast en categoriesData en vez
// de any disperso por cada .map()/.filter() del árbol.
interface RawMediaAsset {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text: string | null;
}

interface RawProductImage {
  sort_order: number;
  media_assets: RawMediaAsset | null;
}

interface RawProductDocument {
  media_assets: RawMediaAsset | null;
}

interface RawProductFile {
  media_assets: RawMediaAsset | null;
}

interface RawProductSpecification {
  spec_name: string;
  spec_value: string;
}

interface RawProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  status: string;
  series_id: string;
  deleted_at: string | null;
  product_specifications: RawProductSpecification[] | null;
  product_images: RawProductImage[] | null;
  product_documents: RawProductDocument[] | null;
  product_files: RawProductFile[] | null;
}

interface RawProductSeries {
  id: string;
  series_code: string;
  name: string;
  description: string | null;
  family_id: string;
  products: RawProduct[] | null;
}

interface RawProductFamily {
  id: string;
  family_code: string;
  name: string;
  description: string | null;
  subcategory_id: string;
  product_series: RawProductSeries[] | null;
}

interface RawProductSubcategory {
  id: string;
  subcategory_code: string;
  name: string;
  description: string | null;
  category_id: string;
  product_families: RawProductFamily[] | null;
}

interface RawProductCategory {
  id: string;
  category_code: string;
  name: string;
  description: string | null;
  product_subcategories: RawProductSubcategory[] | null;
}

/**
 * Obtiene la jerarquía completa del Catálogo Industrial con:
 *  - Queries paralelos por nivel (Promise.all) en lugar de secuenciales
 *  - Caché en memoria de 60 segundos por tenant
 */
// Definición interna del fetching y procesado jerárquico del catálogo
async function fetchRawCatalogFromDB(tenantId: string): Promise<CatalogCategory[]> {
  const timer = startTimer("getIndustrialCatalog");
  // ── 1. Consulta jerárquica unificada en una sola query, filtrada por tenant ────
  const { data: categoriesData, error } = await supabaseAdmin
    .from("product_categories")
    .select(`
      id,
      category_code,
      name,
      description,
      product_subcategories (
        id,
        subcategory_code,
        name,
        description,
        category_id,
        product_families (
          id,
          family_code,
          name,
          description,
          subcategory_id,
          product_series (
            id,
            series_code,
            name,
            description,
            family_id,
            products (
              id,
              product_code,
              name,
              description,
              status,
              series_id,
              deleted_at,
              product_specifications (
                spec_name,
                spec_value
              ),
              product_images (
                sort_order,
                media_assets (
                  id,
                  file_name,
                  file_path,
                  file_size,
                  mime_type,
                  alt_text
                )
              ),
              product_documents (
                media_assets (
                  id,
                  file_name,
                  file_path,
                  file_size,
                  mime_type,
                  alt_text
                )
              ),
              product_files (
                media_assets (
                  id,
                  file_name,
                  file_path,
                  file_size,
                  mime_type,
                  alt_text
                )
              )
            )
          )
        )
      )
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error al cargar la jerarquía del catálogo de la BD", { data: { error, tenantId } });
    timer.stop({ ok: false });
    return [];
  }

  // ── 2. Consulta de metadatos SEO por separado, también filtrada por tenant ────
  const { data: seoData } = await supabaseAdmin
    .from("seo_metadata")
    .select("entity_id, meta_title, meta_description, meta_keywords, slug")
    .eq("entity_type", "PRODUCT")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const seoMap = new Map<
    string,
    { metaTitle: string; metaDescription: string; metaKeywords: string; slug: string }
  >();
  for (const s of seoData ?? []) {
    seoMap.set(s.entity_id, {
      metaTitle: s.meta_title,
      metaDescription: s.meta_description,
      metaKeywords: s.meta_keywords || "",
      slug: s.slug,
    });
  }

  function toMedia(asset: RawMediaAsset): ProductMedia {
    return {
      id: asset.id,
      fileName: asset.file_name,
      filePath: asset.file_path,
      fileSize: asset.file_size,
      mimeType: asset.mime_type,
      altText: asset.alt_text || "",
    };
  }

  // ── 3. Construcción y mapeo jerárquico ───────────────────────────────────
  const rawCategories = (categoriesData ?? []) as unknown as RawProductCategory[];
  const catalog: CatalogCategory[] = rawCategories.map((cat) => {
    const subcategories = (cat.product_subcategories ?? []).map((sub) => {
      const families = (sub.product_families ?? []).map((fam) => {
        const series = (fam.product_series ?? []).map((ser) => {
          const products = (ser.products ?? [])
            .filter((prod) => !prod.deleted_at)
            .map((prod) => {
              const specifications: Record<string, string> = {};
              for (const spec of prod.product_specifications ?? []) {
                specifications[spec.spec_name] = spec.spec_value;
              }

              const images = (prod.product_images ?? [])
                .filter((img): img is RawProductImage & { media_assets: RawMediaAsset } => !!img.media_assets)
                .map((img) => toMedia(img.media_assets));

              const documents = (prod.product_documents ?? [])
                .filter((doc): doc is RawProductDocument & { media_assets: RawMediaAsset } => !!doc.media_assets)
                .map((doc) => toMedia(doc.media_assets));

              const cadFiles = (prod.product_files ?? [])
                .filter((cad): cad is RawProductFile & { media_assets: RawMediaAsset } => !!cad.media_assets)
                .map((cad) => toMedia(cad.media_assets));

              const seo = seoMap.get(prod.id);

              return {
                id: prod.id,
                productCode: prod.product_code,
                name: prod.name,
                description: prod.description || "",
                status: prod.status,
                specifications,
                images,
                documents,
                cadFiles,
                seo,
              };
            });

          return {
            id: ser.id,
            seriesCode: ser.series_code,
            name: ser.name,
            description: ser.description || "",
            products,
          };
        });

        return {
          id: fam.id,
          familyCode: fam.family_code,
          name: fam.name,
          description: fam.description || "",
          series,
        };
      });

      return {
        id: sub.id,
        subcategoryCode: sub.subcategory_code,
        name: sub.name,
        description: sub.description || "",
        families,
      };
    });

    return {
      id: cat.id,
      categoryCode: cat.category_code,
      name: cat.name,
      description: cat.description || "",
      subcategories,
    };
  });

  timer.stop({ ok: true, categories: catalog.length });
  return catalog;
}

// Inicialización de la función de caché condicional según el runtime (soporte para ts-node/Next.js)
// El argumento tenantId pasado a la función envuelta se incorpora a la key de
// caché de unstable_cache automáticamente (además de la key explícita de
// abajo) — esto es lo que separa el caché por tenant, no un string fijo.
let getCachedCatalogInternal: (tenantId: string) => Promise<CatalogCategory[]>;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { unstable_cache } = require("next/cache");
  getCachedCatalogInternal = unstable_cache(
    async (tenantId: string) => fetchRawCatalogFromDB(tenantId),
    ["industrial-catalog-key"],
    {
      revalidate: 60, // 60 segundos
      tags: ["catalog-all"],
    }
  );
} catch {
  // Fallback para entornos que no son de Next.js (como los scripts de prueba en ts-node)
  getCachedCatalogInternal = async (tenantId: string) => fetchRawCatalogFromDB(tenantId);
}

/**
 * Obtiene la jerarquía completa del Catálogo Industrial con:
 *  - Queries optimizados (2 consultas en lugar de 10)
 *  - Caché de Next.js persistente e invalidable (unstable_cache), scopeada por tenant
 */
export async function getIndustrialCatalog(
  tenantCode?: string | null
): Promise<CatalogCategory[]> {
  const tenantId = await getTenantId(tenantCode);
  return getCachedCatalogInternal(tenantId);
}


/**
 * Registra un activo multimedia en el Media Manager y lo asocia a un producto.
 */
export async function addProductImage(
  tenantCode: string | null,
  productId: string,
  image: { fileName: string; filePath: string; fileSize: number; mimeType: string; altText?: string }
) {
  const ctx = await requireAction("catalog.manage");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Verificar que el producto pertenece a este tenant antes de asociarle un
  // asset — sin esto, cualquier admin con catalog.manage podría adjuntar
  // imágenes a un producto de otro tenant sabiendo/adivinando su UUID.
  const { data: productCheck } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!productCheck) {
    throw new Error("Producto no encontrado en este tenant.");
  }

  const { data: asset, error: assetError } = await supabaseAdmin
    .from("media_assets")
    .insert({
      tenant_id: tenantId,
      file_name: image.fileName,
      file_path: image.filePath,
      file_size: image.fileSize,
      mime_type: image.mimeType,
      alt_text: image.altText || "",
      usage_count: 1,
    })
    .select()
    .single();

  if (assetError) {
    logger.error("Error inserting media asset", { data: { productId, error: assetError } });
    throw new Error(assetError.message);
  }

  const { data: prodImg, error: linkError } = await supabaseAdmin
    .from("product_images")
    .insert({
      product_id: productId,
      media_asset_id: asset.id,
      sort_order: 10,
    })
    .select()
    .single();

  if (linkError) {
    logger.error("Error linking image to product", { data: { productId, error: linkError } });
    throw new Error(linkError.message);
  }

  _invalidateCache(tenantCode);
  return { asset, prodImg };
}

/**
 * Guarda o actualiza un producto en el catálogo, incluyendo sus especificaciones técnicas.
 */
export async function saveProduct(
  tenantCode: string | null,
  product: {
    id?: string;
    productCode: string;
    name: string;
    description: string;
    status: string;
    seriesId: string;
    specifications: Record<string, string>;
  }
) {
  try {
    const ctx = await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const userId = await resolveTenantOwnerUserIdAsync(tenantId, ctx.userId);

    let productId = product.id;

    const productPayload = {
      tenant_id: tenantId,
      product_code: product.productCode,
      name: product.name,
      description: product.description,
      status: product.status || "ACTIVO",
      series_id: product.seriesId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (productId) {
      // Verificar que el producto pertenece a este tenant antes de editarlo
      // — sin esto, cualquier admin con catalog.manage podría editar el
      // producto de otro tenant sabiendo/adivinando su UUID.
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!existing) throw new Error("Producto no encontrado en este tenant.");

      const { error: updateErr } = await supabaseAdmin
        .from("products")
        .update(productPayload)
        .eq("id", productId)
        .eq("tenant_id", tenantId);

      if (updateErr) throw new Error(updateErr.message);
    } else {
      const { data: newProd, error: insertErr } = await supabaseAdmin
        .from("products")
        .insert({ ...productPayload, created_by: userId })
        .select("id")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      productId = newProd.id;
    }

    if (productId) {
      const { error: deleteSpecsErr } = await supabaseAdmin
        .from("product_specifications")
        .delete()
        .eq("product_id", productId);

      if (deleteSpecsErr) logger.error("Error clearing specs", { data: { productId, error: deleteSpecsErr } });

      const specRows = Object.entries(product.specifications || {}).map(
        ([name, val]) => ({
          product_id: productId,
          spec_name: name,
          spec_value: val,
        })
      );

      if (specRows.length > 0) {
        const { error: insertSpecsErr } = await supabaseAdmin
          .from("product_specifications")
          .insert(specRows);

        if (insertSpecsErr) throw new Error(insertSpecsErr.message);
      }
    }

    _invalidateCache(tenantCode);
    return { success: true, productId };
  } catch (err) {
    logger.error("Exception in saveProduct", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Soft-delete de un producto del catálogo.
 */
export async function deleteProduct(tenantCode: string | null, productId: string) {
  try {
    const ctx = await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!existing) throw new Error("Producto no encontrado en este tenant.");

    const { error } = await supabaseAdmin
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err) {
    logger.error("Exception in deleteProduct", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Guarda o actualiza una categoría de producto.
 */
export async function saveCategory(
  tenantCode: string | null,
  category: {
    id?: string;
    categoryCode: string;
    name: string;
    description: string;
  }
) {
  try {
    const ctx = await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const userId = await resolveTenantOwnerUserIdAsync(tenantId, ctx.userId);

    const payload = {
      tenant_id: tenantId,
      category_code: category.categoryCode,
      name: category.name,
      description: category.description,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (category.id) {
      const { data: existing } = await supabaseAdmin
        .from("product_categories")
        .select("id")
        .eq("id", category.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!existing) throw new Error("Categoría no encontrada en este tenant.");

      const { error } = await supabaseAdmin
        .from("product_categories")
        .update(payload)
        .eq("id", category.id)
        .eq("tenant_id", tenantId);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .insert({ ...payload, created_by: userId });

      if (error) throw new Error(error.message);
    }

    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err) {
    logger.error("Exception in saveCategory", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Soft-delete de una categoría.
 */
export async function deleteCategory(tenantCode: string | null, categoryId: string) {
  try {
    const ctx = await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const { data: existing } = await supabaseAdmin
      .from("product_categories")
      .select("id")
      .eq("id", categoryId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!existing) throw new Error("Categoría no encontrada en este tenant.");

    const { error } = await supabaseAdmin
      .from("product_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err) {
    logger.error("Exception in deleteCategory", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
