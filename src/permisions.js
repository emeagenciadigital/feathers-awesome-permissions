const defaultOptions = {
    entity: 'user',
    allowAnonymousUsers: false,
    anonymousUserId: 0
};

module.exports.getUserRoles = function (ctx, opts) {

	opts = Object.assign({}, defaultOptions, opts);

	const user = opts.allowAnonymousUsers ? {id: opts.anonymousUserId} : opts.user ? opts.user : ctx.params.user;

	return new Promise(async (resolve, reject) => {
		try {
			const userRoles = await ctx.app.service(`users-roles`)
				.find({query: {[`${opts.entity}_id`]: user.id, $limit: 10000000000}, paginate: false});

			const roles = await ctx.app.service('roles')
				.find({query: {id: {$in: userRoles.map(it => it.role_id)}, $limit: 10000000000}, paginate: false});

			resolve(roles);
		} catch (e) {
			reject(e);
		}
	});
};

module.exports.getUserPermissions = function (ctx, opts) {

	opts = Object.assign({}, opts);

	const query = {};

	if (!opts.roles || !Array.isArray(opts.roles) || opts.roles.length === 0) {
		return Promise.resolve([]);
	}

	if (opts.permissions && Array.isArray(opts.permissions) && opts.permissions.length > 0) {
		query.$or = opts.permissions.map((it) => ({$and: {domain_id: it.domain, action_id: it.action}}));
	}

	return new Promise(async (resolve, reject) => {
		try {
			const permissionsIds = await ctx.app.service('roles-permissions')
				.find({query: {role_id: {$in: opts.roles.map((it) => it.id)}, $limit: 10000000000}, paginate: false})
				.then((it00) => it00.map((it01) => it01.permissions_id));

			const permissions = await ctx.app.service('permissions')
				.find({query: {id: {$in: permissionsIds}, ...query, $limit: 10000000000}, paginate: false})
				.then((it01) => it01.map((it02) => ({id: it02.id, domain: it02.domain, action: it02.action, target: it02.target})));

			resolve(permissions);
		} catch (e) {
			reject(e);
		}
	});
};

module.exports.getRequiredUserPermissions = function (ctx, opts) {

	opts = Object.assign({permissions: []}, opts);

	if (!opts.roles || !Array.isArray(opts.roles) || opts.roles.length === 0) {
		return Promise.resolve([]);
	}

	return new Promise(async (resolve, reject) => {
		try {
			const permissions = [];

			for (let value of opts.permissions) {
				const domainPermission = await ctx.app.service('permissions-domains').find({
					query: {name: value.domain, $limit: 10000000000}, paginate: false
				});

				const actionPermission = await ctx.app.service('permissions-actions').find({
					query: {name: value.action, $limit: 10000000000}, paginate: false
				});

				if (domainPermission.length > 0 && actionPermission.length > 0) {
					permissions.push({domain: domainPermission[0], action: actionPermission[0]});
				} else {
					permissions.push(false);
				}
			}

			resolve(permissions);
		} catch (e) {
			reject(e);
		}
	});
};
