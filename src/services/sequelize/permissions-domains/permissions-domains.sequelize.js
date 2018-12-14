// permissionsDomains-model.js - A Sequelize model. (Can be re-generated.)
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const merge = require('lodash.merge');
const sequelizeSchema = require('./permissions-domains.sequelize-model');

let moduleExports = function (app) {
    let sequelizeClient = app.get('sequelizeClient');

    const permissionsDomains = sequelizeClient.define('permissions_domains',
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
    permissionsDomains.associate = function (models) {
        // Define associations here for foreign keys
        //   - No foreign keys defined.
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    };

    return permissionsDomains;
};

module.exports = moduleExports;
