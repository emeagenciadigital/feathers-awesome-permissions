const {authenticate} = require('@feathersjs/authentication').hooks;
const {getItems, replaceItems} = require('feathers-hooks-common');
const Permissions = require('./permisions');
const errors = require('@feathersjs/errors');


function getContexSession(context) {
	return context.params.user ? Promise.resolve(context) : (authenticate('jwt')(context).catch(() => context));
}


function getSession(options, context) {
	return getContexSession(context).then(contextSession => {
		const session = contextSession.params.user;

		/*
         * Let's see if anonymous users are allowed and otherwise we get an error.
         */
		if (!session && !options.allowAnonymousUsers)
			return new errors.NotAuthenticated('the user is not authenticated');

		return [contextSession, session];
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

	return [isPermit, principalTarget];
}


module.exports.HasPermit = function (options = {}) {
	return (context) => {
		// If called internally
		if (!context.params.provider)
			return Promise.resolve(context);

		/*
         * we define default values
         */
		options.adminRole = options.adminRole ? options.adminRole : 'SUPER_ADMIN';
		options.userService = options.userService ? options.userService : 'users';
		options.mode = options.mode === 'trust' || options.mode === 'strict' ? options.mode : 'strict';
		options.requiredPermissions = options.requiredPermissions && Array.isArray(options.requiredPermissions) ? options.requiredPermissions : [];
		options.restrictToOwner = options.restrictToOwner ? options.restrictToOwner : {
			ownerField: 'id',
			otherField: 'id'
		};
		options.restrictToOwner.ownerField = options.restrictToOwner.ownerField ? options.restrictToOwner.ownerField : 'id';
		options.restrictToOwner.otherField = options.restrictToOwner.otherField ? options.restrictToOwner.otherField : 'id';

		return getSession(options, context).then(resultSession => {
			const cs = resultSession[0]; // contextSession
			const session = resultSession[1];

			const principalAction = cs.method !== 'update' && cs.method !== 'patch' ? cs.method : 'update';
			const permissions = new Permissions(cs, options, session);
			const async_permissions_process = [];

			return permissions.getRoles().then(roles => {
				/*
                 * we see if the authenticated user has the required permissions
                 */
				if (roles.filter(it => it.name === options.adminRole).length > 0)
					return cs;

				async_permissions_process.push(permissions.getRequiredPermissions('*', '*'));
				async_permissions_process.push(permissions.getRequiredPermissions('*', principalAction));

				if (options.mode === 'strict') {
					async_permissions_process.push(permissions.getRequiredPermissions(cs.path, '*'));
					async_permissions_process.push(permissions.getRequiredPermissions(cs.path, principalAction));
				}

				for (let a = 0; a < options.requiredPermissions.length; a++) {
					async_permissions_process.push(permissions.getRequiredPermissions(options.requiredPermissions[a].domain, options.requiredPermissions[a].action));
					async_permissions_process.push(permissions.getRequiredPermissions('*', options.requiredPermissions[a].action));
					async_permissions_process.push(permissions.getRequiredPermissions(options.requiredPermissions[a].domain, '*'));
				}

				return Promise.all(async_permissions_process).then(requiredPermissions => {
					requiredPermissions = [].concat(...requiredPermissions);

					if (requiredPermissions.filter(requiredPermissions => !requiredPermissions).length > 0)
						throw new errors.Conflict('the required permits are not found');

					requiredPermissions = requiredPermissions.filter(requiredPermissions => requiredPermissions).map(it => {
						return {domain: it.domain[0].id, action: it.action[0].id};
					});

					return permissions.getPermissions(requiredPermissions)
						.then(async userPermissions => {
							userPermissions = Array.from(new Set(userPermissions.map(element => JSON.stringify(element)))).map(element => JSON.parse(element));


							let isPermit;
							let principalTarget;

							[isPermit, principalTarget] = _hasPermit(userPermissions, {
								...options,
								domain: cs.path,
								action: principalAction
							});

							if (!isPermit) throw new errors.Forbidden('access denied');

							let records = getItems(cs);

							if (!records) records = {};

							// get target;
                            if (options.mode === 'strict' && principalTarget === '*') {
								return cs;
							}

							if (options.mode === 'strict' && principalTarget) {
								const targeIsSelf = '';
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
											where: {id: cs.id, [options.restrictToOwner.otherField]: principalTarget}
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
	};
};

