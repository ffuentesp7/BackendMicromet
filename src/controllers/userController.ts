import usersService from '../services/usersService';
import { Request, Response } from 'express';

// Create the controller to handle all the services
const userController = {
    // Here you add all the controllers of the service
    async postUser(req: Request, res: Response) {
        await usersService
            .addUser(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },

    async getUser(req: Request, res: Response) {
        await usersService
            .getUser(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
    async putUser(req: Request, res: Response) {
        await usersService
            .updateUser(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
    async putUserRole(req: Request, res: Response) {
        await usersService
            .assignRole(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
    async getUserSystems(req: Request, res: Response) {
        await usersService
            .getUserSystems(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
    async deleteUserRole(req: Request, res: Response) {
        await usersService
            .deleteUserRole(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
    async getUID(req: Request, res: Response) {
        await usersService
            .getUID(req)
            .then((result) => {
                res.status(result.code).json(result);
            })
            .catch((err) => {
                console.log(err);
                res.status(err.code).json(err);
            });
    },
};

export default userController;
