/**
 * /dashboard/clients — Customer 360 (Ola 2).
 *
 * Redisenado segun BLUEPRINT_ERP_REDESIGN.md §7:
 * - Lista premium con DataList + FilterBar + BulkActionBar
 * - Vista alternativa de tarjetas conmutables
 * - Customer 360 detail: 2-pane (contenido + inspector) con tabs
 * - Timeline unificado de actividad
 * - Preserva el flujo de creacion con Sheet + react-hook-form
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import {
  Sheet,
  SheetContent,
} from "@/platform/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/platform/ui/select";
import { getClients, createClient } from "@/erp/actions/core";;
import { getUserRole } from "@/platform/users/users";;
import {
  ClientList,
  ClientDetail,
  type ClientListItem,
} from "@/features/clients";
import type { FilterValue } from "@/erp/components/data-list";
import { canPerform } from "@/lib/role-permissions";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();

// Zod schema (preservado del flujo original)
const clientSchema = z.object({
  taxId: z
    .string()
    .min(8, { message: "El ID Fiscal/NIT debe tener al menos 8 caracteres." })
    .max(15, { message: "El ID Fiscal/NIT no puede superar los 15 caracteres." })
    .regex(/^[A-Z0-9-]{8,15}$/, {
      message: "Identificacion fiscal invalida. Use letras, numeros y guiones.",
    }),
  name: z.string().min(5, { message: "La razon social debe tener al menos 5 caracteres." }),
  segment: z.string().min(1, { message: "Por favor, selecciona el segmento del cliente." }),
  email: z.string().email({ message: "Por favor, ingresa un correo electronico valido." }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  // === Data state ===
  const [clients, setClients] = React.useState<ClientListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // === Role (para P3 - permisos por accion) ===
  const [role, setRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    }
    loadRole();
  }, []);

  // === View state ===
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<FilterValue[]>([]);
  const [activeView, setActiveView] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);

  // === Create flow state ===
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { taxId: "", name: "", segment: "", email: "" },
  });

  // === Load clients ===
  const loadClients = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(tenantParam);
      setClients(
        data.map((c) => ({
          id: c.id,
          taxId: c.taxId,
          name: c.name,
          segment: c.segment,
          totalInvoiced: c.totalInvoiced,
          status: c.status,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadClients();
  }, [loadClients]);

  // === Create handler ===
  const onCreateSubmit = async (values: ClientFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createClient(tenantParam, values);
      setIsCreateOpen(false);
      form.reset();
      await loadClients();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Ocurrio un error al registrar el cliente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // === Detail ===
  const selectedClient = React.useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6 lg:-m-8">
      {/* === Header === */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-4 border-b border-line">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Modulo de Clientes B2B
            </div>
            <h1 className="text-base font-mono uppercase tracking-widest font-bold text-ink">
              Cuentas Industriales
            </h1>
            <p className="text-xs text-ink-soft">
              Catalogo unificado de clientes B2B, contactos tecnicos y facturacion consolidada.
            </p>
          </div>
          {canPerform(role, "clients.create") && (
            <Button
              onClick={() => {
                setSubmitError(null);
                form.reset();
                setIsCreateOpen(true);
              }}
              className="cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Registrar Cliente
            </Button>
          )}
        </div>
      </div>

      {/* === Body === */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="text-ink-muted mb-2 w-6 h-6" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">
              Cargando cuentas...
            </span>
          </div>
        ) : (
          <ClientList
            items={clients}
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFiltersChange={(f) => {
              setFilters(f);
              setActiveView("custom");
            }}
            activeView={activeView}
            onSelectView={(id) => {
              setActiveView(id);
              setFilters([]);
            }}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSelectClient={setSelectedClientId}
            onCreate={() => {
              setSubmitError(null);
              form.reset();
              setIsCreateOpen(true);
            }}
            error={error}
          />
        )}
      </div>

      {/* Drawer / Sheet modal lateral para detalle de cliente */}
      <Sheet open={selectedClientId !== null} onOpenChange={(open) => { if (!open) setSelectedClientId(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l border-border bg-card text-foreground p-0 shadow-2xl">
          {selectedClient && (
            <ClientDetail
              client={selectedClient}
              onClose={() => setSelectedClientId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* === Create Sheet (preservado del flujo original) === */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="flex flex-col bg-bg-elevated-1 border-l border-line p-0 w-full sm:max-w-xl backdrop-blur-md h-full">
          {/* Header Fijo */}
          <div className="flex-none p-6 md:p-8 border-b border-line bg-bg-elevated-1/80 backdrop-blur-sm z-layer-content">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                // Nueva Cuenta
              </span>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-ink mt-0.5">
                Registrar Cliente B2B
              </h3>
              <p className="text-xs text-ink-muted">
                Ingrese la identificacion tributaria y la razon social legal de la planta.
              </p>
            </div>
          </div>

          {/* Body Scrolleable */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {submitError && (
              <div className="p-3.5 rounded-md bg-state-danger/10 border border-state-danger/20 text-xs text-state-danger font-mono">
                {submitError}
              </div>
            )}

            <Form {...form}>
              <form id="create-client-form" onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground">
                        NIT / Cedula / ID Fiscal
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. 901201567-8"
                          {...field}
                          className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary"
                        />
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
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Razon Social
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Minera Del Roble S.A."
                          {...field}
                          className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-destructive font-mono" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="segment"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Segmento Industrial
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground shadow-inner focus:ring-primary">
                            <SelectValue placeholder="Selecciona el segmento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value="Mineria">Mineria / Siderurgia</SelectItem>
                          <SelectItem value="Alimentos">Alimentos / Farmaceutica</SelectItem>
                          <SelectItem value="Data Center">Data Center / Servidores</SelectItem>
                          <SelectItem value="HVAC Comercial">HVAC Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] text-destructive font-mono" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Correo Electronico Corporativo
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="compras@mineradelroble.co"
                          {...field}
                          className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-destructive font-mono" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {/* Footer Fijo */}
          <div className="flex-none p-6 md:p-8 border-t border-border bg-card/80 backdrop-blur-sm z-10 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
              className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-client-form"
              disabled={submitting}
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4"
            >
              {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              {submitting ? "Registrando..." : "Registrar Cliente"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
