"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { resolveTenantOwnerUserId } from "@/platform/tenant/tenant-resolver";
import { requireAction, validateTenantAccess } from "@/platform/auth/server-guards";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

import { BrandingConfig, getBrandingDefaults } from "@/platform/branding/branding-defaults";

const logger = createLogger("web:branding");

export interface BrandingVersion {
  id: string;
  version_number: number;
  config_values: BrandingConfig;
  description: string;
  created_at: string;
}

// Fila de tenant_settings tal como la trae el SELECT de abajo. config_value
// es jsonb: su forma real depende de config_key y no se puede verificar
// estáticamente sin un esquema de validación por campo — se trata como
// unknown hasta el punto de escritura en BrandingConfig.
interface TenantSettingRow {
  module: string;
  config_key: string;
  config_value: unknown;
}


/**
 * Retorna la configuración visual de branding consolidada del active tenant
 */
export async function getTenantBranding(tenantCode?: string | null): Promise<BrandingConfig> {
  const timer = startTimer("getTenantBranding");
  const tenantId = await getTenantId(tenantCode);
  const defaults = getBrandingDefaults(tenantCode);

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .select("module, config_key, config_value")
    .eq("tenant_id", tenantId)
    .in("module", ["EMPRESA", "LOCALIZACION", "IDENTIDAD", "DOCUMENTOS"])
    .is("deleted_at", null);

  if (error) {
    logger.error("Error fetching branding settings", { data: { tenantId, error } });
    timer.stop({ ok: false });
    return defaults;
  }

  const config = { ...defaults } as Record<string, unknown>;
  if (data && data.length > 0) {
    (data as TenantSettingRow[]).forEach((row) => {
      if (row.config_key in config) {
        config[row.config_key] = row.config_value;
      }
    });
  }

  timer.stop({ ok: true, rows: data?.length ?? 0 });
  return config as unknown as BrandingConfig;
}

/**
 * Guarda las configuraciones visuales de branding, creando una nueva versión histórica
 */
