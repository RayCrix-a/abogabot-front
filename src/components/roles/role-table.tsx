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
import { RoleCreateRequest, RoleSummaryResponse, RoleUpdateRequest } from '@/generated/api/data-contracts';
import useSidebarState from '@/hooks/useSidebarState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoles } from "@/hooks/useRoles";
import CrudSidebar from "../ui/crud-sidebar";
import { RoleInfo } from "./role-info";
import { RoleForm } from "./role-form";


const RoleTable = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { roleResponse, useRoleInfo, createRole, updateRole, deleteRole, isLoading } = useRoles(page, recordsPerPage);
  const {data: selectedRole } = useRoleInfo(selectedRoleId)


   const columns: ColumnDef<RoleSummaryResponse>[] = [
    { accessorKey: "id", header: "Id" },
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "description", header: "Descripción" },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="link" onClick={() => {
                setSelectedRoleId(row.original.id)
                setIsViewOpen(true)
            }}>
            Ver
            </Button>
             <Button size="sm" variant="link" onClick={() => {
                setSelectedRoleId(row.original.id)
                setIsFormOpen(true)
            }}>
            Editar
            </Button>
            <Button size="sm" variant="link" onClick={() => {
                setSelectedRoleId(row.original.id)
                setIsDeleteDialogOpen(true)
            }}>
            Eliminar
            </Button>
        </div>
        ),
        enableSorting: false,
        enableHiding: false,
    }
  ]

  const table = useReactTable({
    data: roleResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  useSidebarState()

  const onCreateRole = (request : RoleCreateRequest) => {
      createRole(request)
      setIsFormOpen(false)
    }
  
    const onUpdateRole = (id: string, request : RoleUpdateRequest) => {
      updateRole({id, data: request})
      setIsFormOpen(false)
      setSelectedRoleId(null)
    }

  const totalPages = roleResponse?.metadata?.pages || 1;

  return (
      <div className="w-full">
        <div className="mb-2 w-full flex place-content-end">
            <Button size="sm" onClick={() => {
                setSelectedRoleId(null)
                setIsFormOpen(true)
            }}>Nuevo rol</Button>
        </div>
        {selectedRole && (
            <CrudSidebar title="Detalles de rol" isOpen={isViewOpen} onClose={() => {
                setSelectedRoleId(null)
                setIsViewOpen(false)
            }}>
                <RoleInfo role={selectedRole}/>
            </CrudSidebar>
        )}

        {isDeleteDialogOpen && selectedRole && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                <div className="bg-secondary p-6 rounded shadow-md">
                <p>¿Estás seguro de que deseas eliminar al rol <b>{selectedRole.name}</b>?</p>
                <div className="flex gap-2 mt-4 justify-end">
                    <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancelar
                    </Button>
                    <Button
                    variant="destructive"
                    onClick={() => {
                        deleteRole(selectedRole.id)
                        setIsDeleteDialogOpen(false);
                        setSelectedRoleId(null)
                    }}
                    >
                    Eliminar
                    </Button>
                </div>
                </div>
            </div>
            )}
        
        <CrudSidebar 
            title={selectedRole ? "Actualizar rol" : "Crear rol"}
            isOpen={isFormOpen}
            onClose={() => {
            setSelectedRoleId(null)
            setIsFormOpen(false)
        }}>
            <RoleForm role={selectedRole} onCreate={onCreateRole} onUpdate={onUpdateRole}/>
        </CrudSidebar>
        {!isLoading && roleResponse && (
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
                Página actual: {roleResponse.metadata.currentPage} de {roleResponse.metadata.pages}
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

export default RoleTable;