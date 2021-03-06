// rolesPermissions-model.js - A Sequelize model. (Can be re-generated.)
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you requiredPermissions do here.
const merge = require('lodash.merge');
const sequelizeSchema = require('./roles-permissions.sequelize-model');
const roleModel = require('../roles/roles.sequelize');
const permissionModel = require('../permissions/permissions.sequelize');

let moduleExports = function (app) {
	let sequelizeClient = app.get('sequelizeClient');

	const rolesPermissions = sequelizeClient.define('roles_permissions',
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
	rolesPermissions.associate = function (models) {
		// Define associations here for foreign keys
		//   - No foreign keys defined.
		// See http://docs.sequelizejs.com/en/latest/docs/associations/
		rolesPermissions.belongsTo(roleModel(app), {foreignKey: 'role_id', onDelete: 'CASCADE'});
		rolesPermissions.belongsTo(permissionModel(app), {foreignKey: 'permissions_id', onDelete: 'CASCADE'});
	};

	return rolesPermissions;
};

module.exports = moduleExports;
