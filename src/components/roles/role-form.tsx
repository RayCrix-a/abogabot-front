import { RoleCreateRequest, RoleDetailResponse, RoleUpdateRequest, UserCreateRequest, UserDetailResponse, UserUpdateRequest } from "@/generated/api/data-contracts"
import { Label } from "@radix-ui/react-label"
import { FormEventHandler, useEffect, useState } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

export interface RoleFormProps {
    role: RoleDetailResponse | null | undefined
    onCreate: (request: RoleCreateRequest) => void
    onUpdate: (id: string, data: RoleUpdateRequest) => void
}



export const RoleForm = (props: RoleFormProps) => {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    useEffect(() => {
        setName(props.role?.name ?? "")
        setDescription(props.role?.description ?? "")
    }, [props.role])


    const isNameValid = () => {
        return name.trim().length > 8
    }
    const isDescriptionValid = () => {
        return description.trim().length > 8
    }

    const isFormValid = (): string[] => {
        const errors: string[] = []
        const isEditing = !!props.role
        if ((!isEditing || name.length) && !isNameValid()) {
            errors.push("El nombre debe tener una extensión mayor o igual a 8")
        }
        if ((!isEditing || description.length) && !isDescriptionValid()) {
            errors.push("La descripción debe tener una extensión mayor o igual a 8")
        }
        return errors
    }

    const onSubmit : FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        setLoading(true)
        const errors = isFormValid()
        setErrors(errors)
        if (!errors.length) {
            if (props.role) {
                const request : RoleUpdateRequest = {
                    name: name.length? name : undefined,
                    description: description.length? description : undefined
                }
                props.onUpdate(props.role.id, request)
            } else {
                const request : RoleCreateRequest = {
                    name,
                    description
                }
                props.onCreate(request)
            }
        } else {
            setLoading(false)
        }
    }

    return (<div className="flex flex-col gap-2 overflow-y-scroll">
        {errors.length > 0 && (
            <div className="text-red-400">
                <div>
                    <b>Errores:</b>
                    <div>
                        <ul className="list-disc list-inside">
                            {errors.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>)}
        <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="name">Nombre: </Label>
                    <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre rol" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="description">Descripción: </Label>
                    <Input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción del rol" />
                </div>
                <div className="mt-2 w-full flex place-content-end">
                    <Button type="submit" disabled={loading}>{props.role? "Actualizar" : "Crear"}</Button>
                </div>
            </div>
        </form>
    </div>)
}