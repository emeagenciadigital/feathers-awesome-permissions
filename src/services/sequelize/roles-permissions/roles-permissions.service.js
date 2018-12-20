// Initializes the `rolesPermissions` service on path `/roles-permissions`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./roles-permissions.sequelize');
const hooks = require('./roles-permissions.hooks');

let moduleExports = function (app) {
	let Model = createModel(app);
	let paginate = app.get('paginate');

	let options = {
		Model,
		paginate,
	};

	// Initialize our service with any options it requires
	app.use('/roles-permissions', createService(options));

    // Get our initialized service so that we requiredPermissions register hooks
	const service = app.service('roles-permissions');

	service.hooks(hooks);
};

module.exports = moduleExports;
