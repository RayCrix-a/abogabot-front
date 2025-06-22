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
import { UserCreateRequest, UserSummaryResponse, UserUpdateRequest } from '@/generated/api/data-contracts';
import useSidebarState from '@/hooks/useSidebarState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import CrudSidebar from "../ui/crud-sidebar";
import { UserInfo } from "./user-info";
import { UserForm } from "./user-form";


const UserTable = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { userResponse, useUserInfo, createUser, updateUser, deleteUser, isLoading } = useUsers(page, recordsPerPage);
  const { data: selectedUser } = useUserInfo(selectedUserId)

  const columns: ColumnDef<UserSummaryResponse>[] = [
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
    },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="link" onClick={() => {
                setSelectedUserId(row.original.id)
                setIsViewOpen(true)
            }}>
            Ver
            </Button>
            <Button size="sm" variant="link" onClick={() => {
                setSelectedUserId(row.original.id)
                setIsFormOpen(true)
            }}>
            Editar
            </Button>
            <Button size="sm" variant="link" onClick={() => {
                setSelectedUserId(row.original.id)
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
    data: userResponse?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  useSidebarState()

  const onCreateUser = (request : UserCreateRequest) => {
    createUser(request)
    setIsFormOpen(false)
  }

  const onUpdateUser = (id: string, request : UserUpdateRequest) => {
    updateUser({id, data: request})
    setIsFormOpen(false)
    setSelectedUserId(null)
  }

  const totalPages = userResponse?.metadata?.pages || 1;

  return (
      <div className="w-full">
        <div className="mb-2 w-full flex place-content-end">
            <Button size="sm" onClick={() => {
                setSelectedUserId(null)
                setIsFormOpen(true)
            }}>Nuevo usuario</Button>
        </div>
        {selectedUser && (
            <CrudSidebar title="Detalles de usuario" isOpen={isViewOpen} onClose={() => {
                setSelectedUserId(null)
                setIsViewOpen(false)
            }}>
                <UserInfo user={selectedUser}/>
            </CrudSidebar>
        )}

        {isDeleteDialogOpen && selectedUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                <div className="bg-secondary p-6 rounded shadow-md">
                <p>¿Estás seguro de que deseas eliminar al usuario <b>{selectedUser.name}</b>?</p>
                <div className="flex gap-2 mt-4 justify-end">
                    <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancelar
                    </Button>
                    <Button
                    variant="destructive"
                    onClick={() => {
                        deleteUser(selectedUser.id)
                        setIsDeleteDialogOpen(false);
                        setSelectedUserId(null)
                    }}
                    >
                    Eliminar
                    </Button>
                </div>
                </div>
            </div>
            )}
        
        <CrudSidebar 
            title={selectedUser ? "Actualizar usuario" : "Crear usuario"}
            isOpen={isFormOpen}
            onClose={() => {
            setSelectedUserId(null)
            setIsFormOpen(false)
        }}>
            <UserForm user={selectedUser} onCreate={onCreateUser} onUpdate={onUpdateUser}/>
        </CrudSidebar>
        
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