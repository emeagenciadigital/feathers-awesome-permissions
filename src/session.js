const {authenticate} = require('@feathersjs/authentication').hooks;
const {NotAuthenticated} = require('@feathersjs/errors');

const defaultOptions = {
    allowAnonymousUsers: false
};


function getContextSession() {
    return (context) => {
        return context.params.user ? Promise.resolve(context) : (authenticate('jwt')(context).catch(() => Promise.resolve(context)));
    }
};


function getSession(options) {
    options = Object.assign({}, defaultOptions, options);

	return (context00) => {
		// @ts-ignore
		return getContextSession()(context00).then((context01) => {

			// If called internally
			if (!context01.params.provider) {
				return context01;
			}

			const {user} = context01.params;

			/*
			 * Vemos si se permiten usuarios anónimos y de lo contrario enviamos un error.
			 */
			if (!user && !options.allowAnonymousUsers) {
				throw new NotAuthenticated('the user is not authenticated');
			}

			return context01;
		});
	};
};


module.exports.getContextSession = getContextSession
module.exports.getSession = getSession
