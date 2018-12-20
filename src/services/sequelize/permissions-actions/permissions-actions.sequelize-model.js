/* eslint quotes: 0 */
// Defines Sequelize model for service `permissionsActions`. (Can be re-generated.)
const merge = require('lodash.merge');
const Sequelize = require('sequelize');
// eslint-disable-next-line no-unused-vars
const DataTypes = Sequelize.DataTypes;

let moduleExports = merge({},
	{
		name: {
			type: DataTypes.STRING(80),
			unique: true,
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT
		}
	},
);

module.exports = moduleExports;
