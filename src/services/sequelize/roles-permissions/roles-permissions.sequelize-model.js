/* eslint quotes: 0 */
// Defines Sequelize model for service `rolesPermissions`. (Can be re-generated.)
const merge = require('lodash.merge');
const Sequelize = require('sequelize');
// eslint-disable-next-line no-unused-vars
const DataTypes = Sequelize.DataTypes;

let moduleExports = merge({},
    {
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permissions_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
);

module.exports = moduleExports;
