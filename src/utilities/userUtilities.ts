import { Role, System, User, UserWithRole } from '../models/schemas';
import dbInstance from '../config/database';
import {
    primitiveSystemsAdmin,
    primitiveSystemsSuperAdmin,
    primitiveSystemsUser,
    primitiveUsersAdmin,
    primitiveUsersSuperAdmin,
    primitiveUsersUser,
} from '../utilities/primitives';
import dotenv from 'dotenv';

dotenv.config();

async function getPermissions(_id: string, systemId: string) {
    _id = _id.includes('users:') ? _id : `users:${_id}`;
    // Getting the UserWithRole objects that match the UID and the systemId that we are looking for
    const nano = dbInstance.db.use<UserWithRole>(process.env.TENANT_ID);
    const userWithRole = await nano.partitionedFind('users-with-role', {
        selector: {
            user: _id,
            systemId: systemId,
        },
    });
    if (userWithRole.docs.length > 0) {
        return userWithRole.docs[0].role;
    }
}

async function getUserData(_id: string) {
    _id = _id.includes('users:') ? _id : `users:${_id}`;
    const nano = dbInstance.db.use<User>(process.env.TENANT_ID);
    try {
        const user = await nano.find({
            selector: {
                _id: _id,
            },
        });
        if (user.docs.length > 0) {
            return user.docs[0];
        }
    } catch (err) {
        return null;
    }
}

