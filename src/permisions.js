const defaultOptions = {
    entity: 'user',
    allowAnonymousUsers: false,
    anonymousUserId: 0
};

module.exports.getUserRoles = function (context, options) {

	options = Object.assign({}, defaultOptions, options);

    const {user} = options.allowAnonymousUsers ? {id: options.anonymousUserId} : context.params;

	return new Promise(async resolve => {
        const userRoles = await context.app.service(`users-roles`)
			.find({query: {[`${options.entity}_id`]: user.id, $limit: 10000000000}, paginate: false});

		const roles = await context.app.service('roles')
			.find({query: {id: {$in: userRoles.map(it => it.role_id)}, $limit: 10000000000}, paginate: false});

		resolve(roles);
	});
};

module.exports.getUserPermissions = function (context, options) {

	options = Object.assign({}, options);

	const query = {};

	if (!options.roles || !Array.isArray(options.roles) || options.roles.length === 0) {
		return Promise.resolve([]);
	}

	if (options.permissions && Array.isArray(options.permissions) && options.permissions.length > 0) {
		query.$or = options.permissions.map((it) => ({$and: {domain_id: it.domain, action_id: it.action}}));
	}

	return new Promise(async resolve => {

		const permissionsIds = await context.app.service('roles-permissions')
			.find({query: {role_id: {$in: options.roles.map((it) => it.id)}, $limit: 10000000000}, paginate: false})
			.then((it00) => it00.map((it01) => it01.permissions_id));

		const permissions = await context.app.service('permissions')
			.find({query: {id: {$in: permissionsIds}, ...query, $limit: 10000000000}, paginate: false})
			.then((it01) => it01.map((it02) => ({id: it02.id, domain: it02.domain, action: it02.action, target: it02.target})));

		resolve(permissions);
	});
};

module.exports.getRequiredUserPermissions = function (context, options) {

	options = Object.assign({permissions: []}, options);

	if (!options.roles || !Array.isArray(options.roles) || options.roles.length === 0) {
		return Promise.resolve([]);
	}

	return new Promise(async resolve => {

		const permissions = [];

		for (let value of options.permissions) {
			const domainPermission = await context.app.service('permissions-domains').find({
				query: {name: value.domain, $limit: 10000000000}, paginate: false
			});

			const actionPermission = await context.app.service('permissions-actions').find({
				query: {name: value.action, $limit: 10000000000}, paginate: false
			});

			if (domainPermission.length > 0 && actionPermission.length > 0) {
				permissions.push({domain: domainPermission[0], action: actionPermission[0]});
			} else {
				permissions.push(false);
			}

		}

		resolve(permissions);
	});
};
