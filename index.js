const {configure: sequelize} = require('./sequelize');
const {giveAccessTo} = require('./src/give-access-to');
const {grantAccessTo} = require('./src/grant-access-to');
const {getUserRoles, getRequiredUserPermissions, getUserPermissions} = require('./src/permisions');

module.exports = {
	Permissions: {
		getUserRoles, 
		getRequiredUserPermissions, 
		getUserPermissions
	},
	giveAccessTo,
    grantAccessTo,
	Services: (type) => {
		switch(type) {
			case 'sequelize':
				return sequelize;
			default:
				return sequelize;
		}
	}
};
