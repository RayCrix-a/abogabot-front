import { UserCreateRequest, UserDetailResponse, UserUpdateRequest } from "@/generated/api/data-contracts"
import { Label } from "@radix-ui/react-label"
import { FormEventHandler, useEffect, useState } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

export interface UserFormProps {
    user: UserDetailResponse | null | undefined
    onCreate: (request: UserCreateRequest) => void
    onUpdate: (id: string, data: UserUpdateRequest) => void
}



export const UserForm = (props: UserFormProps) => {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [passwordFirst, setPasswordFirst] = useState<string>("")
    const [passwordLast, setPasswordLast] = useState<string>("")
    useEffect(() => {
        setName(props.user?.name ?? "")
        setEmail(props.user?.email ?? "")
    }, [props.user])


    const isNameValid = () => {
        return name.trim().length > 8
    }
    const isEmailValid = () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email)
    }

    const isPasswordValid = () => {
        const passwordRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*-_]{8,}$/;
        return passwordRegEx.test(passwordFirst)
    }

    const passwordMatches = () => {
        return passwordFirst === passwordLast
    }

    const isFormValid = (): string[] => {
        const errors: string[] = []
        const isEditing = !!props.user
        if ((!isEditing || name.length) && !isNameValid()) {
            errors.push("El nombre debe tener una extensión mayor o igual a 8")
        }
        if ((!isEditing || email.length) && !isEmailValid()) {
            errors.push("El correo debe ser válido")
        }
        if ((!isEditing || passwordFirst.length)) {
            if (!isPasswordValid()) {
                errors.push("Contraseña debe tener una extensión mínima de 8, contener letras, números y carácteres especiales")
            }
            if (!passwordMatches()) {
                errors.push("Contraseñas no coinciden")
            }

        }
        return errors
    }

    const onSubmit : FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        setLoading(true)
        const errors = isFormValid()
        setErrors(errors)
        if (!errors.length) {
            if (props.user) {
                const request : UserUpdateRequest = {
                    name: name.length? name : undefined,
                    email: email.length? email : undefined,
                    password: passwordFirst.length? passwordFirst : undefined
                }
                props.onUpdate(props.user.id, request)
            } else {
                const request : UserCreateRequest = {
                    name,
                    email,
                    password: passwordFirst
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
                    <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="email">Correo: </Label>
                    <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="passwordFirst">Contraseña: </Label>
                    <Input type="password" id="passwordFirst" value={passwordFirst} onChange={(e) => setPasswordFirst(e.target.value)} placeholder="Contraseña" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="passwordLast">Confirme: </Label>
                    <Input type="password" id="passwordLast" value={passwordLast} onChange={(e) => setPasswordLast(e.target.value)} placeholder="Contraseña" />
                </div>
                <div className="mt-2 w-full flex place-content-end">
                    <Button type="submit" disabled={loading}>{props.user? "Actualizar" : "Crear"}</Button>
                </div>
            </div>
        </form>
    </div>)
}