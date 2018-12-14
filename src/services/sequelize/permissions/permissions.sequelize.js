// permissions-model.js - A Sequelize model. (Can be re-generated.)
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const merge = require('lodash.merge');
const sequelizeSchema = require('./permissions.sequelize-model');

const permissionsDomainModel = require('../permissions-domains/permissions-domains.sequelize');
const permissionsActionModel = require('../permissions-actions/permissions-actions.sequelize');

let moduleExports = function (app) {
    let sequelizeClient = app.get('sequelizeClient');

    const permissions = sequelizeClient.define('permissions',
        sequelizeSchema,
        merge(
            {
                hooks: {
                    beforeCount(options) {
                        options.raw = true;
                    },
                },
            },
        )
    );

    // eslint-disable-next-line no-unused-vars
    permissions.associate = function (models) {
        // Define associations here for foreign keys
        //   - No foreign keys defined.
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        permissions.belongsTo(permissionsDomainModel(app), {foreignKey: 'domain_id', onDelete: 'RESTRICT'});
        permissions.belongsTo(permissionsActionModel(app), {foreignKey: 'action_id', onDelete: 'RESTRICT'});
    };
    return permissions;
};

module.exports = moduleExports;
