import express from 'express';
import userController from '../controllers/userController';

// Create the router
const userRouter = express.Router();

// Register a user with a UID
/***
 * URL: /users/register
 * Body
 * @String name: The name of the new user
 * @String lastName: The last name of the new user
 * @String email: The email of the new user
 * @String uid: The uid of the new user (generated by Firebase)
 */
userRouter.post('/register', userController.postUser);
// Get the systems of a user providing a UID
/***
 * URL: /users/:_id/systems
 * URL Params
 * @String uid: The uid of the user
 */
userRouter.get('/:_id/systems', userController.getUserSystems);
// Get a user providing a UID
/***
 * URL: /users/:uid
 * URL Params
 * @String uid: The uid of the user
 */
userRouter.get('/:_id', userController.getUser);
// Updating a user providing a UID
/***
 * URL: /users/update
 * Body
 * @String uid: The uid of the user
 * @String name: The name of the user
 * @String lastName: The last name of the user
 */
userRouter.put('/update', userController.putUser);
// Updating the role of a user providing a UID and SystemID
/***
 * URL: /users/update/role
 * Body
 * @String uidFrom: The uid of the user that is assigning the role
 * @String uidTo: The uid of the user that is receiving the role
 * @String role: The role that is being assigned to the target user
 * @String systemId: The id of the system where the user belongs and where the role is being assigned
 */
userRouter.put('/update/role', userController.putUserRole);

// Deleting a user role providing a UID and SystemID
/***
 * URL: /users/delete/role
 * Body
 * @String uidFrom: The uid of the user that is deleting the role
 * @String uidTo: The uid of the user that is losing the role
 * @String systemId: The id of the system where the user belongs and where the role is being deleted
 *
 */
userRouter.delete('/delete/role', userController.deleteUserRole);
// Getting a user UID providing an email
/***
 * URL: /users/getUID
 * Body
 * @String email: The email of the user
 */
userRouter.post('/getUID', userController.getUID);
export default userRouter;
