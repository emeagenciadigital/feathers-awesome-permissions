# Feathers awesome permissions
> **Advertencia:** No es una versión definitiva ya que requiere optimización y de momento solo es compatible con servicios basados en sequelize (al menos en cuanto y su sistema interno) y requiere de un servicio **“users”**.

**Instalacion**

npm

    npm install @e-me/feathers-awesome-permissions --save

yarn

    yarn add @e-me/feathers-awesome-permissions


**Configuracion**

src/service/index.js

    // Configure the Feathers services. (Can be re-generated.)
    
    // !code: imports
    ...
    let {Services} =  require('@e-me/feathers-awesome-permissions');
    ...
    // !end
    
    // !code: init // !end
    
    // eslint-disable-next-line no-unused-vars
    let  moduleExports  =  function (app) {
    // !code: func_return
    ...
    app.configure(Services('sequelize'));
    ...
    // !end
    };
    
    // !code: exports // !end
    
    module.exports  =  moduleExports;
    
    // !code: funcs // !end
    // !code: end // !end
service hook de ejemplo

    // Hooks for service `users`. (Can be re-generated.)
    const  commonHooks  =  require('feathers-hooks-common');
    
    // eslint-disable-next-line no-unused-vars
    const { hashPassword, protect } =  require('@feathersjs/authentication-local').hooks;
    
    // !code: imports
    const {Permissions: {getUserRoles, getUserPermissions}} =  require('@e-me/feathers-awesome-permissions');
    const {giveAccessTo, grantAccessTo} =  require('@e-me/feathers-awesome-permissions');
    const  restrictMasiveUpdate  =  require('../../hooks/restrict-masive-update');
    // !end
    
    // !code: used
    // eslint-disable-next-line no-unused-vars
    const { iff, isProvider, fastJoin } =  commonHooks;
    // !end
    
    // !code: init
    const  resolvers  = {
	    joins: {
		    permissions: () =>  async (user, context) => {
			    user.roles  =  await  getUserRoles(context);
			    user.permissions  =  getUserPermissions(context, {roles:  user.roles});
		    }
	    }
    };
    // !end
    
    let  moduleExports  = {
    before: {
	    // !code: before
	    all: [],
	    find: [
		    giveAccessTo()
	    ],
	    get: [
		    giveAccessTo()
	    ],
	    create: [
		    hashPassword()
	    ],
	    update: [
		    hashPassword(),
		    giveAccessTo()
	    ],
	    patch: [
		    hashPassword(),
		    giveAccessTo()
	    ],
	    remove: [
		    giveAccessTo()
	    ]
	    // !end
    },
    after: {
	    // !code: after
	    all: [
		    protect('password'),
		    iff(isProvider('external'), fastJoin(resolvers))
	    ],
	    find: [],
	    get: [],
	    create: [
		    grantAccessTo()
	    ],
	    update: [],
	    patch: [],
	    remove: []
	    // !end
    },
    error: {
	    // !<DEFAULT> code: error
	    all: [],
	    find: [],
	    get: [],
	    create: [],
	    update: [],
	    patch: [],
	    remove: []
	    // !end
    },
    
    // !code: moduleExports // !end
    
    };
    
    // !code: exports // !end
    
    module.exports  =  moduleExports;
    
    // !code: funcs // !end
    // !code: end // !end

**options**

giveAccessTo()

|option|tipo|desctiptions|
|--|--|--|
|mode|'strict'\|'trust'|trust: es un modo donde se parte de que el usuario tiene permisos de todo y se le quitan si no tiene uno de los permisos especificados en **"requiredPermissions"** (no se recomienda su uso)|
|adminRole|string|por motivos de seguridad se recomienda que solo se le otorge a un usuario|
|entity|string|
|allowAnonymousUsers|boolean|
|anonymousUserId|number|por defecto es 0|
|requiredPermissions|[{domain: string, action: string},...]|
|restrictToOwner|{ownerField: string, otherField: string}|
|onlyAdmin|array\<string\>\|boolean|cuando es un array de strings se espera que el string sea el nombre del metodo en el que solo se permiten administradores|

grantAccessTo()

|option|tipo|desctiptions|
|--|--|--|
|rolePrefix|string|
|entityField|string|
|userEntity|string|
|domain|string|
|actions|array\<string\>|


***
sitio web de los creadores: [e-me.co](https://e-me.co/)
