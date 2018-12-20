// Initializes the `roles` service on path `/roles`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./roles.sequelize');
const hooks = require('./roles.hooks');

let moduleExports = function (app) {
	let Model = createModel(app);
	let paginate = app.get('paginate');

	let options = {
		Model,
		paginate,
	};

	// Initialize our service with any options it requires
	app.use('/roles', createService(options));

    // Get our initialized service so that we requiredPermissions register hooks
	const service = app.service('roles');

	service.hooks(hooks);
};

module.exports = moduleExports;
