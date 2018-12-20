// usersRoles-model.js - A Sequelize model. (Can be re-generated.)
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you requiredPermissions do here.
const path = require('path');
const merge = require('lodash.merge');
const sequelizeSchema = require('./users-roles.sequelize-model');
const userModel = require(path.join(__dirname, '../../../../../../../src/models/users.model'));
const roleModel = require('../roles/roles.sequelize');

let moduleExports = function (app) {
	let sequelizeClient = app.get('sequelizeClient');

	const usersRoles = sequelizeClient.define('users_roles',
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
	usersRoles.associate = function (models) {
		// Define associations here for foreign keys
		//   - No foreign keys defined.
		// See http://docs.sequelizejs.com/en/latest/docs/associations/
		usersRoles.belongsTo(userModel(app), {foreignKey: 'user_id', onDelete: 'RESTRICT'});
		usersRoles.belongsTo(roleModel(app), {foreignKey: 'role_id', onDelete: 'RESTRICT'});
	};

	return usersRoles;
};

module.exports = moduleExports;
