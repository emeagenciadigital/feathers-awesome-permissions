// Initializes the `permissionsDomains` service on path `/permissions-domains`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./permissions-domains.model');
const hooks = require('./permissions-domains.hooks');

let moduleExports = function (app) {
    let Model = createModel(app);
    let paginate = app.get('paginate');

    let options = {
        Model,
        paginate,
    };

    // Initialize our service with any options it requires
    app.use('/permissions-domains', createService(options));

    // Get our initialized service so that we can register hooks
    const service = app.service('permissions-domains');

    service.hooks(hooks);
};

module.exports = moduleExports;
