# CTA + FORMULARIO + FOOTER

---

## 11. CTA FINAL — Llamada a la Acción

### Filosofía

Después de 10 secciones de evidencia, el visitante está convencido. Ahora necesita un **empujón final** claro y directo.

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative overflow-hidden">
  <!-- Gradiente de fondo -->
  <div class="absolute inset-0 bg-gradient-to-b from-zinc-950 via-primary/5 to-zinc-950" />
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

  <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <!-- Badge -->
    <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
      <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span class="text-xs font-medium text-primary">Consulta técnica sin costo</span>
    </div>

    <!-- Headline -->
    <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
      ¿Listo para optimizar
      <span class="text-primary"> su planta?</span>
    </h2>

    <!-- Subheadline -->
    <p class="mt-6 text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
      Agende una visita técnica sin costo. Nuestros ingenieros evaluarán
      su espacio y le entregarán un diagnóstico preliminar en 48 horas.
    </p>

    <!-- CTAs -->
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button size="lg" class="px-8 py-4 text-base">
        Solicitar visita técnica
        <ArrowRight class="w-5 h-5 ml-2" />
      </Button>
      <Button variant="outline" size="lg" class="px-8 py-4 text-base">
        <Phone class="w-5 h-5 mr-2" />
        +57 (1) 234 5678
      </Button>
    </div>

    <!-- Trust indicators -->
    <div class="mt-12 flex flex-wrap items-center justify-center gap-8">
      <div class="flex items-center gap-2">
        <Shield class="w-4 h-4 text-zinc-500" />
        <span class="text-xs text-zinc-500">Sin compromiso</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-zinc-500" />
        <span class="text-xs text-zinc-500">Respuesta en 24h</span>
      </div>
      <div class="flex items-center gap-2">
        <MapPin class="w-4 h-4 text-zinc-500" />
        <span class="text-xs text-zinc-500">Cobertura nacional</span>
      </div>
      <div class="flex items-center gap-2">
        <Award class="w-4 h-4 text-zinc-500" />
        <span class="text-xs text-zinc-500">ISO 9001:2015</span>
      </div>
    </div>
  </div>
