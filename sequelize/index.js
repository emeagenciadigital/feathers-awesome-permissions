const permissionsDomains = require('../src/services/sequelize/permissions-domains/permissions-domains.service');
const permissionsActions = require('../src/services/sequelize/permissions-actions/permissions-actions.service');
const permissions = require('../src/services/sequelize/permissions/permissions.service');
const roles = require('../src/services/sequelize/roles/roles.service');
const rolesPermissions = require('../src/services/sequelize/roles-permissions/roles-permissions.service');
const userRoles = require('../src/services/sequelize/users-roles/users-roles.service');

module.exports = (function () {
    function Services() {
        console.log('feathers awesome permissions - By: e-me agency digital');
    }

    Services.prototype.configure = function (app) {
        app.configure(permissionsDomains);
        app.configure(permissionsActions);
        app.configure(permissions);
        app.configure(roles);
        app.configure(rolesPermissions);
        app.configure(userRoles);
    };

    return Services;
})();