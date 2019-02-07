class Permissions {
	constructor(context, options, user) {
		this.context = context;
		this.options = options;
		this.user = user;

		this.roles = null;
	}

	/**
	 * optiene los roles del usuario
	 * @return {Array}
	 */
	async getRoles() {
		const entityRoles = await this.context.app.service('users-roles').find({
			query: {[`${this.options.entity}_id`]: this.user.id, $limit: 10000000000}, paginate: false
		});

		return this.roles = await this.context.app.service('roles').find({
			query: {id: {$in: entityRoles.map(it => it.role_id)}, $limit: 10000000000}, paginate: false
		});
	}

	/**
	 * regresa los permisos existentes dentro de los roles del usuario
	 * @param {Array} permissions - permisos a buscar (si no se envian, se buscaran todos los permisos)
	 * @return {Array}
	 */
	async getPermissions(permissions = []) {
		if (!this.roles) await this.getRoles();

		const query = {};

		if (permissions.length !== 0)
			query['$or'] = permissions.map(it => ({$and: {domain_id: it.domain, action_id: it.action}}));

		const roles_permissions = await this.context.app.service('roles-permissions').find({
			query: {role_id: {$in: this.roles.map(it => it.id)}, $limit: 10000000000}, paginate: false
		});

		return await this.context.app.service('permissions').find({
			query: {id: {$in: roles_permissions.map(it => it.permissions_id)}, query: query.$or, $limit: 10000000000},
			paginate: false
		}).then(it => it.map(it => ({id: it.id, domain: it.domain, action: it.action, target: it.target})));
	}

	/**
	 * verifica que los permisos requeridos existan
	 * @param {string} domain
	 * @param {string} action
	 * @return {Array<Array>|boolean}
	 */
	async getRequiredPermissions(domain, action) {
		const domainPermission = await this.context.app.service('permissions-domains').find({
			query: {name: domain, $limit: 10000000000}, paginate: false
		});

		if (domainPermission.length === 0) return false/*throw errors.Conflict(`no permits are found for the required module: ${domain}`)*/;

		const actionPermission = await this.context.app.service('permissions-actions').find({
			query: {name: action, $limit: 10000000000}, paginate: false
		});

		if (actionPermission.length === 0) return false/*throw errors.Forbidden(`no permits are found for the required action: ${action}`)*/;

		return {domain: domainPermission, action: actionPermission};
	}

	/**
	 * calcula todas las combinaciones posibles de un campo en dos arrays de objetos
	 * @param {Array<JSON>} array1
	 * @param {Array<JSON>} array2
	 * @param {string} field
	 * @return {Array<Array>}
	 */
	getCombinationsField(array1, array2, field = 'id') {
		return array1.map(it1 => array2.map(it2 => [it1[field], it2[field]]));
	}
}

module.exports = Permissions;