</section>
```

### Reglas del CTA

| Regla | Detalle |
|---|---|
| Fondo | Gradiente sutil `via-primary/5` + glow `bg-primary/5 blur-3xl` |
| Badge | `border-primary/20 bg-primary/5`, dot con `animate-pulse` |
| Headline | Outfit `text-3xl lg:text-5xl`, span en color primario |
| CTAs | Primario: "Solicitar visita técnica". Secundario: teléfono directo |
| Trust indicators | 4 items con iconos `w-4 h-4 text-zinc-500` |
| Max-width | `max-w-4xl` para mantener foco |
| Centrado | `text-center`, `items-center justify-center` |

---

## 12. FORMULARIO — Captación de Lead

### Filosofía

El formulario es el **punto de conversión**. Debe ser rápido, claro y transmitir confianza. No pedir más de lo necesario.

### Estructura

```
<section id="contacto" class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-12">

      <!-- Columna izquierda: Info (40%) -->
      <div class="lg:col-span-2 space-y-8">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Contacto</p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight leading-tight">
            Cuéntenos su
            <span class="text-primary"> proyecto</span>
          </h2>
          <p class="mt-4 text-base text-zinc-400 leading-relaxed">
            Complete el formulario y un ingeniero especialista se pondrá
            en contacto en menos de 24 horas hábiles.
          </p>
        </div>

        <!-- Info de contacto -->
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <Phone class="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p class="text-xs text-zinc-500">Teléfono</p>
              <p class="text-sm font-medium text-zinc-100">+57 (1) 234 5678</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <Mail class="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p class="text-xs text-zinc-500">Correo</p>
              <p class="text-sm font-medium text-zinc-100">ingenieria@aeromax.com</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <MessageCircle class="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p class="text-xs text-zinc-500">WhatsApp</p>
              <p class="text-sm font-medium text-zinc-100">+57 310 234 5678</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <MapPin class="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p class="text-xs text-zinc-500">Oficina principal</p>
              <p class="text-sm font-medium text-zinc-100">Bogotá, Colombia</p>
            </div>
          </div>
        </div>

        <!-- Horario -->
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <p class="text-sm font-medium text-zinc-100 mb-2">Horario de atención</p>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">Lunes a Viernes</span>
              <span class="font-mono text-zinc-300">07:00 — 18:00</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">Sábados</span>
              <span class="font-mono text-zinc-300">08:00 — 13:00</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Formulario (60%) -->
      <div class="lg:col-span-3">
        <div class="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-8">
          <form class="space-y-6">
            <!-- Row 1: Nombre + Empresa -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">
                  Nombre completo <span class="text-red-400">*</span>
                </label>
                <Input placeholder="Su nombre" />
              </div>
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">
                  Empresa <span class="text-red-400">*</span>
                </label>
                <Input placeholder="Nombre de su empresa" />
              </div>
            </div>

            <!-- Row 2: Correo + Teléfono -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">
                  Correo electrónico <span class="text-red-400">*</span>
                </label>
                <Input type="email" placeholder="correo@empresa.com" />
              </div>
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">
                  Teléfono <span class="text-red-400">*</span>
                </label>
                <Input type="tel" placeholder="+57 310 000 0000" />
              </div>
            </div>

            <!-- Row 3: Sector + Servicio -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">Sector industrial</label>
                <Select>
                  <option value="">Seleccione su sector</option>
                  <option>Minería</option>
                  <option>Siderurgia</option>
                  <option>Data Centers</option>
                  <option>Manufactura</option>
                  <option>Alimentos</option>
                  <option>Química</option>
                  <option>Otro</option>
                </Select>
              </div>
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">Servicio de interés</label>
                <Select>
                  <option value="">Seleccione un servicio</option>
                  <option>Diseño e instalación nueva</option>
                  <option>Reemplazo de equipo</option>
                  <option>Mantenimiento</option>
                  <option>Auditoría energética</option>
                  <option>Consultoría técnica</option>
                </Select>
              </div>
            </div>

            <!-- Row 4: Descripción -->
            <div>
              <label class="text-sm font-medium text-zinc-300 mb-2 block">
                Describa su necesidad
              </label>
              <Textarea
                placeholder="Cuéntenos sobre su planta, el problema de ventilación que enfrenta, dimensiones aproximadas..."
                rows={4}
              />
            </div>

            <!-- Row 5: Adjuntar archivo -->
            <div>
              <label class="text-sm font-medium text-zinc-300 mb-2 block">
                Adjuntar plano o documento (opcional)
              </label>
              <div class="flex items-center justify-center w-full h-24 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors cursor-pointer">
                <div class="flex flex-col items-center gap-2">
                  <Upload class="w-5 h-5 text-zinc-500" />
                  <span class="text-xs text-zinc-500">PDF, DWG, JPG — Máx 10MB</span>
                </div>
              </div>
            </div>

            <!-- Checkbox -->
            <div class="flex items-start gap-3">
              <Checkbox id="privacy" />
              <label htmlFor="privacy" class="text-xs text-zinc-400 leading-relaxed">
                Acepto la política de tratamiento de datos y autorizo a AeroMax
                para contactarme sobre mi solicitud.
              </label>
            </div>

            <!-- Submit -->
            <Button size="lg" class="w-full">
              Enviar solicitud
              <Send class="w-5 h-5 ml-2" />
            </Button>

            <!-- Nota -->
            <p class="text-xs text-zinc-500 text-center">
              Respuesta garantizada en menos de 24 horas hábiles
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Reglas del formulario

| Regla | Detalle |
|---|---|
| Layout | 40/60 (info/formulario) en desktop |
| Campos obligatorios | Nombre, Empresa, Correo, Teléfono (marcados con `*` rojo) |
| Campos opcionales | Sector, Servicio, Descripción, Archivo |
| Validación | Zod en tiempo real (`onChange` + `onBlur`) |
| Adjuntar | Drop zone con `border-dashed`, acepta PDF/DWG/JPG |
| Checkbox | Política de datos obligatoria |
| Submit | `w-full`, con icono `Send` |
| Nota | "Respuesta garantizada en menos de 24 horas hábiles" |
| Info de contacto | 4 items con iconos en `w-10 h-10 rounded-lg` |
| Horario | Caja con `border-zinc-800/60`, valores en `font-mono` |

---

## 13. FOOTER

### Estructura

