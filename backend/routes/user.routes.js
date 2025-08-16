import { Router } from 'express';

import authRouter from "./auth.routes.js";
import {getUser, getUsers} from "../controllers/user.controller.js";
import { authorize } from "../middlewares/auth.middleware.js";

const userRouter = new Router();

// TODO: authorize only admins to get all users
userRouter.get('/', getUsers);
userRouter.get('/:id', authorize, getUser);

userRouter.post('/users', authRouter);
userRouter.post('/users/:id', authRouter);

userRouter.put('/users/:id', authRouter);
userRouter.delete('/users/:id', authRouter);


export default userRouter;