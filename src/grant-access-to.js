const {getItems, replaceItems} = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const defaultOptions = {
    rolePrefix: 'BASE',
    entityField: 'id',
    userEntity: 'users'
};


module.exports.grantAccessTo = function (options = {}) {

    if (options.domain && typeof options.domain !== 'string')
        throw new errors.GeneralError('se esperaba que domain fuera un string');

    if (options.actions && (!Array.isArray(options.actions) || options.actions.filter(it => typeof it !== 'string').length > 0))
        throw new errors.GeneralError('se esperaba que actions fuera un array de strings');

    return async (context) => {

        options = Object.assign({
            domain: context.path,
            actions: ['create', 'read', 'update', 'delete']
        }, defaultOptions, options);

        const records = getItems(context);

        let {user} = context.params;

        if (!user && context.path !== options.userEntity)
            return context;
        else
            user = records;

        let role = await context.app.service('roles')
            .find({query: {name: `${options.rolePrefix}_${user.id}`}}).then(it => it.data[0]);

        if (!role)
            role = await context.app.service('roles').create({name: `${options.rolePrefix}_${user.id}`});

        let domain = await context.app.service('permissions-domains')
            .find({query: {name: options.domain}}).then(it => it.data[0]);

        if (!domain)
            domain = await context.app.service('permissions-domains').create({name: options.domain});

        for (let action of options.actions) {
            let _action = await context.app.service('permissions-actions')
                .find({query: {name: action}}).then(it => it.data[0]);

            if (!_action)
                await context.app.service('permissions-actions').create({name: options.domain});

            let permissions = context.app.service('permissions')
                .create({domain_id: domain.id, action_id: _action.id, target: records[options.entityField]});

            context.app.service('roles-permissions').create({role_id: role.id, permissions_id: permissions.id});
        }

        replaceItems(context, records);

        return context;
    };
};
