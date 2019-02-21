const {authenticate} = require('@feathersjs/authentication').hooks;
const {NotAuthenticated} = require('@feathersjs/errors');

const defaultOptions = {
    allowAnonymousUsers: false
};


const getContextSession = (ctx) => ctx.params.user ?
	Promise.resolve(ctx) :
	authenticate('jwt')(ctx)
		.then(ctx => Promise.resolve(ctx))
		.catch(() => Promise.resolve(ctx));


function getSession(ctx, options) {
    options = Object.assign({}, defaultOptions, options);

	return getContextSession(ctx)
		.then(ctx => {

			if (!ctx.params.provider) {
				return ctx;
			}

			const {user} = ctx.params;

			/*
			 * Vemos si se permiten usuarios anónimos y de lo contrario enviamos un error.
			 */
			if (!user && !options.allowAnonymousUsers)
				throw new NotAuthenticated('the user is not authenticated');

			return ctx;
		});
}


module.exports.getContextSession = getContextSession;
module.exports.getSession = getSession;
