"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { resolveTenantOwnerUserIdAsync } from "@/platform/tenant/tenant-resolver";
import { requireAction } from "@/platform/auth/server-guards";
import {
  invalidateCatalogCache as _invalidateCache,
} from "@/web/actions/catalog-cache";



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

/**
 * Obtiene la jerarquía completa del Catálogo Industrial con:
 *  - Queries paralelos por nivel (Promise.all) en lugar de secuenciales
 *  - Caché en memoria de 60 segundos por tenant
 */
// Definición interna del fetching y procesado jerárquico del catálogo
async function fetchRawCatalogFromDB(): Promise<CatalogCategory[]> {
  // ── 1. Consulta jerárquica unificada en una sola query ────────────────────────
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
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("[catalog] Error al cargar la jerarquía del catálogo de la BD:", error);
    return [];
  }

  // ── 2. Consulta de metadatos SEO por separado ─────────────────────────────
  const { data: seoData } = await supabaseAdmin
    .from("seo_metadata")
    .select("entity_id, meta_title, meta_description, meta_keywords, slug")
    .eq("entity_type", "PRODUCT")
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

  function toMedia(asset: any): ProductMedia {
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
  const catalog: CatalogCategory[] = (categoriesData ?? []).map((cat: any) => {
    const subcategories = (cat.product_subcategories ?? []).map((sub: any) => {
      const families = (sub.product_families ?? []).map((fam: any) => {
        const series = (fam.product_series ?? []).map((ser: any) => {
          const products = (ser.products ?? []).map((prod: any) => {
            const specifications: Record<string, string> = {};
            for (const spec of prod.product_specifications ?? []) {
              specifications[spec.spec_name] = spec.spec_value;
            }

            const images = (prod.product_images ?? [])
              .filter((img: any) => img.media_assets)
              .map((img: any) => toMedia(img.media_assets));

            const documents = (prod.product_documents ?? [])
              .filter((doc: any) => doc.media_assets)
              .map((doc: any) => toMedia(doc.media_assets));

            const cadFiles = (prod.product_files ?? [])
              .filter((cad: any) => cad.media_assets)
              .map((cad: any) => toMedia(cad.media_assets));

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

  return catalog;
}

// Inicialización de la función de caché condicional según el runtime (soporte para ts-node/Next.js)
let getCachedCatalogInternal: () => Promise<CatalogCategory[]>;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { unstable_cache } = require("next/cache");
  getCachedCatalogInternal = unstable_cache(
    async () => fetchRawCatalogFromDB(),
    ["industrial-catalog-key"],
    {
      revalidate: 60, // 60 segundos
      tags: ["catalog-all"],
    }
  );
} catch {
  // Fallback para entornos que no son de Next.js (como los scripts de prueba en ts-node)
  getCachedCatalogInternal = async () => fetchRawCatalogFromDB();
}

/**
 * Obtiene la jerarquía completa del Catálogo Industrial con:
 *  - Queries optimizados (2 consultas en lugar de 10)
 *  - Caché de Next.js persistente e invalidable (unstable_cache)
 */
export async function getIndustrialCatalog(
  _tenantCode?: string | null
): Promise<CatalogCategory[]> {
  return getCachedCatalogInternal();
}


/**
 * Registra un activo multimedia en el Media Manager y lo asocia a un producto.
 */
export async function addProductImage(
  tenantCode: string | null,
  productId: string,
  image: { fileName: string; filePath: string; fileSize: number; mimeType: string; altText?: string }
) {
  await requireAction("catalog.manage");
  const tenantId = await getTenantId(tenantCode);

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
    console.error("Error inserting media asset:", assetError);
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
    console.error("Error linking image to product:", linkError);
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
    await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    const userId = await resolveTenantOwnerUserIdAsync(tenantId);

    let productId = product.id;

    const productPayload = {
      product_code: product.productCode,
      name: product.name,
      description: product.description,
      status: product.status || "ACTIVO",
      series_id: product.seriesId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (productId) {
      const { error: updateErr } = await supabaseAdmin
        .from("products")
        .update(productPayload)
        .eq("id", productId);

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

      if (deleteSpecsErr) console.error("Error clearing specs:", deleteSpecsErr);

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
  } catch (err: any) {
    console.error("Exception in saveProduct:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Soft-delete de un producto del catálogo.
 */
export async function deleteProduct(tenantCode: string | null, productId: string) {
  try {
    await requireAction("catalog.manage");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId);

    if (error) throw new Error(error.message);
    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in deleteProduct:", err);
    return { success: false, error: err.message || String(err) };
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
    await requireAction("catalog.manage");
    const tenantId = await getTenantId(tenantCode);
    const userId = await resolveTenantOwnerUserIdAsync(tenantId);

    const payload = {
      category_code: category.categoryCode,
      name: category.name,
      description: category.description,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (category.id) {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .update(payload)
        .eq("id", category.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .insert({ ...payload, created_by: userId });

      if (error) throw new Error(error.message);
    }

    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in saveCategory:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Soft-delete de una categoría.
 */
export async function deleteCategory(tenantCode: string | null, categoryId: string) {
  try {
    await requireAction("catalog.manage");
    const { error } = await supabaseAdmin
      .from("product_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", categoryId);

    if (error) throw new Error(error.message);
    _invalidateCache(tenantCode);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in deleteCategory:", err);
    return { success: false, error: err.message || String(err) };
  }
}
