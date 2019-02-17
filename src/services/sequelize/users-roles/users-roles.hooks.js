// Hooks for service `usersRoles`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common');

const {giveAccessTo} = require('../../../give-access-to');

// eslint-disable-next-line no-unused-vars
const {iff, disallow} = commonHooks;

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
