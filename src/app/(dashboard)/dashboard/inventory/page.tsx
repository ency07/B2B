"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, ArrowRightLeft, Sparkles, Plus } from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import { Spinner } from "@/platform/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/platform/ui/table";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
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
import { getInventoryStock, createInventoryMovement, getWarehouses, createInventoryItem } from "@/erp/actions/core";;

// Zod schema for stock movements
const movementSchema = z.object({
  itemCode: z.string().min(1, { message: "Por favor, selecciona un artículo." }),
  warehouse: z.string().min(1, { message: "Por favor, selecciona la bodega." }),
  type: z.string().min(1, { message: "Por favor, selecciona el tipo de movimiento." }),
  quantity: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "La cantidad debe ser un número entero positivo mayor a 0.",
    }),
  notes: z.string().max(100).optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface StockItem {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  itemCode: string;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  reserved: number;
  available: number;
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isItemSheetOpen, setIsItemSheetOpen] = React.useState(false);
  const [itemSubmitting, setItemSubmitting] = React.useState(false);
  const [itemErrorMsg, setItemErrorMsg] = React.useState<string | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      itemCode: "",
      warehouse: "",
      type: "",
      quantity: "",
      notes: "",
    },
  });

  const itemForm = useForm<any>({
    defaultValues: {
      itemCode: "",
      name: "",
      description: "",
      category: "",
      itemType: "Material",
      unit: "Unidad",
      minimumStock: "0",
      maximumStock: "100",
      reorderPoint: "10",
      initialQuantity: "0",
      warehouseId: "",
    },
  });

  const loadStock = React.useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, whsData] = await Promise.all([
        getInventoryStock(tenantParam),
        getWarehouses(tenantParam),
      ]);
      setStock(stockData);
      setWarehouses(whsData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadStock();
  }, [loadStock]);

  const onSubmit = async (values: MovementFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const formattedType = values.type === "ENTRADA" ? "Entrada" : "Salida";
      await createInventoryMovement(tenantParam, {
        type: formattedType,
        itemCode: values.itemCode,
        quantity: Number(values.quantity),
        notes: values.notes || "",
        sourceWarehouse: values.warehouse,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadStock();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al registrar el movimiento.");
    } finally {
      setSubmitting(false);
    }
  };

  const onItemSubmit = async (values: any) => {
    setItemSubmitting(true);
    setItemErrorMsg(null);
    try {
      const initialQty = Number(values.initialQuantity);
      if (initialQty > 0 && !values.warehouseId) {
        throw new Error("Para registrar stock inicial debes seleccionar una bodega.");
      }
      await createInventoryItem(tenantParam, {
        itemCode: values.itemCode,
        name: values.name,
        description: values.description || "",
        category: values.category,
        itemType: values.itemType,
        unit: values.unit,
        minimumStock: Number(values.minimumStock),
        maximumStock: Number(values.maximumStock),
        reorderPoint: Number(values.reorderPoint),
        initialQuantity: initialQty > 0 ? initialQty : undefined,
        warehouseId: values.warehouseId || undefined,
      });
      setIsItemSheetOpen(false);
      itemForm.reset();
      await loadStock();
    } catch (err: any) {
      console.error(err);
      setItemErrorMsg(err.message || "Ocurrió un error al registrar el artículo.");
    } finally {
      setItemSubmitting(false);
    }
  };

  // Get unique list of items and warehouses for the dropdown selection
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { code: string; name: string }[] = [];
    stock.forEach((s) => {
      if (!seen.has(s.itemCode)) {
        seen.add(s.itemCode);
        list.push({ code: s.itemCode, name: s.itemName });
      }
    });
    return list;
  }, [stock]);

  const uniqueWarehouses = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { code: string; name: string }[] = [];
    stock.forEach((s) => {
      if (!seen.has(s.warehouseCode)) {
        seen.add(s.warehouseCode);
        list.push({ code: s.warehouseCode, name: s.warehouseName });
      }
    });
    return list;
  }, [stock]);

  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: "warehouseName",
      header: "Bodega",
      cell: ({ row }) => <span className="font-semibold text-xs text-foreground">{row.getValue("warehouseName")}</span>,
    },
    {
      accessorKey: "itemCode",
      header: "Código",
      cell: ({ row }) => <code className="text-[11px] font-mono text-foreground/80">{row.getValue("itemCode")}</code>,
    },
    {
      accessorKey: "itemName",
      header: "Descripción",
      cell: ({ row }) => <div className="max-w-xs md:max-w-md truncate font-semibold text-foreground">{row.getValue("itemName")}</div>,
    },
    {
      accessorKey: "quantity",
      header: () => <div className="text-right">Físico</div>,
      cell: ({ row }) => <div className="text-right font-mono text-foreground">{row.getValue("quantity")} u.</div>,
    },
    {
      accessorKey: "reserved",
      header: () => <div className="text-right text-warning">Reservado</div>,
      cell: ({ row }) => <div className="text-right font-mono text-warning">{row.getValue("reserved")} u.</div>,
    },
    {
      accessorKey: "available",
      header: () => <div className="text-right">Disponible</div>,
      cell: ({ row }) => {
        const available = Number(row.getValue("available"));
        const isLow = available < 10;
        return (
          <div className="text-right font-mono font-semibold text-foreground">
            {available} u.
            {isLow && (
              <Badge variant="warning" className="ml-2 text-[8px] py-0 px-1 font-mono uppercase">STOCK BAJO</Badge>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: stock,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Almacenes
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Control de Inventario
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitoreo de existencias de materiales, control de reservas y registro de movimientos de stock.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Sheet for Item Creation */}
          <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
            <Button onClick={() => setIsItemSheetOpen(true)} className="flex items-center gap-2 cursor-pointer bg-primary hover:opacity-90 border-0 text-primary-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4 text-primary-foreground" /> Registrar Artículo
            </Button>
            <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
              <div className="p-8 space-y-6 bg-card">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Almacenes / Catálogo</span>
                  <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Registrar Artículo</h3>
                  <p className="text-xs text-muted-foreground">Registra un nuevo material o repuesto en el catálogo y define su stock inicial.</p>
                </div>

                {itemErrorMsg && (
                  <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                    {itemErrorMsg}
                  </div>
                )}

                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4 pt-2">
                    <FormField
                      control={itemForm.control}
                      name="itemCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Código SKU <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. SKU-VLV-01" className="bg-background border-border text-foreground text-xs" {...field} required />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Nombre <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Válvula de alivio 1/2 pulgada" className="bg-background border-border text-foreground text-xs" {...field} required />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Material de acero inoxidable AISI 316" className="bg-background border-border text-foreground text-xs" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Categoría <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Válvulas, Tubería, Instrumentación" className="bg-background border-border text-foreground text-xs" {...field} required />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="itemType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">Tipo de Artículo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background border-border text-foreground text-xs">
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-border text-foreground">
                                <SelectItem value="Material">Material</SelectItem>
                                <SelectItem value="Herramienta">Herramienta</SelectItem>
                                <SelectItem value="Equipo">Equipo</SelectItem>
                                <SelectItem value="Consumible">Consumible</SelectItem>
                                <SelectItem value="Repuesto">Repuesto</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={itemForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">Unidad de Medida</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Unidad, Metro" className="bg-background border-border text-foreground text-xs" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={itemForm.control}
                        name="minimumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-foreground">Stock Mínimo</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-background border-border text-foreground text-xs font-mono" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={itemForm.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-foreground">Reorden</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-background border-border text-foreground text-xs font-mono" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={itemForm.control}
                        name="maximumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-foreground">Stock Máximo</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-background border-border text-foreground text-xs font-mono" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-border pt-4 mt-2 space-y-4">
                      <h4 className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-bold">// Stock Inicial (Opcional)</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="initialQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-foreground">Cantidad Inicial</FormLabel>
                              <FormControl>
                                <Input type="number" className="bg-background border-border text-foreground text-xs font-mono" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="warehouseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-foreground">Bodega Inicial</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background border-border text-foreground text-xs">
                                    <SelectValue placeholder="Selecciona" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-card border-border text-foreground">
                                  {warehouses.map((wh) => (
                                    <SelectItem key={wh.id} value={wh.id}>
                                      {wh.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                      <Button type="button" variant="outline" onClick={() => setIsItemSheetOpen(false)} disabled={itemSubmitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={itemSubmitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                        {itemSubmitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                        Registrar Artículo
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sheet Slide-out */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
                <ArrowRightLeft className="w-4 h-4" /> Registrar Movimiento
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
              <div className="p-8 space-y-6 bg-card">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Bodega / Stock</span>
                  <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Registrar Transacción</h3>
                  <p className="text-xs text-muted-foreground">Ingresa una entrada o salida física de inventario para una bodega.</p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                    {errorMsg}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    {/* Item Selection */}
                    <FormField
                      control={form.control}
                      name="itemCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Artículo / Insumo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                                <SelectValue placeholder="Selecciona el artículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border text-foreground">
                              {uniqueItems.map((item) => (
                                <SelectItem key={item.code} value={item.code}>
                                  {item.code} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    {/* Warehouse */}
                    <FormField
                      control={form.control}
                      name="warehouse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Bodega Destino</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                                <SelectValue placeholder="Selecciona la bodega" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border text-foreground">
                              {warehouses.map((wh) => (
                                <SelectItem key={wh.code} value={wh.code}>
                                  {wh.name} ({wh.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    {/* Movement Type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Tipo de Movimiento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="ENTRADA">Entrada / Recepción</SelectItem>
                              <SelectItem value="SALIDA">Salida / Consumo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Cantidad Transaccionada</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ej. 10" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Comentarios / Referencia</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. OT-2026-001 o factura N°102" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                      <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                        {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                        Aplicar Movimiento
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filter and table */}
      <div className="space-y-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por artículo..."
            value={(table.getColumn("itemName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("itemName")?.setFilterValue(event.target.value)}
            className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando existencias...</span>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-border bg-accent/40 hover:bg-accent/40">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground py-3">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-accent/30 cursor-pointer border-b border-border/40 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2 px-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                        // No se encontraron artículos en stock.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <div>
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
              </div>
              <div className="flex items-center space-x-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