export async function saveTenantBranding(
  tenantCode: string | null,
  data: Partial<BrandingConfig>,
  versionDescription?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("branding.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const userId = resolveTenantOwnerUserId(tenantId);

    const keys = Object.keys(data) as Array<keyof BrandingConfig>;
    if (keys.length === 0) {
      return { success: true };
    }

    // 1. Prepare settings rows
    const rows = keys.map((key) => {
      let settingsModule = "IDENTIDAD";
      if (["nombre_comercial", "razon_social", "nit", "direccion", "ciudad", "pais", "telefono_principal", "email_corporativo", "web"].includes(key)) {
        settingsModule = "EMPRESA";
      } else if (["zona_horaria", "idioma", "moneda", "formato_fecha", "formato_hora", "separador_decimal", "separador_miles"].includes(key)) {
        settingsModule = "LOCALIZACION";
      } else if (["firma_url", "sello_url"].includes(key)) {
        settingsModule = "DOCUMENTOS";
      }

      return {
        tenant_id: tenantId,
        module: settingsModule,
        config_key: key,
        config_value: data[key],
        is_public: true,
        is_encrypted: false,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };
    });

    // 2. Perform bulk upsert
    const { error: upsertErr } = await supabaseAdmin
      .from("tenant_settings")
      .upsert(rows, { onConflict: "tenant_id,module,config_key" });

    if (upsertErr) {
      logger.error("Error upserting branding settings", { data: { tenantId, error: upsertErr } });
      return { success: false, error: upsertErr.message };
    }

    // 3. Create full snapshot of branding configuration
    const activeBranding = await getTenantBranding(tenantCode);

    // 4. Retrieve next version number
    const { data: latestVer, error: verErr } = await supabaseAdmin
      .from("tenant_branding_version")
      .select("version_number")
      .eq("tenant_id", tenantId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verErr) {
      logger.error("Error fetching latest version number", { data: { tenantId, error: verErr } });
    }

    const nextVersion = latestVer ? latestVer.version_number + 1 : 1;

    // 5. Insert new version
    const { error: versionErr } = await supabaseAdmin
      .from("tenant_branding_version")
      .insert({
        tenant_id: tenantId,
        version_number: nextVersion,
        config_values: activeBranding,
        description: versionDescription || `Actualización de Branding (Versión ${nextVersion})`,
        created_by: userId
      });

    if (versionErr) {
      logger.error("Error inserting branding version snapshot", { data: { tenantId, error: versionErr } });
      return { success: false, error: versionErr.message };
    }

    return { success: true };
  } catch (err) {
    logger.error("Exception in saveTenantBranding", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Lista el historial de versiones del branding para este tenant
 */
export async function getBrandingHistory(tenantCode?: string | null): Promise<BrandingVersion[]> {
  const tenantId = await getTenantId(tenantCode);

  const { data, error } = await supabaseAdmin
    .from("tenant_branding_version")
    .select("id, version_number, config_values, description, created_at")
    .eq("tenant_id", tenantId)
    .order("version_number", { ascending: false });

  if (error) {
    logger.error("Error fetching branding history", { data: { tenantId, error } });
    return [];
  }

  return (data || []) as BrandingVersion[];
}

/**
 * Restaura una versión específica de branding histórico
 */
export async function restoreBrandingVersion(
  tenantCode: string | null,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("branding.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const userId = resolveTenantOwnerUserId(tenantId);

    // 1. Fetch version config
    const { data: version, error: fetchErr } = await supabaseAdmin
      .from("tenant_branding_version")
      .select("version_number, config_values")
      .eq("id", versionId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !version) {
      logger.error("Error fetching branding version for restore", { data: { tenantId, versionId, error: fetchErr } });
      return { success: false, error: fetchErr?.message || "Versión no encontrada" };
    }

    const config = version.config_values as BrandingConfig;

    // 2. Prepare settings rows from configuration snapshot
    const keys = Object.keys(config) as Array<keyof BrandingConfig>;
    const rows = keys.map((key) => {
      let settingsModule = "IDENTIDAD";
      if (["nombre_comercial", "razon_social", "nit", "direccion", "ciudad", "pais", "telefono_principal", "email_corporativo", "web"].includes(key)) {
        settingsModule = "EMPRESA";
      } else if (["zona_horaria", "idioma", "moneda", "formato_fecha", "formato_hora", "separador_decimal", "separador_miles"].includes(key)) {
        settingsModule = "LOCALIZACION";
      } else if (["firma_url", "sello_url"].includes(key)) {
        settingsModule = "DOCUMENTOS";
      }

      return {
        tenant_id: tenantId,
        module: settingsModule,
        config_key: key,
        config_value: config[key],
        is_public: true,
        is_encrypted: false,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };
    });

    // 3. Upsert back to active settings
    const { error: upsertErr } = await supabaseAdmin
      .from("tenant_settings")
      .upsert(rows, { onConflict: "tenant_id,module,config_key" });

    if (upsertErr) {
      logger.error("Error restoring settings from version snapshot", { data: { tenantId, error: upsertErr } });
      return { success: false, error: upsertErr.message };
    }

    // 4. Create a new version snapshot referencing the restoration
    const { data: latestVer } = await supabaseAdmin
      .from("tenant_branding_version")
      .select("version_number")
      .eq("tenant_id", tenantId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = latestVer ? latestVer.version_number + 1 : 1;

    const { error: versionErr } = await supabaseAdmin
      .from("tenant_branding_version")
      .insert({
        tenant_id: tenantId,
        version_number: nextVersion,
        config_values: config,
        description: `Restaurado a la Versión ${version.version_number}`,
        created_by: userId
      });

    if (versionErr) {
      logger.error("Error logging version restoration", { data: { tenantId, error: versionErr } });
    }

    return { success: true };
  } catch (err) {
    logger.error("Exception in restoreBrandingVersion", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública
 */
export async function getPublicBranding(tenantCode?: string | null): Promise<BrandingConfig> {
  return getTenantBranding(tenantCode);
}

export async function uploadBrandingLogo(
  tenantCode: string | null,
  fileType: string, // e.g. logo_claro_url, logo_oscuro_url, favicon_url, etc.
  base64Data: string, // base64 string
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const ctx = await requireAction("branding.manage");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);

    // 1. Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // 2. Ensure bucket exists and is public
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) {
      logger.error("Error listing buckets", { data: { tenantId, error: listErr } });
      return { success: false, error: listErr.message };
    }

    const bucketName = "tenant-logos";
    const bucketExists = buckets?.some((b) => b.name === bucketName);

    if (!bucketExists) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"],
        fileSizeLimit: 2 * 1024 * 1024 // 2MB
      });

      if (createErr) {
        logger.error("Error creating bucket", { data: { tenantId, bucketName, error: createErr } });
        return { success: false, error: createErr.message };
      }
    }

    // 3. Upload file
    const fileExt = fileName.split(".").pop() || "png";
    const filePath = `${tenantId}/${fileType}-${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadErr) {
      logger.error("Error uploading file", { data: { tenantId, filePath, error: uploadErr } });
      return { success: false, error: uploadErr.message };
    }

    // 4. Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return { success: false, error: "No se pudo generar la URL pública" };
    }

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    logger.error("Exception in uploadBrandingLogo", { error: err instanceof Error ? err : undefined, data: { raw: err } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