async function assignRoleUser(
    uidFrom: string,
    uidTo: string,
    systemId: string,
    roleToBeAssigned: string
) {
    // Before assigning a role, we need to check if the userFrom has the permission to do so, while also checking if the user id has the correct format
    uidTo = uidTo.includes('users:') ? uidTo : `users:${uidTo}`;
    uidFrom = uidFrom.includes('users:') ? uidFrom : `users:${uidFrom}`;
    systemId = systemId.includes('systems:') ? systemId : `systems:${systemId}`;
    const userFromPermissions = await getPermissions(uidFrom, systemId);
    // We also need to check if the userTo is already assigned to the system and has a higher privilege to revoke the request
    // If the userTo and userFrom exists and the userFrom has the permission to assign roles
    if (userFromPermissions.usersPermissions.canUpdate) {
        const userData = await getUserData(uidTo);
        const nanoUWR = dbInstance.db.use<UserWithRole>(process.env.TENANT_ID);
        const usersFound = await nanoUWR.partitionedFind('users-with-role', {
            selector: {
                user: uidTo,
                systemId: systemId,
            },
        });
        const userWithRoleData = usersFound.docs;
        const nanoSys = dbInstance.db.use<System>(process.env.TENANT_ID);
        const allSystemData = await nanoSys.partitionedFind('systems', {
            selector: {
                _id: systemId,
            },
        });
        const systemData = allSystemData.docs[0];
        // Depending on the role that we are assigning, we create the UserWithRole object with the corresponding permissions
        if (userWithRoleData.length > 0) {
            if (
                userWithRoleData[0].role.name != userFromPermissions.name &&
                userWithRoleData[0].role.name != 'superAdmin'
            ) {
                if (roleToBeAssigned == 'admin') {
                    userWithRoleData[0].role = new Role(
                        'admin',
                        primitiveUsersAdmin,
                        primitiveSystemsAdmin
                    );
                    await nanoUWR.insert(userWithRoleData[0]);
                    // removing from the system the UserWithRole object inside system users array and adding the new one
                    systemData.users.splice(
                        systemData.users.indexOf(userWithRoleData[0]),
                        1
                    );
                    systemData.users.push(userWithRoleData[0]);
                    await nanoSys.insert(systemData, systemData._id);
                    return {
                        status: 'success',
                        code: 200,
                        message: 'User role updated',
                        data: {},
                    };
                } else if (roleToBeAssigned == 'user') {
                    const userRole = new Role(
                        'user',
                        primitiveUsersUser,
                        primitiveSystemsUser
                    );
                    userWithRoleData[0].role = userRole;
                    await nanoUWR.insert(userWithRoleData[0]);
                    // removing from the system the UserWithRole object inside system users array and adding the new one
                    systemData.users.splice(
                        systemData.users.indexOf(userWithRoleData[0]),
                        1
                    );
                    systemData.users.push(userWithRoleData[0]);
                    await nanoSys.insert(systemData, systemData._id);
                    return {
                        status: 'success',
                        code: 200,
                        message: 'User role updated',
                        data: {},
                    };
                } else if (roleToBeAssigned == 'superAdmin') {
                    userWithRoleData[0].role = new Role(
                        'superAdmin',
                        primitiveUsersSuperAdmin,
                        primitiveSystemsSuperAdmin
                    );
                    await nanoUWR.insert(userWithRoleData[0]);
                    // removing from the system the UserWithRole object inside system users array and adding the new one
                    systemData.users.splice(
                        systemData.users.indexOf(userWithRoleData[0]),
                        1
                    );
                    systemData.users.push(userWithRoleData[0]);
                    await nanoSys.insert(systemData, systemData._id);
                    return {
                        status: 'success',
                        code: 200,
                        message: 'User role updated',
                        data: {},
                    };
                } else {
                    return {
                        status: 'failed',
                        code: 500,
                        message: 'Role to be assigned not found',
                        data: {},
                    };
                }
            } else {
                return {
                    status: 'failed',
                    code: 500,
                    message:
                        'Current user does not have the permission to assign roles to this user',
                    data: {},
                };
            }
        } else {
            if (roleToBeAssigned == 'admin') {
                const adminRole = new Role(
                    'admin',
                    primitiveUsersAdmin,
                    primitiveSystemsAdmin
                );
                const generatedUID = await dbInstance.uuids(1);
                const uid = `users-with-role:${generatedUID.uuids[0]}`;
                const newUserWithRole = new UserWithRole(
                    uid,
                    userData._id,
                    adminRole,
                    systemId
                );
                await nanoUWR.insert(newUserWithRole);
                systemData.users.push(newUserWithRole);
                await nanoSys.insert(systemData, systemData._id);
                return {
                    status: 'success',
                    code: 200,
                    message: 'User role assigned',
                    data: {},
                };
            } else if (roleToBeAssigned == 'superAdmin') {
                const superAdminRole = new Role(
                    'superAdmin',
                    primitiveUsersSuperAdmin,
                    primitiveSystemsSuperAdmin
                );
                const generatedUID = await dbInstance.uuids(1);
                const uid = `users-with-role:${generatedUID.uuids[0]}`;
                const newUserWithRole = new UserWithRole(
                    uid,
                    userData._id,
                    superAdminRole,
                    systemId
                );
                await nanoUWR.insert(newUserWithRole);
                systemData.users.push(newUserWithRole);
                await nanoSys.insert(systemData, systemData._id);
                return {
                    status: 'success',
                    code: 200,
                    message: 'User role assigned',
                    data: {},
                };
            } else if (roleToBeAssigned == 'user') {
                const userRole = new Role(
                    'user',
                    primitiveUsersUser,
                    primitiveSystemsUser
                );
                const generatedUID = await dbInstance.uuids(1);
                const uid = `users-with-role:${generatedUID.uuids[0]}`;
                const newUserWithRole = new UserWithRole(
                    uid,
                    userData._id,
                    userRole,
                    systemId
                );
                await nanoUWR.insert(newUserWithRole);
                systemData.users.push(newUserWithRole);
                await nanoSys.insert(systemData, systemData._id);
                return {
                    status: 'success',
                    code: 200,
                    message: 'User role assigned',
                    data: {},
                };
            } else {
                return {
                    status: 'failed',
                    code: 500,
                    message: 'Role to be assigned not found',
                    data: {},
                };
            }
        }
    } else {
        return {
            status: 'failed',
            code: 400,
            message: 'User not found',
            data: null,
        };
    }
}

export { getPermissions, getUserData, assignRoleUser };
