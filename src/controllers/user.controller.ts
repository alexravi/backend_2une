import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db';
import {
    updateProfileSchema, addEducationSchema, addExperienceSchema,
    addAiExperienceSchema, addLanguageSchema, onboardUserSchema
} from '../validators/user.validator';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const user = await prisma.user.findUnique({
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
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = updateProfileSchema.parse(req.body);

        const updateData: any = { ...data };

        // Convert array back to JSON string if it's provided
        if (data.domainExpertises) {
            updateData.domainExpertises = JSON.stringify(data.domainExpertises);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        const parsedUser = {
            ...updatedUser,
            domainExpertises: JSON.parse(updatedUser.domainExpertises || '[]')
        };

        res.status(200).json(parsedUser);
    } catch (error) {
        next(error);
    }
};

export const onboardUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = onboardUserSchema.parse(req.body);

        const updateData: any = { ...data };
        delete updateData.educations;
        delete updateData.workExperiences;
        delete updateData.aiExperiences;
        delete updateData.languageProficiencies;

        if (data.domainExpertises) {
            updateData.domainExpertises = JSON.stringify(data.domainExpertises);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update primitive profile data fields
            const user = await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            // 2. Safely Clear Out Existing Lists to Replace with Incoming Data
            await tx.education.deleteMany({ where: { userId } });
            await tx.workExperience.deleteMany({ where: { userId } });
            await tx.aiExperience.deleteMany({ where: { userId } });
            await tx.languageProficiency.deleteMany({ where: { userId } });

            // 3. Insert New Nested Records
            if (data.educations && data.educations.length > 0) {
                await tx.education.createMany({
                    data: data.educations.map((edu: any) => ({ ...edu, userId }))
                });
            }

            if (data.workExperiences && data.workExperiences.length > 0) {
                await tx.workExperience.createMany({
                    data: data.workExperiences.map((exp: any) => ({ ...exp, userId }))
                });
            }

            if (data.aiExperiences && data.aiExperiences.length > 0) {
                await tx.aiExperience.createMany({
                    data: data.aiExperiences.map((exp: any) => ({
                        ...exp,
                        userId,
                        taskTypes: exp.taskTypes ? JSON.stringify(exp.taskTypes) : '[]'
                    }))
                });
            }

            if (data.languageProficiencies && data.languageProficiencies.length > 0) {
                await tx.languageProficiency.createMany({
                    data: data.languageProficiencies.map((lang: any) => ({ ...lang, userId }))
                });
            }

            // 4. Return Full Updated Profile
            return await tx.user.findUnique({
                where: { id: userId },
                include: {
                    educations: true,
                    workExperiences: true,
                    aiExperiences: true,
                    languageProficiencies: true
                }
            });
        });

        // Format raw string back to JSON Array
        const formattedUser = {
            ...result,
            domainExpertises: JSON.parse(result!.domainExpertises || '[]'),
            aiExperiences: result!.aiExperiences.map(aiExp => ({
                ...aiExp,
                taskTypes: JSON.parse(aiExp.taskTypes || '[]')
            }))
        };

        res.status(200).json({ message: 'User Onboarded Successfully', profile: formattedUser });
    } catch (error) {
        next(error);
    }
};
