import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                passwordHash: hashedPassword
            }
        });

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'super-secret-key-12345',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(data.password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'super-secret-key-12345',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        next(error);
    }
};
