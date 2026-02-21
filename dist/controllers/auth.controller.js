"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../services/db");
const auth_validator_1 = require("../validators/auth.validator");
const register = async (req, res, next) => {
    try {
        const data = auth_validator_1.registerSchema.parse(req.body);
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, salt);
        const user = await db_1.prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                passwordHash: hashedPassword
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'super-secret-key-12345', { expiresIn: '7d' });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const data = auth_validator_1.loginSchema.parse(req.body);
        const user = await db_1.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'super-secret-key-12345', { expiresIn: '7d' });
        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
