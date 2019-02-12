import {hasPermit as _hasPermit} from './src/has-permit';
import _Permissions from './src/permisions';

declare module AwesomeFeathersPermissions {
    const hasPermit: _hasPermit;
    const Permissions: _Permissions;
}

export default AwesomeFeathersPermissions;
