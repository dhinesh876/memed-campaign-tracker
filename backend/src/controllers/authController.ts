import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { HttpError } from '../utils/errors';
import { validateLogin, validateSignup } from '../utils/validate';

const authResponse = (user: IUser) => ({
  token: jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: '7d' }),
  user: { id: user._id, name: user.name, email: user.email, role: user.role },
});

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = validateSignup(req.body);
  if (await User.findOne({ email })) throw new HttpError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  res.status(201).json(authResponse(user));
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = validateLogin(req.body);
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }
  res.json(authResponse(user));
};
