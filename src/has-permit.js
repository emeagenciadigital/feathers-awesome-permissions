const {authenticate} = require('@feathersjs/authentication').hooks;
const {getItems, replaceItems} = require('feathers-hooks-common');
const Permissions = require('./permisions');
const errors = require('@feathersjs/errors');


function getContextSession(context) {
	return context.params.user ? Promise.resolve(context) : (authenticate('jwt')(context).catch(() => context));
}


function getSession(options, context) {
    return getContextSession(context).then(contextSession => {
		const session = contextSession.params.user;

		/*
         * Let's see if anonymous users are allowed and otherwise we get an error.
         */
		if (!session && !options.allowAnonymousUsers)
			return new errors.NotAuthenticated('the user is not authenticated');

        return {contextSession, session};
	});
}

function _hasPermit(userPermissions, options) {
	// get target;
	let isPermit = 0;
	let principalTarget = null;

	for (let a = 0; a < userPermissions.length; a++) {
		if (userPermissions[a].domain === '*' && userPermissions[a].action === '*') {
			isPermit = 2;
			principalTarget = userPermissions[a].target;
			break;
		} else if (
			options.mode === 'strict' &&
			(
				userPermissions[a].domain === '*' ||
				userPermissions[a].domain === options.domain
			) &&
			(
				userPermissions[a].action === '*' ||
                userPermissions[a].action === options.action
			)
		) {
			isPermit = 1;
			principalTarget = userPermissions[a].target;

			break;
		}
	}

	if ((!isPermit && options.mode !== 'strict') || isPermit === 1) {
		isPermit = 2;
		for (let a = 0; a < options.requiredPermissions.length; a++) {
			if (userPermissions.filter(it => it.domain === options.requiredPermissions[a].domain && it.action === options.requiredPermissions[a].action).length === 0) {
				isPermit = 0;
			}
		}
	}

    return {isPermit, principalTarget};
}


const defaultOptions = {
    mode: 'strict',
	adminRole: 'SUPER_ADMIN',
    entity: 'user',
    allowAnonymousUsers: false,
	requiredPermissions: [],
	restrictToOwner: {
		ownerField: 'id',
		otherField: 'id'
	}
};

module.exports.HasPermit = function (_options = {}) {

	const options = Object.assign({}, defaultOptions, _options);

	return (context) => {
		// If called internally
		if (!context.params.provider)
			return Promise.resolve(context);

        return getSession(options, context).then(({contextSession: cs, session}) => {
            const action = {
                find: 'read',
                get: 'read',
                create: 'create',
                update: 'update',
                patch: 'update',
                remove: 'delete'
            }[cs.method];

			const permissions = new Permissions(cs, options, session);

            const async_permissions = [];
            const async_permissions_required = [];

            return permissions.getRoles().then(async roles => {
				/*
                 * we see if the authenticated user has the required permissions
                 */
				if (roles.filter(it => it.name === options.adminRole).length > 0)
					return cs;

                async_permissions.push(permissions.getRequiredPermissions('*', '*'));
                async_permissions.push(permissions.getRequiredPermissions('*', action));

				if (options.mode === 'strict') {
                    async_permissions.push(permissions.getRequiredPermissions(cs.path, '*'));
                    async_permissions_required.push(permissions.getRequiredPermissions(cs.path, action));
				}

				for (let a = 0; a < options.requiredPermissions.length; a++) {
                    async_permissions_required.push(permissions.getRequiredPermissions(options.requiredPermissions[a].domain, options.requiredPermissions[a].action));
                    async_permissions.push(permissions.getRequiredPermissions('*', options.requiredPermissions[a].action));
                    async_permissions.push(permissions.getRequiredPermissions(options.requiredPermissions[a].domain, '*'));
				}

                return Promise.all(async_permissions_required).then(requiredPermissions => {

					requiredPermissions = [].concat(...requiredPermissions);

                    if (requiredPermissions.filter(it => !it).length > 0)
						throw new errors.Conflict('the required permits are not found');

                    requiredPermissions = requiredPermissions
                        .filter(requiredPermissions => requiredPermissions)
                        .map(it => ({domain: it.domain[0].id, action: it.action[0].id}));

                    return Promise.all(async_permissions).then(generalPermissions => {

                        generalPermissions = [].concat(...generalPermissions);

                        generalPermissions = generalPermissions
                            .filter(generalPermissions => generalPermissions)
                            .map(it => ({domain: it.domain[0].id, action: it.action[0].id}));

                        const allPermission = [...generalPermissions, ...requiredPermissions];

                        return permissions.getPermissions(allPermission)
                            .then(async userPermissions => {
                                userPermissions = Array.from(new Set(userPermissions.map(element => JSON.stringify(element)))).map(element => JSON.parse(element));

                                let {isPermit, principalTarget} = _hasPermit(userPermissions, {
                                    ...options,
                                    domain: cs.path,
                                    action: action
                                });

                                if (!isPermit) throw new errors.Forbidden('access denied');

                                let records = getItems(cs);

                                if (!records) records = {};

                                // get target;
                                if (options.mode === 'strict' && principalTarget === '*') {
                                    return cs;
                                }

                                if (options.mode === 'strict' && principalTarget) {
                                    // const targeIsSelf = '';
                                    if (principalTarget === 'self') {

                                        principalTarget = session[options.restrictToOwner.ownerField] + '';
                                    }

                                    if (isNaN(parseInt(principalTarget))) {
                                        throw new errors.Forbidden('access denied');
                                    } else {
                                        if (
                                            (
                                                cs.method === 'get' ||
                                                cs.method === 'update' ||
                                                cs.method === 'patch' ||
                                                cs.method === 'remove'
                                            ) &&
                                            cs.id
                                        ) {
                                            const objectExist = !!(await cs.app.service(cs.path).getModel().findAll({
                                                where: {
                                                    id: cs.id,
                                                    [options.restrictToOwner.otherField]: principalTarget
                                                }
                                            }))[0];

                                            if (!objectExist) throw new errors.Forbidden('access denied');
                                        } else if (
                                            (
                                                cs.method === 'find' ||
                                                cs.method === 'update' ||
                                                cs.method === 'patch' ||
                                                cs.method === 'remove'
                                            ) &&
                                            !cs.id
                                        ) {
                                            // if (!Array.isArray(records)) records = [records];
                                            cs.params.query[options.restrictToOwner.otherField] = {
                                                $in: principalTarget.split(',').map(x => parseInt(x))
                                            };

                                            /*
                                            records[options.restrictToOwner.otherField] = {
                                                $in: principalTarget.split(',').map(x => parseInt(x))
                                            };
                                            */
                                        }
                                    }
                                }

                                replaceItems(cs, records);

                                return cs;
                            });
                    });
				});
			});

		});
	};
};

