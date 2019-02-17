// Hooks for service `rolesPermissions`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common');

const {giveAccessTo} = require('../../../give-access-to');

// eslint-disable-next-line no-unused-vars
const {iff} = commonHooks;

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
		all: [],
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
