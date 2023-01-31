const primitiveSystemsSuperAdmin = {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canUpdate: true,
};
const primitiveUsersSuperAdmin = {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canUpdate: true,
};

const primitiveSystemsAdmin = {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canUpdate: true,
};

const primitiveUsersAdmin = {
    canRead: true,
    canWrite: true,
    canDelete: false,
    canUpdate: true,
};

const primitiveSystemsUser = {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canUpdate: false,
};

const primitiveUsersUser = {
    canRead: false,
    canWrite: false,
    canDelete: false,
    canUpdate: false,
};

export {
    primitiveSystemsSuperAdmin,
    primitiveUsersSuperAdmin,
    primitiveSystemsAdmin,
    primitiveUsersAdmin,
    primitiveSystemsUser,
    primitiveUsersUser,
};
