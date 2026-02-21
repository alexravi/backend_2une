"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLanguage = exports.addAiExperience = exports.addWorkExperience = exports.addEducation = exports.updateProfile = exports.getProfile = void 0;
const db_1 = require("../services/db");
const user_validator_1 = require("../validators/user.validator");
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                educations: true,
                workExperiences: true,
                aiExperiences: true,
                languageProficiencies: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Parse JSON string arrays back to objects for the response
        const formattedUser = {
            ...user,
            domainExpertises: JSON.parse(user.domainExpertises || '[]'),
            aiExperiences: user.aiExperiences.map(aiExp => ({
                ...aiExp,
                taskTypes: JSON.parse(aiExp.taskTypes || '[]')
            }))
        };
        res.status(200).json(formattedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = user_validator_1.updateProfileSchema.parse(req.body);
        const updateData = { ...data };
        // Convert array back to JSON string if it's provided
        if (data.domainExpertises) {
            updateData.domainExpertises = JSON.stringify(data.domainExpertises);
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        const parsedUser = {
            ...updatedUser,
            domainExpertises: JSON.parse(updatedUser.domainExpertises || '[]')
        };
        res.status(200).json(parsedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const addEducation = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = user_validator_1.addEducationSchema.parse(req.body);
        const education = await db_1.prisma.education.create({
            data: {
                ...data,
                userId
            }
        });
        res.status(201).json(education);
    }
    catch (error) {
        next(error);
    }
};
exports.addEducation = addEducation;
const addWorkExperience = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = user_validator_1.addExperienceSchema.parse(req.body);
        const experience = await db_1.prisma.workExperience.create({
            data: {
                ...data,
                userId
            }
        });
        res.status(201).json(experience);
    }
    catch (error) {
        next(error);
    }
};
exports.addWorkExperience = addWorkExperience;
const addAiExperience = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = user_validator_1.addAiExperienceSchema.parse(req.body);
        const createData = { ...data, userId };
        if (data.taskTypes) {
            createData.taskTypes = JSON.stringify(data.taskTypes);
        }
        const aiExp = await db_1.prisma.aiExperience.create({
            data: createData
        });
        const formattedAiExp = {
            ...aiExp,
            taskTypes: JSON.parse(aiExp.taskTypes || '[]')
        };
        res.status(201).json(formattedAiExp);
    }
    catch (error) {
        next(error);
    }
};
exports.addAiExperience = addAiExperience;
const addLanguage = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = user_validator_1.addLanguageSchema.parse(req.body);
        const language = await db_1.prisma.languageProficiency.create({
            data: {
                ...data,
                userId
            }
        });
        res.status(201).json(language);
    }
    catch (error) {
        next(error);
    }
};
exports.addLanguage = addLanguage;
