const {getItems, replaceItems} = require('feathers-hooks-common');
const {Forbidden, NotFound} = require('@feathersjs/errors');
const {getSession} = require('./session');
const {getUserRoles, getRequiredUserPermissions, getUserPermissions} = require('./permisions');

const defaultOptions = {
	mode: 'strict',
	adminRole: 'SUPER_ADMIN',
	entity: 'user',
	allowAnonymousUsers: false,
	requiredPermissions: [],
	restrictToOwner: {
		ownerField: 'id',
		otherField: 'id'
	},
	onlyAdmin: false
};

function hasAccess(userPermissions, options) {
	// get target;
    let isPermit = options.mode === 'strict' ? 0 : 1;
	let targets = [];

    if (options.mode !== 'strict') {
        isPermit = 2;
        targets.push('*');
        for (let rp of options.requiredPermissions) {
            if (userPermissions.filter(it02 => (it02.domain === '*' || it02.domain === rp.domain) && (it02.action === '*' || it02.action === rp.action)).length === 0) {
                isPermit = 0;
            }
        }
    } else {
        for (let up of userPermissions) {
            if (up.domain === '*' && up.action === '*') {
                isPermit = 2;
                targets.push(up.target);
            } else if ((up.domain === '*' || up.domain === options.domain) && (up.action === '*' || up.action === options.action)) {
                isPermit = isPermit === 2 ? isPermit : 1;
                targets.push(up.target);
            }
        }
    }

	return {isPermit, targets};
}

module.exports.giveAccessTo = function (options = {}) {
    // default options
    options = Object.assign({}, defaultOptions, options);

    return (context00) => {
        return getSession(options)(context00).then((context01) => {

            // si el llamado es interno no hacemos ninguna validacion y pasamos
            if (!context01.params.provider) {
                return context01;
            }

            return getUserRoles(context01, options).then((userRoles) => {
                // the session is defined
                const session = options.allowAnonymousUsers ? {} : context01.params.user;

                const action = {find: 'read', get: 'read', create: 'create', update: 'update', patch: 'update', remove: 'delete'}[context01.method];
                // const asyncPermissions: any[] = [];
                const asyncPermissionsRequired = [];

                // validation user current
                if (context01.id === 'current') {
                    context01.id = session[options.restrictToOwner.ownerField];
                }

                // verificamos si solo debemos dar acceso a usuarios administradores
                if (userRoles.filter((it) => it.name === options.adminRole).length > 0) {
                    return context01;
                } else if (options.onlyAdmin || (Array.isArray(options.onlyAdmin) && options.onlyAdmin.includes(context01.method))) {
                    throw new Forbidden('access denied');
                }

                /*
                 * fragmento de codigo:
                 *
                 * el sigiente fragmento define los permisos con los que se le podria permitir el acceso al usuario
                 *
                 * nota: vasta con tener uno solo
                 */

                if (options.mode === 'strict') {
                    asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {
                        roles: userRoles,
                        permissions: [{domain: '*', action: '*'}]
                    }));
                    asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {
                        roles: userRoles,
                        permissions: [{domain: '*', action}]
                    }));

                    asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {roles: userRoles, permissions: [{domain: context01.path, action: '*'}]}));
                    asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {roles: userRoles, permissions: [{domain: context01.path, action}]}));

                    for (let a of options.requiredPermissions) {
                        asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {
                            roles: userRoles,
                            permissions: [{domain: '*', action: a.action}]
                        }));
                        asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {
                            roles: userRoles,
                            permissions: [{domain: a.domain, action: '*'}]
                        }));
                        asyncPermissionsRequired.push(getRequiredUserPermissions(context01, {
                            roles: userRoles,
                            permissions: [{domain: a.domain, action: a.action}]
                        }));
                    }
                }

                /*
                 * fin del fragmento
                 */

                return Promise.all(asyncPermissionsRequired).then(requiredPermissions => {

                    requiredPermissions = [].concat(...requiredPermissions);

                    // if (requiredPermissions.filter(it => !it).length > 0) {
                    // 	throw new Forbidden('the required permits are not found');
                    // }

                    requiredPermissions = requiredPermissions
                        .filter(it => it)
                        .map(it => ({domain: it.domain.id, action: it.action.id}));

                    return getUserPermissions(context01, {roles: userRoles, permissions: requiredPermissions}).then(userPermissions => {
                        userPermissions = Array.from(new Set(userPermissions.map(element => JSON.stringify(element)))).map(element => JSON.parse(element));

                        let {isPermit, targets} = hasAccess(userPermissions, {...options, domain: context01.path, action});

                        if (!isPermit) throw new Forbidden('access denied');

                        return new Promise(async resolve => {
                            let records = getItems(context01);

                            if (!records) records = {};

                            // get target;
                            if (targets.includes('*')) {
                                replaceItems(context01, records);
                                resolve(context01);
                            }

                            if (options.mode === 'strict' && targets.length > 0) {

                                let mt = context01.method;

                                if ((mt === 'get' || mt === 'update' || mt === 'patch' || mt === 'remove') && context01.id) {
                                    const thisElement = await context01.app.service(context01.path).get(context01.id);

                                    if (!thisElement) {
                                        throw new NotFound(`${context01.path} not found`);
                                    }

                                    if (
                                        targets.includes('self') &&
                                        thisElement[options.restrictToOwner.otherField] &&
                                        thisElement[options.restrictToOwner.otherField] !== session[options.restrictToOwner.ownerField]
                                    ) {
                                        throw new Forbidden('access denied');
                                    }
                                } else if ((mt === 'find' || mt === 'update' || mt === 'patch' || mt === 'remove') && !context01.id) {

                                    context01.params.query[options.restrictToOwner.otherField] = {
                                        $in: [
                                            ...(targets.filter(it => !isNaN(Number(it))).map(x => Number(x))),
                                            ...(targets.includes('self') ? [session[options.restrictToOwner.ownerField]] : [])
                                        ]
                                    };
                                }
                            }

                            replaceItems(context01, records);

                            console.log('<<----------------------------------------------------------->>');
                            console.log('permiso consedido');

                            resolve(context01);
                        });
                    });
                });
            });
        });
    };
};

