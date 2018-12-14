// Initializes the `usersRoles` service on path `/users-roles`. (Can be re-generated.)
const createService = require('feathers-sequelize');
const createModel = require('./users-roles.model');
const hooks = require('./users-roles.hooks');

let moduleExports = function (app) {
    let Model = createModel(app);
    let paginate = app.get('paginate');

    let options = {
        Model,
        paginate,
    };

    // Initialize our service with any options it requires
    app.use('/users-roles', createService(options));

    // Get our initialized service so that we can register hooks
    const service = app.service('users-roles');

    service.hooks(hooks);
};

module.exports = moduleExports;
