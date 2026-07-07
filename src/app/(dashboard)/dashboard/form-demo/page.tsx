"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, CheckCircle2, User, Mail, Shield, FileText } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/ui/form";
import { Input } from "@/platform/ui/input";
import { Textarea } from "@/platform/ui/textarea";
import { Checkbox } from "@/platform/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/platform/ui/select";
import { Button } from "@/platform/ui/button";
import { Badge } from "@/platform/ui/badge";

// Form validation schema with Zod
const formSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "El nombre completo debe tener al menos 3 caracteres." })
    .max(50, { message: "El nombre completo no puede superar los 50 caracteres." }),
  email: z.string().email({ message: "Por favor, ingresa un correo electrónico válido." }),
  role: z.string().min(1, { message: "Por favor, selecciona un rol para el usuario." }),
  notes: z
    .string()
    .max(200, { message: "Las notas adicionales no pueden superar los 200 caracteres." })
    .optional(),
  notifyOnSLA: z.boolean(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones de seguridad del ERP.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormDemoPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitData, setSubmitData] = React.useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "",
      notes: "",
      notifyOnSLA: false,
      acceptTerms: false,
    },
  });

  function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitData(values);
      form.reset({
        fullName: "",
        email: "",
        role: "",
        notes: "",
        notifyOnSLA: false,
        acceptTerms: false,
      });
      // Clear success notification after 5 seconds
      setTimeout(() => setSubmitData(null), 5000);
    }, 1500);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Demo de Formulario UI-06
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Gestión de Usuarios ERP
        </h1>
        <p className="text-sm text-muted-foreground">
          Formulario interactivo completo con validaciones en tiempo de ejecución, soporte
          de accesibilidad total y diseño adaptable al White Label activo.
        </p>
      </div>

      {/* Success Banner */}
      {submitData && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-success/20 bg-success/5 text-success animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">¡Usuario registrado con éxito!</h4>
            <p className="text-xs opacity-90">
              El usuario {submitData.fullName} ({submitData.email}) ha sido guardado
              con el rol de {submitData.role}.
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <User className="w-4 h-4 opacity-70" /> Nombre Completo
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan Pérez" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ingresa el nombre completo tal como figura en su documento de identidad.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Address */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 opacity-70" /> Correo Electrónico
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan.perez@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role / Group Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 opacity-70" /> Rol Operativo
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el rol corporativo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALMACENISTA">Almacenista / Logística</SelectItem>
                      <SelectItem value="JEFE_INVENTARIO">Jefe de Inventario</SelectItem>
                      <SelectItem value="AUXILIAR_FINANZAS">Auxiliar de Finanzas</SelectItem>
                      <SelectItem value="JEFE_FINANZAS">Jefe de Finanzas</SelectItem>
                      <SelectItem value="GERENTE">Gerente de Sucursal</SelectItem>
                      <SelectItem value="GERENTE_GENERAL">Gerente General / Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define los permisos de acceso y políticas RLS del usuario en la base de datos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 opacity-70" /> Notas de Auditoría
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agrega comentarios o justificación de creación si es necesario..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkbox: SLA Notification */}
            <FormField
              control={form.control}
              name="notifyOnSLA"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 bg-muted/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Alertas de Incumplimiento de SLA
                    </FormLabel>
                    <FormDescription>
                      Recibir notificaciones críticas en Telegram y correo electrónico cuando se acerque el límite de entrega.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Checkbox: Terms Acceptance */}
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-normal text-muted-foreground text-xs">
                        Acepto los lineamientos de gobernanza, auditoría avanzada y políticas de
                        seguridad física de este ERP B2B.
                      </FormLabel>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Limpiar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Crear Registro
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
