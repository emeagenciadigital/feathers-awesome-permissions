interface TypePermissions {
    getUserRoles: (context: any, options: any) => any;
    getRequiredUserPermissions: (context: any, options: any) => any;
    getUserPermissions: (context: any, options: any) => any;
}

declare type TypeGiveAccessTo = (options: any) => (context: any) => any;
declare type TypeGrantAccessTo = (options: any) => (context: any) => any;
declare type TypeServices = (type: string) => void;

export const Permissions: TypePermissions;
export const giveAccessTo: TypeGiveAccessTo;
export const grantAccessTo: TypeGrantAccessTo;
export const Service: TypeServices;
