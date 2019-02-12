declare interface Permissions {
    getRoles: () => Promise<any>;
    getPermissions: (permissions: any[]) => Promise<any>;
    getRequiredPermissions: (domain: any, action: any) => Promise<any>;
    getCombinationsField: (array1: any[], array2: any[], field: string) => Promise<any>;
}

export default Permissions;
