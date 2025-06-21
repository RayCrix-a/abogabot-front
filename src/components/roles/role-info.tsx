import { RoleDetailResponse } from "@/generated/api/data-contracts"

export interface RoleInfoProps {
    role: RoleDetailResponse
}

export const RoleInfo = (props : RoleInfoProps) => {
    return (<div className="flex flex-col gap-2 overflow-y-scroll">
        <div><b>Nombre: </b> <span>{props.role.name}</span></div>
        <div><b>Descripción: </b> <span>{props.role.description}</span></div>
        <div>
            <b>Usuarios:</b>
            <div>
                <ul className="list-disc list-inside">
                    {props.role.users.map(u => (
                        <li key={u.id}>{u.name}</li>
                    ))}
                </ul>
            </div>
        </div>
        <div>
            <b>Permisos:</b>
            <div>
                <ul className="list-disc list-inside">
                    {props.role.permissions.map(p => (
                        <li key={p}>{p}</li>
                    ))}
                </ul>
            </div>
        </div>
    </div>)
}