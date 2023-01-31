import * as Nano from 'nano';

interface iRole {
    name: string;
    usersPermissions: { [key: string]: boolean };
    systemsPermissions: { [key: string]: boolean };
}

class Role implements iRole {
    name: string;
    usersPermissions: { [key: string]: boolean };
    systemsPermissions: { [key: string]: boolean };

    constructor(
        name: string,
        usersPermissions: { [key: string]: boolean },
        systemsPermissions: { [key: string]: boolean }
    ) {
        this.name = name;
        this.usersPermissions = usersPermissions;
        this.systemsPermissions = systemsPermissions;
    }
}

interface iUserWithRole {
    user: string;
    role: Role;
    systemId: string;
}

class UserWithRole implements iUserWithRole {
    _id: string;
    _rev?: string;
    user: string;
    role: Role;
    systemId: string;

    constructor(id: string, user: string, role: Role, systemId: string) {
        this.user = user;
        this.role = role;
        this.systemId = systemId;
        this._id = id;
        this._rev = undefined;
    }

    processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}

interface iSystem extends Nano.MaybeDocument {
    name: string;
    users: UserWithRole[];
    //crops: Crop[];
}

class System implements iSystem {
    _id: string;
    _rev?: string;
    name: string;
    users: UserWithRole[];
    //crops: Crop[];

    constructor(id: string, name: string) {
        this.name = name;
        this.users = [];
   //     this.crops = [];
        this._id = id;
        this._rev = undefined;
    }

    processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}

interface iUser extends Nano.MaybeDocument {
    name: string;
    lastName: string;
    email: string;
}

class User implements iUser {
    _id: string;
    _rev?: string;
    name: string;
    lastName: string;
    email: string;

    constructor(id: string, name: string, lastName: string, email: string) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this._id = id;
        this._rev = undefined;
    }

    processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}



export { System, User, UserWithRole, Role  };
