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
import { UserSummaryResponse } from '@/generated/api/data-contracts';
import useSidebarState from '@/hooks/useSidebarState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';


export const columns: ColumnDef<UserSummaryResponse>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "email", header: "Correo" },
  { accessorKey: "verified", header: "Verificado", cell: ({getValue}) => getValue() as boolean ? "Sí" : "No" },
  {
    accessorKey: "createdAt",
    header: "Fecha/hora creación",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (!value) return "";
      const date = new Date(value);
      return date.toLocaleString();
    }
  },
  {
    accessorKey: "lastLogin",
    header: "Última conexion",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (!value) return "";
      const date = new Date(value);
      return date.toLocaleString();
    }
  }
]

const UserTable = () => {

  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { userResponse, isLoading } = useUsers(page, recordsPerPage);


  const table = useReactTable({
    data: userResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  useSidebarState()

  const totalPages = userResponse?.metadata?.pages || 1;

  return (
      <div className="w-full">
        {!isLoading && userResponse && (
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
                Página actual: {userResponse.metadata.currentPage} de {userResponse.metadata.pages}
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
  );
};

export default UserTable;