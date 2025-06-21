import { UserDetailResponse } from "@/generated/api/data-contracts"

export interface UserInfoProps {
    user: UserDetailResponse
}

export const UserInfo = (props : UserInfoProps) => {
    return (<div className="flex flex-col gap-2 overflow-y-scroll">
        <div><b>Nombre: </b> <span>{props.user.name}</span></div>
        <div><b>Correo: </b> <span>{props.user.email}</span></div>
        <div><b>Verificado: </b> <span>{props.user.verified? "Si" : "No"}</span></div>
        <div><b>Fecha creación: </b> <span>{new Date(props.user.createdAt).toLocaleString()}</span></div>
        <div><b>Última conexión: </b> <span>{props.user.lastLogin ? new Date(props.user.lastLogin).toLocaleString() : "Sin registros"}</span></div>
        <div>
            <b>Roles:</b>
            <div>
                <ul className="list-disc list-inside">
                    {props.user.roles.map(r => (
                        <li key={r.id}>{r.name}</li>
                    ))}
                </ul>
            </div>
        </div>
        <div>
            <b>Permisos:</b>
            <div>
                <ul className="list-disc list-inside">
                    {props.user.permissions.map(p => (
                        <li key={p}>{p}</li>
                    ))}
                </ul>
            </div>
        </div>
    </div>)
}