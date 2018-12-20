// permissionsActions-model.js - A Sequelize model. (Can be re-generated.)
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you requiredPermissions do here.
const merge = require('lodash.merge');
const sequelizeSchema = require('./permissions-actions.sequelize-model');

let moduleExports = function (app) {
	let sequelizeClient = app.get('sequelizeClient');

	const permissionsActions = sequelizeClient.define('permissions_actions',
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
	permissionsActions.associate = function (models) {
		// Define associations here for foreign keys
		//   - No foreign keys defined.
		// See http://docs.sequelizejs.com/en/latest/docs/associations/
	};

	return permissionsActions;
};

module.exports = moduleExports;
