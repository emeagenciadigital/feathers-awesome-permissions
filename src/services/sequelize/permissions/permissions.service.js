// Initializes the `permissions` service on path `/permissions`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./permissions.sequelize');
const hooks = require('./permissions.hooks');

let moduleExports = function (app) {
    let Model = createModel(app);
    let paginate = app.get('paginate');

    let options = {
        Model,
        paginate,
    };

    // Initialize our service with any options it requires
    app.use('/permissions', createService(options));

    // Get our initialized service so that we can register hooks
    const service = app.service('permissions');

    service.hooks(hooks);
};

module.exports = moduleExports;
