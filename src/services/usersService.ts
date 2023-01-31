import { Request } from 'express';
import dbInstance from '../config/database';
import { assignRoleUser, getPermissions } from '../utilities/userUtilities';
import { System, User, UserWithRole } from '../models/schemas';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const usersService = {
    async addUser(req: Request) {
        const { name, lastName, email, password } = req.body;
        const tenantId = req.query.tenantId as string;
        let { _id, verified } = req.body;
        verified = verified == undefined ? false : verified;
        // We check if all the fields are present on the request
        if (!name || !lastName || !email || !password || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: {},
            };
        }

        if (!_id || _id === '') {
            const getUid = await dbInstance.uuids(1);
            _id = getUid.uuids[0];
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        // We create the user on the database
        const nano = dbInstance.db.use<User>(tenantId);
        // Check if the user already exists
        const userExists = await nano.partitionedFind('users', {
            selector: {
                email: email,
            },
        });
        if (userExists.docs.length > 0) {
            return {
                status: 'failed',
                code: 400,
//                message: 'User already exists',
                message: 'El usuario ya existe',
                data: {},
            };
        }
        const user = new User(
            `users:${_id}`,
            name,
            lastName,
            email,
            encryptedPassword,
            verified
        );
        try {
            const response = await nano.insert(user);
            user.processAPIResponse(response);
            return {
                status: 'success',
                code: 200,
//                message: 'User created',
                message: 'El usuario ha sido creado exitosamente',
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
//                message: 'User not created',
                message: 'El usuario no ha sido creado',
                data: err.description,
            };
        }
    },

    async getUser(req: Request) {
        let { _id } = req.params;
        const tenantId = req.query.tenantId as string;
        if (!_id || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: {},
            };
        }
        _id = _id.includes('users:') ? _id : `users:${_id}`;
        // Obtaining the user by UID
        try {
            const nano = dbInstance.db.use<User>(tenantId);
            const userData = await nano.partitionedFind('users', {
                selector: {
                    _id: _id,
                },
            });
            const user = userData.docs[0];
            return {
                status: 'success',
                code: 200,
//                message: 'User found',
                message: 'El usuario ha sido encontrado',
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
//                message: 'User not found',
                message: 'El usuario no ha sido encontrado',
                data: err.description,
            };
        }
    },
    async updateUser(req: Request) {
        // Verifying that all the fields are present
        const { name, lastName } = req.body;
        const tenantId = req.query.tenantId as string;
        let { _id } = req.body;
        if ((!name && !lastName) || !_id || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: {},
            };
        }
        _id = _id.includes('users:') ? _id : `users:${_id}`;
        const nano = dbInstance.db.use<User>(tenantId);
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
//                    message: 'User updated',
                    message: 'El usuario ha sido actualizado exitosamente',
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
//                message: 'User could not be updated',
                message: 'El usuario no ha podido ser actualizado',
                data: err.description,
            };
        }
    },

    async assignRole(req: Request) {
        // We check that all the fields are present
        const { uidFrom, uidTo, role, systemId } = req.body;
        if (!uidFrom || !uidTo || !role || !systemId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: null,
            };
        } else {
            return assignRoleUser(uidFrom, uidTo, systemId, role);
        }
    },
    async getUserSystems(req: Request) {
        let { _id } = req.params;
        const tenantId = req.query.tenantId as string;
        if (!_id || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: null,
            };
        }
        _id = _id.includes('users:') ? _id : `users:${_id}`;
        // To get the systems of a user, we need to get all the instances of UserWithRoleSchema that have the user's UID
        const nano = dbInstance.db.use<UserWithRole>(tenantId);
        const systemsData = await nano.partitionedFind('users-with-role', {
            selector: {
                user: _id,
            },
        });
        const systems = systemsData.docs;
        if (systems.length > 0) {
            // We're only interested in the systemId, so we map the results to only return the systemId
            const systemsIds = systems.map((system) => system.systemId);
            return {
                status: 'success',
                code: 200,
//                message: 'Systems found',
                message: 'Los sistemas han sido encontrados',
                data: systemsIds,
            };
        } else {
            return {
                status: 'failed',
                code: 400,
//                message: 'User systems not found',
                message: 'Los sistemas del usuario no han sido encontrados',
                data: null,
            };
        }
    },
    async deleteUserRole(req: Request) {
        let { uidTo, uidFrom, systemId } = req.body;
        const tenantId = req.query.tenantId as string;
        if (!uidTo || !uidFrom || !systemId || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: null,
            };
        }
        uidTo = uidTo.includes('users:') ? uidTo : `users:${uidTo}`;
        uidFrom = uidFrom.includes('users:') ? uidFrom : `users:${uidFrom}`;
        systemId = systemId.includes('systems:')
            ? systemId
            : `systems:${systemId}`;
        const fromPermissions = await getPermissions(uidFrom, systemId);
        // We get the instance of UserWithRoleSchema that matches the UID and the systemId
        if (fromPermissions.usersPermissions.canDelete) {
            const nanoUWR = dbInstance.db.use<UserWithRole>(tenantId);
            const userWithRole = await nanoUWR.find({
                selector: {
                    user: uidTo,
                    systemId: systemId,
                },
            });
            const nanoSys = dbInstance.db.use<System>(tenantId);
            const userWithinSystemData = await nanoSys.partitionedFind(
                'systems',
                {
                    selector: {
                        _id: systemId,
                    },
                }
            );
            const userWithinSystem = userWithinSystemData.docs[0];
            if (userWithRole.docs.length > 0) {
                await nanoUWR.destroy(
                    userWithRole.docs[0]._id,
                    userWithRole.docs[0]._rev
                );
                userWithinSystem.users = userWithinSystem.users.filter(
                    (user) => user.user !== uidTo
                );
                await nanoSys.insert(userWithinSystem);
            }
            return {
                status: 'success',
                code: 200,
//                message: 'User role deleted',
                message: 'El rol del usuario ha sido eliminado',
                data: {},
            };
        }
        return {
            status: 'failed',
            code: 400,
//            message: 'User does not have permissions to delete',
            message: 'El usuario no cuenta con permisos para eliminar',
            data: null,
        };
    },
    async getUID(req: Request) {
        const { email } = req.body;
        const tenantId = req.query.tenantId as string;
        if (!email || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: null,
            };
        }
        const nano = dbInstance.db.use<User>(tenantId);
        const user = await nano.partitionedFind('users', {
            selector: {
                email: email,
            },
        });
        if (user.docs.length > 0) {
            return {
                status: 'success',
                code: 200,
//                message: 'User found',
                message: 'El usuario ha sido encontrado exitosamente',
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
    async authenticateUser(req: Request) {
        const { email, password } = req.body;
        const tenantId = req.query.tenantId as string;
        if (!email || !password || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: null,
            };
        }
        const nano = dbInstance.db.use<User>(tenantId);
        const user = await nano.partitionedFind('users', {
            selector: {
                email: email,
            },
        });
        if (user.docs.length > 0) {
            const userToCheck = user.docs[0];
            const isPasswordCorrect = await bcrypt.compare(
                password,
                userToCheck.password
            );
            if (isPasswordCorrect) {
                const token = jwt.sign(
                    {
                        email: userToCheck.email,
                        _id: userToCheck._id,
                        tenantId: tenantId,
                    },
                    process.env.JWT_SECRET
                );
                return {
                    status: 'success',
                    code: 200,
//                    message: 'User authenticated',
                    message: 'El usuario ha sido autenticado exitosamente',
                    data: {
                        _id: userToCheck._id,
                        name: userToCheck.name,
                        lastName: userToCheck.lastName,
                        email: userToCheck.email,
                        token: token,
                        tenantId: tenantId,
                        verified: userToCheck.verified,
                    },
                };
            } else {
                return {
                    status: 'failed',
                    code: 400,
//                    message: 'Wrong password',
                    message: 'Contraseña incorrecta',
                    data: null,
                };
            }
        } else {
            return {
                status: 'failed',
                code: 400,
//                message: 'User not found',
                message: 'El usuario no ha sido encontrado',
                data: null,
            };
        }
    },
    async verifyUserAccount(req: Request) {
        const token = req.headers.authorization;
        const { email } = req.body;
        const tenantId = req.query.tenantId as string;
        if (!token || !email || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Faltan rellenar algunos campos obligatorios',
                data: {},
            };
        }
        try {
            const tokenVerification = jwt.verify(token, process.env.JWT_SECRET);
            const data = jwt.decode(token) as jwt.JwtPayload;
            // if email inside decoded is the same as in the request
            if (tokenVerification && data.email == email) {
                const nano = dbInstance.db.use<User>(tenantId);
                const user = await nano.partitionedFind('users', {
                    selector: {
                        email: email,
                    },
                });
                if (user.docs.length > 0) {
                    const userToCheck = user.docs[0];
                    if (userToCheck.verified) {
                        return {
                            status: 'failed',
                            code: 400,
//                            message: 'User already verified',
                            message: 'El usuario ya ha sido verificado',
                            data: null,
                        };
                    } else {
                        userToCheck.verified = true;
                        await nano.insert(userToCheck);
                        return {
                            status: 'success',
                            code: 200,
//                            message: 'User verified',
                            message: 'El usuario ha sido verificado exitosamente',
                            data: null,
                        };
                    }
                } else {
                    return {
                        status: 'failed',
                        code: 400,
//                        message: 'User not found',
                        message: 'El usuario no ha sido encontrado',
                        data: null,
                    };
                }
            } else {
                return {
                    status: 'failed',
                    code: 400,
//                    message: 'Invalid token',
                    message: 'Token inválido',
                    data: null,
                };
            }
        } catch (err) {
            return {
                status: 'failed',
                code: 400,
//                message: 'User not verified',
                message: 'El usuario no ha sido verificado',
                data: null,
            };
        }
    },
    async changePassword(req: Request) {
        const { _id, password, newPassword } = req.body;
        const tenantId = req.query.tenantId as string;
        // print _id, password, newPassword and tenantId
        console.log(_id, password, newPassword, tenantId);
        if (!_id || !password || !newPassword || !tenantId) {
            return {
                status: 'failed',
                code: 400,
//                message: 'Missing required fields',
                message: 'Falta rellenar algunos campos obligatorios',
                data: {},
            };
        }
        const nano = dbInstance.db.use<User>(tenantId);
        const user = await nano.partitionedFind('users', {
            selector: {
                _id: _id,
            },
        });
        if (user.docs.length > 0) {
            const userToCheck = user.docs[0];
            const isPasswordCorrect = await bcrypt.compare(
                password,
                userToCheck.password
            );
            if (isPasswordCorrect) {
                userToCheck.password = await bcrypt.hash(newPassword, 10);
                await nano.insert(userToCheck);
                return {
                    status: 'success',
                    code: 200,
//                    message: 'Password changed',
                    message: 'La contraseña ha sido modificada exitosamente',
                    data: {},
                };
            } else {
                return {
                    status: 'failed',
                    code: 400,
//                    message: 'Wrong password',
                    message: 'Contraseña incorrecta',
                    data: {},
                };
            }
        } else {
            return {
                status: 'failed',
                code: 400,
//                message: 'User not found',
                message: 'El usuario no ha sido encontrado',
                data: {},
            };
        }
    },
};

export default usersService;