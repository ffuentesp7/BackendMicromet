const permissionStationsAdmin = {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canUpdate: true,
};

const permissionUsersAdmin = {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canUpdate: true,
};

const permissionSystemsUser = {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canUpdate: false,
};

const permissionUsersUser = {
    canRead: false,
    canWrite: false,
    canDelete: false,
    canUpdate: false,
};

export {
    permissionStationsAdmin,
    permissionUsersAdmin,
    permissionSystemsUser,
    permissionUsersUser,
};