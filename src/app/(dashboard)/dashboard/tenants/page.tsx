"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Plus, ShieldAlert, CheckCircle2 } from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import { Badge } from "@/platform/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/ui/form";
import { Sheet, SheetContent, SheetTrigger } from "@/platform/ui/sheet";

import { getErpBrowserClient } from "@/platform/auth/clients";
import { getUserRole } from "@/platform/users/users";
import { createTenant, listTenants, type TenantListItem } from "@/erp/actions/tenants";

const supabase = getErpBrowserClient();

const tenantSchema = z.object({
  tenantCode: z
    .string()
    .min(2, { message: "El código debe tener al menos 2 caracteres." })
    .max(50)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/i, {
      message: "Solo letras, números y guiones (ej. mi-empresa).",
    }),
  name: z.string().min(2, { message: "El nombre comercial es obligatorio." }),
  legalName: z.string().min(2, { message: "La razón social es obligatoria." }),
  taxId: z.string().min(3, { message: "El NIT es obligatorio." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  adminFirstName: z.string().min(1, { message: "El nombre del administrador es obligatorio." }),
  adminLastName: z.string().min(1, { message: "El apellido del administrador es obligatorio." }),
  adminEmail: z.string().email({ message: "Email del administrador inválido." }),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

function isPlatformAdmin(role: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN_DEV";
}

export default function TenantsPage() {
  const [role, setRole] = React.useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
      if (!cancelled) setRoleLoaded(true);
    }
    loadRole();
    return () => { cancelled = true; };
  }, []);

  const loadTenants = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await listTenants();
      setTenants(list);
    } catch (err) {
      console.error("Error cargando tenants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (roleLoaded && isPlatformAdmin(role)) {
      queueMicrotask(() => { loadTenants(); });
    }
  }, [roleLoaded, role, loadTenants]);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      tenantCode: "",
      name: "",
      legalName: "",
      taxId: "",
      email: "",
      phone: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
    },
  });

  const onSubmit = async (values: TenantFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await createTenant(values);
      if (!result.success) {
        setErrorMsg(result.error || "Error creando el tenant.");
        return;
      }
      setSuccessMsg(
        `Tenant "${result.tenantCode}" creado. El administrador (${values.adminEmail}) debe usar "¿Olvidaste tu contraseña?" en el login para activar su cuenta.`
      );
      form.reset();
      setIsSheetOpen(false);
      await loadTenants();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error creando el tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!roleLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" className="text-muted-foreground mb-2" />
      </div>
    );
  }

  if (!isPlatformAdmin(role)) {
    return (
      <div className="w-full max-w-md mx-auto py-20 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
        <h1 className="text-sm font-mono uppercase tracking-widest font-bold text-foreground">
          Acceso restringido
        </h1>
        <p className="text-xs text-muted-foreground">
          Crear tenants nuevos es una acción exclusiva de administradores de
          plataforma (SUPER_ADMIN / ADMIN_DEV).
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Building2 className="w-3.5 h-3.5 text-primary" /> Plataforma
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Clientes (Tenants)
          </h1>
          <p className="text-xs text-muted-foreground">
            Alta de clientes nuevos: un formulario crea el tenant, su primer
            usuario administrador y su rol asignado en un solo paso.
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">{"// Alta de Cliente"}</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Nuevo Tenant</h3>
                <p className="text-xs text-muted-foreground">Provisiona la empresa y su primer usuario administrador.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="tenantCode"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Código del Tenant</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. mi-empresa" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Nombre Comercial</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Razón Social</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">NIT</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Email de la Empresa (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 border-t border-border">
                    <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">{"// Primer usuario administrador"}</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="adminFirstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminLastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Email (login)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Crear Tenant
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-md bg-success/10 border border-success/25 text-xs text-success font-mono flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
          <Spinner size="lg" className="text-muted-foreground mb-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">
                  {t.tenantCode}
                </span>
                <Badge variant={t.status === "Activo" ? "success" : "secondary"} className="text-[8px] py-0 px-1 font-mono uppercase">
                  {t.status}
                </Badge>
              </div>
              <h4 className="text-xs font-semibold text-foreground">{t.name}</h4>
              <p className="text-[10px] text-muted-foreground font-mono">{t.legalName}</p>
            </div>
          ))}

          {tenants.length === 0 && (
            <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
              {"// No hay tenants registrados todavía."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
