// Hooks for service `permissions`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common');

const {giveAccessTo} = require('../../../give-access-to');

// eslint-disable-next-line no-unused-vars
const {iff, fastJoin} = commonHooks;


const postResolvers = {
	joins: {
		domain: () => async (permission, context) => {
			permission.domain = (await context.app.service('permissions-domains').get(permission.domain_id)).name;

			// delete extras
			delete permission.domain_id;
		},
		action: () => async (permission, context) => {
			permission.action = (await context.app.service('permissions-actions').get(permission.action_id)).name;

			// delete extras
			delete permission.action_id;
		}
	}
};

let moduleExports = {
	before: {
        all: [
            giveAccessTo({onlyAdmin: true})
		],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
	},

	after: {
        all: [
            fastJoin(postResolvers)
        ],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
	},

	error: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
	},
};

module.exports = moduleExports;
