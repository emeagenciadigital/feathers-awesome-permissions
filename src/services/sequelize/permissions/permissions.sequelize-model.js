/* eslint quotes: 0 */
// Defines Sequelize model for service `permissions`. (Can be re-generated.)
const merge = require('lodash.merge');
const Sequelize = require('sequelize');
// eslint-disable-next-line no-unused-vars
const DataTypes = Sequelize.DataTypes;

let moduleExports = merge({},
    {
        domain_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        target: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
);

module.exports = moduleExports;
