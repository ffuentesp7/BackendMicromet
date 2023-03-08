const { assignRoleUser, getPermissions } = require('../utilities/userUtilities');
const { Station, User, UserWithRole } = require('../models/schemas');
const { debug } = require('console');
const dotenv = require('dotenv');
dotenv.config();

const usersService = {
    async addUser(req) {
        const { name, lastName, _id, email } = req.body;
        // We check if all the fields are present on the request
        if (!name || !lastName || !_id || !email) {
            return {
                status: 'failed',
                code: 400,
                message: 'Missing required fields',
                data: {},
            };
        }

        const nano = dbInstance.db.use(process.env.TENANT_ID);
        const user = new User(`users:${_id}`, name, lastName, email);

        try{
            const response = await nano.insert(user);
            user.processAPIResponse(response);
            return {
                status: 'success',
                code: 200,
                message: 'User created',
                data: {
                    _id: user._id.split(':')[1],
                    name: user.name,
                    lastName: user.lastName,
                    email: user.email,
                },
            };
        } catch (err) {
            return {
                status: 'failed',
                code: 400,
                message: 'User not created',
            data: err.description,
            };
        }
    },

    async getUser(req) {
        const { _id } = req.params;
        if (!_id) {
            return {
                status: 'failed',
                code: 400,
                message: 'Missing required fields',
                data: {},
            };
        }
        // Obtaining the user by UID
    try {
        const nano = dbInstance.db.use(process.env.TENANT_ID);
        const userData = await nano.partitionedFind('users', {
            selector: {
                _id: `users:${_id}`,
            },
        });
        const user = userData.docs[0];
        return {
            status: 'success',
            code: 200,
            message: 'User found',
            data: {
                _id: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
            },
        };
    } catch (err) {
        return {
            status: 'failed',
            code: 400,
            message: 'User not found',
            data: err.description,
        };
    }
},

async updateUser(req) {
    // Verifying that all the fields are present
    const { name, lastName } = req.body;
    let { _id } = req.body;
    if ((!name && !lastName) || !_id) {
        return {
            status: 'failed',
            code: 400,
            message: 'Missing required fields',
            data: {},
        };
    }
    _id = _id.includes('users:') ? _id : `users:${_id}`;
    const nano = dbInstance.db.use(process.env.TENANT_ID);
    try {
        const userToUpdate = await nano.partitionedFind('users', {
            selector: {
                _id,
            },
        });
        if (userToUpdate.docs.length === 0) {
            return {
                status: 'failed',
                code: 400,
                message: 'User not found',
                data: {},
            };
        } else {
            const user = userToUpdate.docs[0];
            if (name) {
                user.name = name;
            }
            if (lastName) {
                user.lastName = lastName;
            }
            await nano.insert(user);
            return {
                status: 'success',
                code: 200,
                message: 'User updated',
                data: {
                    uid: user._id,
                    name: user.name,
                    lastName: user.lastName,
                    email: user.email,
                },
            };
        }
    } catch (err) {
        return {
            status: 'failed',
            code: 400,
            message: 'User could not be updated',
            data: err.description,
        };
    }
},

async assignRole(req) {
    // We check that all the fields are present
    const { uidFrom, uidTo, role, stationId } = req.body;
    if (!uidFrom || !uidTo || !role || !stationId) {
        return {
            status: 'failed',
            code: 400,
            message: 'Missing required fields',
            data: null,
        };
    } else {
        return assignRoleUser(uidFrom, uidTo, stationId, role);
    }
},

async getUserStations(req) {
    let { _id } = req.params;
    if (!_id) {
        return {
            status: 'failed',
            code: 400,
            message: 'Missing required fields',
            data: null,
        };
    }
    _id = _id.includes('users:') ? _id : `users:${_id}`;
    // To get the stations of a user, we need to get all the instances of UserWithRoleSchema that have the user's UID
    const nano = dbInstance.db.use(process.env.TENANT_ID);
    const stationsData = await nano.partitionedFind('users-with-role', {
        selector: {
            user: _id,
        },
    });
    const stations = stationsData.docs;
    if (stations.length > 0) {
        // We're only interested in the stationId, so we map the results to only return the stationId
        const stationsIds = stations.map((station) => station.stationId);
        return {
            status: 'success',
            code: 200,
            message: 'Stations found',
            data: stationsIds,
        };
    } else {
        return {
            status: 'failed',
            code: 400,
            message: 'User stations not found',
            data: null,
        };
    }
},

async deleteUserRole(req) {
    let { uidTo, uidFrom, stationId } = req.body;
    if (!uidTo || !uidFrom || !stationId) {
        return {
            status: 'failed',
            code: 400,
            message: 'Missing required fields',
            data: null,
        };
    }
    uidTo = uidTo.includes('users:') ? uidTo : `users:${uidTo}`;
    uidFrom = uidFrom.includes('users:') ? uidFrom : `users:${uidFrom}`;
    stationId = stationId.includes('stations:')
        ? stationId
        : `stations:${stationId}`;
    const fromPermissions = await getPermissions(uidFrom, stationId);
    // We get the instance of UserWithRoleSchema that matches the UID and the stationId
    if (fromPermissions.usersPermissions.canDelete) {
        const nanoUWR = dbInstance.db.use(process.env.TENANT_ID);
        const userWithRole = await nanoUWR.find({
            selector: {
                user: uidTo,
                stationId: stationId,
            },
        });
        const nanoSys = dbInstance.db.use(process.env.TENANT_ID);
        const userWithinStationData = await nanoSys.partitionedFind(
            'stations',
            {
                selector: {
                    _id: stationId,
                },
            }
        );
        const userWithinStation = userWithinStationData.docs[0];
        if (userWithRole.docs.length > 0) {
            await nanoUWR.destroy(
                userWithRole.docs[0]._id,
                userWithRole.docs[0]._rev
            );
            userWithinStation.users = userWithinStation.users.filter(
                (user) => user.user !== uidTo
            );
            await nanoSys.insert(userWithinStation);
        }
        return {
            status: 'success',
            code: 200,
            message: 'User role deleted',
            data: {},
        };
    }
    return {
        status: 'failed',
        code: 400,
        message: 'User does not have permissions to delete',
        data: null,
    };
},

async getUID(req) {
        const { email } = req.body;
        if (!email) {
            return {
                status: 'failed',
                code: 400,
                message: 'Missing required fields',
                data: null,
            };
        }
        const nano = dbInstance.db.use<User>(process.env.TENANT_ID);
        const user = await nano.partitionedFind('users', {
            selector: {
                email: email,
            },
        });
        if (user.docs.length > 0) {
            return {
                status: 'success',
                code: 200,
                message: 'User found',
                data: user.docs[0]._id,
            };
        } else {
            return {
                status: 'failed',
                code: 400,
                message: 'User not found',
                data: null,
            };
        }
    },

    async getUID(req) {
        const { email } = req.body;
        if (!email) {
            return {
                status: 'failed',
                code: 400,
                message: 'Missing required fields',
                data: null,
            };
        }
        const nano = dbInstance.db.use(process.env.TENANT_ID);
        const user = await nano.partitionedFind('users', {
            selector: {
                email: email,
            },
        });
        if (user.docs.length > 0) {
            return {
                status: 'success',
                code: 200,
                message: 'User found',
                data: user.docs[0]._id,
            };
        } else {
            return {
                status: 'failed',
                code: 400,
                message: 'User not found',
                data: null,
            };
        }
    },
};

export default usersService;