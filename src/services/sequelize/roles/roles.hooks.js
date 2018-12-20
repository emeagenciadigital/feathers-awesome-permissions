// Hooks for service `roles`. (Can be re-generated.)
const commonHooks = require('feathers-hooks-common');
const {authenticate} = require('@feathersjs/authentication').hooks;

// eslint-disable-next-line no-unused-vars
const {iff} = commonHooks;

let moduleExports = {
	before: {
		all: [],
		find: [],
		get: [],
		create: [
			authenticate('jwt')
		],
		update: [
			authenticate('jwt')
		],
		patch: [
			authenticate('jwt')
		],
		remove: [
			authenticate('jwt')
		]
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
