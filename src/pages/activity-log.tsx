import MainLayout from '@/components/layout/MainLayout';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityLogResponse } from '@/generated/api/data-contracts';
import { useActivityLog } from '@/hooks/useActivityLog';
import useSidebarState from '@/hooks/useSidebarState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export const columns: ColumnDef<ActivityLogResponse>[] = [
  {
    accessorKey: "createdAt",
    header: "Fecha/hora",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (!value) return "";
      const date = new Date(value);
      return date.toLocaleString();
    }
  },
  {
    accessorKey: "userId",
    header: "Id usuario"
  },
  {
    accessorKey: "email",
    header: "Correo"
  },
  {
    accessorKey: "action",
    header: "Acción"
  }, {
    accessorKey: "resource",
    header: "Recurso"
  },
]

const ActivityLogPage = () => {

  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { activityLogResponse, isLoading, error } = useActivityLog(page, recordsPerPage);


  const table = useReactTable({
    data: activityLogResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  useSidebarState()

  const totalPages = activityLogResponse?.metadata?.pages || 1;

  return (
    <MainLayout title="Registro de actividad" description="Consulta uso del sistema">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Registro de actividad</h1>
        <p className="text-gray-400">
          Revise la actividad realizada en el sistema
        </p>
      </div>
      <div className="w-full">
        {!isLoading && !error && activityLogResponse && (
          <>
            <div className="rounded-md border">
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
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                Página actual: {activityLogResponse.metadata.currentPage} de {activityLogResponse.metadata.pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
                <Select
                  defaultValue={String(recordsPerPage)}
                  onValueChange={(v) => {
                    setRecordsPerPage(Number(v));
                    setPage(1); // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Registros por página" />
                  </SelectTrigger>
                  <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} por página
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
            </div></>)}
      </div>
    </MainLayout>
  );
};

export default withAuthenticationRequired(ActivityLogPage);