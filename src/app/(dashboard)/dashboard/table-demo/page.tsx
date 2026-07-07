"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Sparkles, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Checkbox } from "@/platform/ui/checkbox";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/platform/ui/table";

// Mock client data matching typical B2B ERP schemas
const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    taxId: "000.000.001-1",
    name: "Cliente Demo Industrial S.A.",
    segment: "Industrial",
    totalInvoiced: 450200.5,
    status: "ACTIVO",
  },
  {
    id: "2",
    taxId: "000.000.002-2",
    name: "Cliente Demo Logistico S.A.",
    segment: "Corporativo",
    totalInvoiced: 890450.0,
    status: "ACTIVO",
  },
  {
    id: "3",
    taxId: "COR851015AB4",
    name: "Distribuidora Comercial del Centro",
    segment: "Comercial",
    totalInvoiced: 125000.75,
    status: "SUSPENDIDO",
  },
  {
    id: "4",
    taxId: "STE770214MX9",
    name: "Siderúrgica del Norte",
    segment: "Industrial",
    totalInvoiced: 2350000.0,
    status: "ACTIVO",
  },
  {
    id: "5",
    taxId: "TEC010311CD3",
    name: "Tecnología y Redes del Pacífico",
    segment: "Comercial",
    totalInvoiced: 78400.0,
    status: "PENDIENTE",
  },
  {
    id: "6",
    taxId: "MET891102EE8",
    name: "Metales de Occidente",
    segment: "Industrial",
    totalInvoiced: 520100.0,
    status: "ACTIVO",
  },
  {
    id: "7",
    taxId: "LOG990424GH9",
    name: "Logística y Puertos Marítimos",
    segment: "Corporativo",
    totalInvoiced: 145000.0,
    status: "SUSPENDIDO",
  },
];

export interface Client {
  id: string;
  taxId: string;
  name: string;
  segment: "Industrial" | "Corporativo" | "Comercial";
  totalInvoiced: number;
  status: "ACTIVO" | "SUSPENDIDO" | "PENDIENTE";
}

// Columns definition for TanStack Table
export const columns: ColumnDef<Client>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "taxId",
    header: "RFC / Identificación",
    cell: ({ row }) => <code className="text-xs font-mono">{row.getValue("taxId")}</code>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold transition-colors"
        >
          Cliente
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "segment",
    header: "Segmento",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.getValue("segment")}</span>
    ),
  },
  {
    accessorKey: "totalInvoiced",
    header: () => <div className="text-right font-semibold">Facturación Acum.</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalInvoiced"));

      // Format the amount as currency
      const formatted = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(amount);

      return <div className="text-right font-mono font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "success" | "warning" | "destructive" | "info" | "secondary" = "secondary";

      if (status === "ACTIVO") variant = "success";
      if (status === "PENDIENTE") variant = "warning";
      if (status === "SUSPENDIDO") variant = "destructive";

      return (
        <Badge variant={variant} className="font-semibold text-[10px]">
          {status}
        </Badge>
      );
    },
  },
];

export default function TableDemoPage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: MOCK_CLIENTS,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Demo de Tablas UI-07
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Cartera de Clientes B2B
        </h1>
        <p className="text-sm text-muted-foreground">
          Tabla interactiva robusta construida con TanStack Table. Soporta ordenación, búsqueda
          por filtros, selección múltiple para acciones en bloque y paginación integrada.
        </p>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar clientes por nombre..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-9"
          />
        </div>

        {/* Selected Rows Counter & Bulk Actions */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button size="sm" variant="destructive" className="ml-2">
              Suspender Clientes
            </Button>
          )}
        </div>
      </div>

      {/* Table Shell */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
