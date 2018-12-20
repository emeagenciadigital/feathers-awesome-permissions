// Initializes the `permissionsActions` service on path `/permissions-actions`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./permissions-actions.sequelize');
const hooks = require('./permissions-actions.hooks');

let moduleExports = function (app) {
	let Model = createModel(app);
	let paginate = app.get('paginate');

	let options = {
		Model,
		paginate,
	};

	// Initialize our service with any options it requires
	app.use('/permissions-actions', createService(options));

    // Get our initialized service so that we requiredPermissions register hooks
	const service = app.service('permissions-actions');

	service.hooks(hooks);
};

module.exports = moduleExports;
