const {getItems, replaceItems} = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');

const defaultOptions = {
    rolePrefix: 'BASE',
    entityField: 'id',
    userEntity: 'users',
    __defaultPermissionAction: [
        {action: 'read'},
        {action: 'update'},
        {action: 'delete'}
    ]
};


module.exports.grantAccessTo = function (options = {}) {

    // if (options.actions && (!Array.isArray(options.actions) || options.actions.filter(it => typeof it !== 'string').length > 0))
    //     throw new errors.GeneralError('se esperaba que actions fuera un array de strings');

    return async (context) => {

        options = Object.assign({
            permissions: [
                [
                    context.path,
                    [
                        {action: 'read'},
                        {action: 'update'},
                        {action: 'delete'}
                    ]
                ]
            ]
        }, defaultOptions, options);

        const records = getItems(context);

        let {user} = context.params;

        if (!user && context.path !== options.userEntity)
            return context;
        else
            user = records;

        let role = await context.app.service('roles')
            .find({query: {name: `${options.rolePrefix}_${user.id}`}}).then(it => it.data[0]);

        if (!role) {
            role = await context.app.service('roles').create({name: `${options.rolePrefix}_${user.id}`});
            context.app.service('users-roles').create({user_id: user.id, role_id: role.id});
        }

        for (let p1 of options.permissions) {
            let domain = await context.app.service('permissions-domains')
                .find({query: {name: p1[0]}}).then(it => it.data[0]);

            if (!domain)
                domain = await context.app.service('permissions-domains').create({name: p1[0]});

            p1[1] = p1[1] && Array.isArray(p1[1]) ? p1[1] : options.__defaultPermissionAction;

            for (let p2 of p1[1]) {
                let action = await context.app.service('permissions-actions')
                    .find({query: {name: p2.action}}).then(it => it.data[0]);

                if (!action)
                    action = await context.app.service('permissions-actions').create({name: p2.action});

                let permissions = await context.app.service('permissions')
                    .create({
                        domain_id: domain.id,
                        action_id: action.id,
                        target: p2.target ? p2.target : records[options.entityField]
                    });

                context.app.service('roles-permissions').create({role_id: role.id, permissions_id: permissions.id});
            }
        }

        replaceItems(context, records);

        return context;
    };
};