```
<footer class="border-t border-zinc-800/40 bg-zinc-950">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

      <!-- Brand -->
      <div class="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
        <img src="/logo.svg" alt="AeroMax" class="h-8 mb-4" />
        <p class="text-sm text-zinc-400 leading-relaxed max-w-xs">
          Ingeniería de ventilación industrial.
          Diseño, fabricación e instalación de sistemas
          de extracción y climatización para LATAM.
        </p>
        <!-- Social -->
        <div class="flex items-center gap-3 mt-6">
          <a class="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center hover:bg-zinc-700/60 transition-colors">
            <Linkedin class="w-4 h-4 text-zinc-400" />
          </a>
          <a class="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center hover:bg-zinc-700/60 transition-colors">
            <Youtube class="w-4 h-4 text-zinc-400" />
          </a>
          <a class="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center hover:bg-zinc-700/60 transition-colors">
            <Instagram class="w-4 h-4 text-zinc-400" />
          </a>
        </div>
      </div>

      <!-- Columna: Productos -->
      <div>
        <h4 class="text-sm font-semibold text-zinc-100 mb-4">Productos</h4>
        <ul class="space-y-3">
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Extractores Axiales</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Extractores Centrífugos</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Inyectores</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Ciclones</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Dampers</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Accesorios</a></li>
        </ul>
      </div>

      <!-- Columna: Servicios -->
      <div>
        <h4 class="text-sm font-semibold text-zinc-100 mb-4">Servicios</h4>
        <ul class="space-y-3">
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Simulación CFD</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Diseño aerodinámico</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Instalación</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Mantenimiento</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Auditoría energética</a></li>
        </ul>
      </div>

      <!-- Columna: Empresa -->
      <div>
        <h4 class="text-sm font-semibold text-zinc-100 mb-4">Empresa</h4>
        <ul class="space-y-3">
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Nosotros</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Casos de éxito</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Blog</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Certificaciones</a></li>
          <li><a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Portal cliente</a></li>
        </ul>
      </div>

      <!-- Columna: Contacto -->
      <div>
        <h4 class="text-sm font-semibold text-zinc-100 mb-4">Contacto</h4>
        <ul class="space-y-3">
          <li class="flex items-center gap-2">
            <Phone class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span class="text-sm text-zinc-400">+57 (1) 234 5678</span>
          </li>
          <li class="flex items-center gap-2">
            <Mail class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span class="text-sm text-zinc-400">ingenieria@aeromax.com</span>
          </li>
          <li class="flex items-center gap-2">
            <MessageCircle class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span class="text-sm text-zinc-400">WhatsApp</span>
          </li>
          <li class="flex items-center gap-2">
            <MapPin class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span class="text-sm text-zinc-400">Bogotá, Colombia</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-12 pt-8 border-t border-zinc-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-xs text-zinc-500">
        © {year} AeroMax Industrial. Todos los derechos reservados.
      </p>
      <div class="flex items-center gap-6">
        <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Términos y condiciones</a>
        <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Política de privacidad</a>
        <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Política de cookies</a>
      </div>
    </div>
  </div>
</footer>
```

### Reglas del footer

| Regla | Detalle |
|---|---|
| Columnas | 5 en desktop (brand + 4 links), 4 en tablet, 2 en mobile |
| Brand | Logo `h-8`, descripción `max-w-xs`, social icons |
| Social | `w-9 h-9 rounded-lg`, fondo `bg-zinc-800/60`, hover `bg-zinc-700/60` |
| Links | `text-sm text-zinc-400`, hover `text-zinc-100` |
| Contacto | Iconos `w-3.5 h-3.5 text-zinc-500` |
| Bottom bar | `border-t border-zinc-800/40`, legal links `text-xs text-zinc-500` |
| Padding | `py-16` para el contenido, `pt-8` para bottom bar |

---

## Resumen de la landing completa

| # | Sección | Altura aprox | Propósito |
|---|---|---|---|
| 00 | Navbar | 64px (sticky) | Navegación + CTA "Cotizar" |
| 01 | Hero | 100vh | Impacto + Video + Stats |
| 02 | Trust Bar | ~120px | Logos de clientes |
| 03 | Problema | ~600px | Pain points con métricas |
| 04 | Solución | ~700px | 5 soluciones + visual técnico |
| 05 | Sectores | ~500px | 6 industrias con imágenes |
| 06 | Servicios | ~1200px | 6 servicios alternantes |
| 07 | Productos | ~800px | Catálogo técnico + filtros |
| 08 | Casos de éxito | ~700px | 1 destacado + 3 secundarios |
| 09 | Proceso | ~400px | 6 pasos timeline |
| 10 | Calculadora | ~600px | CFM en vivo |
| 11 | CTA Final | ~400px | Llamada a la acción |
| 12 | Formulario | ~700px | Captación de lead |
| 13 | Footer | ~400px | Info + links + legal |
| | **Total** | **~7000px** | **Scroll completo** |
