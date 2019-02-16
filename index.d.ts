import {HookHashAccess} from './src/give-access-to';
import _Permissions from './src/permisions';

declare namespace PermissionsModule {
    export const HashAccess: HookHashAccess;
    export const Permissions: _Permissions
}

export default PermissionsModule
