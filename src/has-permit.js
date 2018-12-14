const {authenticate} = require('@feathersjs/authentication').hooks;
const {getItems, replaceItems} = require('feathers-hooks-common');
const Permissions = require('./permisions');
const errors = require('@feathersjs/errors');

module.exports = (function () {

    function HasPermit(options = {}) {
        return async (context) => {
            // If called internally
            if (!context.params.provider)
                return context;

            /*
             * we define default values
             */
            options.admin_role = options.admin_role ? options.admin_role : 'SUPER_ADMIN';
            options.can = options.can && Array.isArray(options.can) ? options.can : [];
            options.mode = options.mode === 'trust' || options.mode === 'strict' ? options.mode : 'strict';

            /*
             * define necessary variables for the system
             */
            const session = await getSession(options, context);
            const permissions = new Permissions(context, options, session);
            const principal_action = context.method !== 'update' && context.method !== 'patch' ? context.method : 'update';
            const user_roles = await permissions.getRoles();
            const async_permissions_process = [];

            let principal_target = null;

            /*
             * we see if the authenticated user has the required permissions
             */
            if (user_roles.filter(it => it.name === options.admin_role).length > 0)
                return context;

            async_permissions_process.push(permissions.getRequiredPermissions('*', '*'));
            async_permissions_process.push(permissions.getRequiredPermissions('*', principal_action));

            if (options.mode === 'strict') {
                async_permissions_process.push(permissions.getRequiredPermissions(context.path, '*'));
                async_permissions_process.push(permissions.getRequiredPermissions(context.path, principal_action));
            }

            for (let a = 0; a < options.can.length; a++) {
                async_permissions_process.push(permissions.getRequiredPermissions(options.can[a].domain, options.can[a].action));
                async_permissions_process.push(permissions.getRequiredPermissions('*', options.can[a].action));
                async_permissions_process.push(permissions.getRequiredPermissions(options.can[a].domain, '*'));
            }

            const all_permissions_requiered = [].concat(...(await Promise.all(async_permissions_process)
                .then(it => {
                    const elements = [].concat(...it);
                    if (elements.filter(element => !element).length > 0) throw new errors.Conflict('the required permits are not found');
                    // console.log(elements.map(x=> { return {domain: x.domain[0].id, action: x.action[0].id}; }));
                    return elements.filter(element => element).map(x => {
                        return {domain: x.domain[0].id, action: x.action[0].id};
                    });
                })));

            const user_permissions = await permissions.getPermissions(all_permissions_requiered)
                .then(it => Array.from(new Set(it.map(element => JSON.stringify(element)))).map(element => JSON.parse(element)));

            let isPermit = 0;
            for (let a = 0; a < user_permissions.length; a++) {
                if (user_permissions[a].domain === '*' && user_permissions[a].action === '*') {
                    isPermit = 2;
                    break;
                }
                if (
                    options.mode === 'strict' &&
                    (
                        user_permissions[a].domain === '*' ||
                        user_permissions[a].domain === context.path
                    ) &&
                    (
                        user_permissions[a].action === '*' ||
                        user_permissions[a].action === principal_action
                    )
                ) {
                    isPermit = 1;
                    break;
                }
            }

            if ((!isPermit && options.mode !== 'strict') || isPermit) {
                isPermit = 2;
                for (let a = 0; a < options.can.length; a++) {
                    if (user_permissions.filter(it => it.domain === options.can[a].domain && it.action === options.can[a].action).length === 0) {
                        isPermit = 0;
                    }
                }
            }

            if (!isPermit) throw new errors.Forbidden('access denied');

            let records = getItems(context);

            if (!records) records = {};

            // get target;
            if (options.mode === 'restrict' && principal_target === '*') {
                return context;
            }
            if (options.mode === 'restrict' && principal_target) {
                if (principal_target === 'self') principal_target = session.id;
                if (isNaN(parseInt(principal_target))) {
                    //
                } else {
                    if ((context.method === 'get' || context.method === 'update' || context.method === 'remove') && context.id && principal_target + '' !== context.id + '') {
                        throw new errors.Forbidden('access denied');
                    } else if (context.method === 'find' && context.method === 'update' && context.method === 'remove' && !context.id) {
                        // if (!Array.isArray(records)) records = [records];
                        records.id = principal_target.split(',').map(x => parseInt(x));
                    }
                }
            }

            // add restrict;

            replaceItems(context, records);

            return context;
        };
    }

    function getSession(options, context) {
        return new Promise(async (resolve, reject) => {
            const contextSession =
                context.params.user ? context : (await authenticate('jwt')(context).catch(() => context));
            const session = contextSession.params.user;

            if (!session && !options.allowAnonymousUsers)
                reject(new errors.NotAuthenticated('the user is not authenticated'));

            resolve(session);
        });
    }

    return HasPermit;
})();
