const {getItems, replaceItems} = require('feathers-hooks-common');
const {Forbidden, NotFound} = require('@feathersjs/errors');
const {getSession} = require('./session');
const {getUserRoles, getRequiredUserPermissions, getUserPermissions} = require('./permisions');

const defaultOptions = {
    mode: 'strict',
    adminRole: 'SUPER_ADMIN',
    entity: 'user',
    allowAnonymousUsers: false,
    requiredPermissions: [],
    restrictToOwner: {
        ownerField: 'id',
        otherField: 'id'
    },
    assignToOwner: false,
    onlyAdmin: false
};

function hasAccess(userPermissions, options) {
    // get target;
    let isPermit = options.mode === 'strict' ? 0 : 1;
    let targets = [];

    if (options.mode !== 'strict') {
        isPermit = 2;
        targets.push('*');
        for (let rp of options.requiredPermissions) {
            if (userPermissions.filter(it02 => (it02.domain === '*' || it02.domain === rp.domain) && (it02.action === '*' || it02.action === rp.action)).length === 0) {
                isPermit = 0;
            }
        }
    } else {
        for (let up of userPermissions) {
            if (up.domain === '*' && up.action === '*') {
                isPermit = 2;
                targets.push(up.target);
            } else if ((up.domain === '*' || up.domain === options.domain) && (up.action === '*' || up.action === options.action)) {
                isPermit = isPermit === 2 ? isPermit : 1;
                targets.push(up.target);
            }
        }
    }

    return {isPermit, targets};
}

module.exports.giveAccessTo = function (options = {}) {
    options = Object.assign({}, defaultOptions, options);

    if (options.restrictToOwner && typeof options.restrictToOwner !== 'object') {
        options.restrictToOwner = {};
    }
    if (options.restrictToOwner && !options.restrictToOwner.otherField) {
        options.restrictToOwner.otherField = 'id';
    }
    if (options.restrictToOwner && !options.restrictToOwner.ownerField) {
        options.restrictToOwner.ownerField = 'id';
    }

    if (options.assignToOwner && typeof options.assignToOwner !== 'object') {
        options.assignToOwner = {};
    }
    if (options.assignToOwner && !options.assignToOwner.otherField) {
        options.assignToOwner.otherField = 'id';
    }
    if (options.assignToOwner && !options.assignToOwner.ownerField) {
        options.assignToOwner.ownerField = 'id';
    }

    return ctx => new Promise(async (resolve, reject) => {
        try {
            ctx = await getSession(ctx, options);

            // si el llamado es interno no hacemos ninguna validacion y pasamos
            if (!ctx.params.provider) {
                resolve(ctx);return;
            }

            const {user} = options.allowAnonymousUsers ? {user: {[options.restrictToOwner.ownerField]: 0}} : ctx.params;

            const action = {
                find: 'read',
                get: 'read',
                create: 'create',
                update: 'update',
                patch: 'update',
                remove: 'delete'
            }[ctx.method];

            const userRoles = await getUserRoles(ctx, options);

            if (ctx.id === 'current') {
                ctx.id = user[options.restrictToOwner.ownerField];
            }

            // verificamos si solo debemos dar acceso a usuarios administradores
            if (userRoles.filter((it) => it.name === options.adminRole).length > 0) {
                resolve(ctx);return;
            } else if (options.onlyAdmin || (Array.isArray(options.onlyAdmin) && options.onlyAdmin.includes(ctx.method))) {
                reject(new Forbidden('access denied'));return;
            }

            let apr = []; // async permissions required
            let upr = []; // user permissions required

            if (options.mode === 'strict') {
                apr.push(getRequiredUserPermissions(ctx, {
                    roles: userRoles,
                    permissions: [{domain: '*', action: '*'}]
                }));
                apr.push(getRequiredUserPermissions(ctx, {
                    roles: userRoles,
                    permissions: [{domain: '*', action}]
                }));

                apr.push(getRequiredUserPermissions(ctx, {
                    roles: userRoles,
                    permissions: [{domain: ctx.path, action: '*'}]
                }));
                apr.push(getRequiredUserPermissions(ctx, {roles: userRoles, permissions: [{domain: ctx.path, action}]}));

                for (let a of options.requiredPermissions) {
                    apr.push(getRequiredUserPermissions(ctx, {
                        roles: userRoles,
                        permissions: [{domain: '*', action: a.action}]
                    }));
                    apr.push(getRequiredUserPermissions(ctx, {
                        roles: userRoles,
                        permissions: [{domain: a.domain, action: '*'}]
                    }));
                    apr.push(getRequiredUserPermissions(ctx, {
                        roles: userRoles,
                        permissions: [{domain: a.domain, action: a.action}]
                    }));
                }
            }

            apr = await Promise.all(apr);

            apr = [].concat(...apr).filter(it => it).map(it => ({domain: it.domain.id, action: it.action.id}));

            upr = await getUserPermissions(ctx, {roles: userRoles, permissions: apr});

            upr = Array.from(new Set(upr.map(element => JSON.stringify(element)))).map(element => JSON.parse(element));

            let {isPermit, targets} = hasAccess(upr, {...options, domain: ctx.path, action});

            if (!isPermit) {
                reject(new Forbidden('access denied'));
                return;
            }

            let records = getItems(ctx);

            if (!records) records = {};

            // get target;
            if (targets.includes('*')) {

                if (['create'].includes(ctx.method) && options.assignToOwner) {
                    records[options.assignToOwner.otherField] = user[options.assignToOwner.ownerField];
                }

                replaceItems(ctx, records);
                resolve(ctx);
                return;
            }

            if (options.mode === 'strict' && targets.length > 0) {

                let mt = ctx.method;

                if (['get', 'update', 'patch', 'remove'].includes(mt) && options.restrictToOwner && ctx.id) {
                    const thisElement = await ctx.app.service(ctx.path).get(ctx.id);

                    if (!thisElement) {
                        reject(new NotFound(`${ctx.path} not found`));
                        return;
                    }

                    if (
                        (
                            !targets.includes('self') &&
                            targets.filter(item => Number(item) === Number(thisElement[options.restrictToOwner.otherField])).length === 0
                        ) ||
                        (
                            targets.includes('self') &&
                            Number(user[options.restrictToOwner.ownerField]) !== Number(thisElement[options.restrictToOwner.otherField])
                        )
                    ) {
                        reject(new Forbidden('access denied'));
                        return;
                    }
                } else if (['find', 'update', 'patch', 'remove'].includes(mt) && options.restrictToOwner && !ctx.id) {

                    ctx.params.query[options.restrictToOwner.otherField] = {
                        $in: [
                            ...(targets.filter(it => !isNaN(Number(it))).map(x => Number(x))),
                            ...(targets.includes('self') ? [user[options.restrictToOwner.ownerField]] : [])
                        ]
                    };
                }
            }

            replaceItems(ctx, records);

            resolve(ctx);
        } catch (e) {
            reject(e);
        }
    });
};

