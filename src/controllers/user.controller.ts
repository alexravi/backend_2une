import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db';
import type { Prisma } from '@prisma/client';
import {
    updateProfileSchema, updateFullProfileSchema,
    addEducationSchema, addExperienceSchema,
    addAiExperienceSchema, addLanguageSchema, languageProficienciesArraySchema, onboardUserSchema,
    patchPersonalSchema, patchLinksSchema, patchExperienceSchema, patchEducationSchema,
    patchProjectsSchema, patchCertificationsSchema, patchSkillsSchema, patchLanguagesSchema,
    patchLocationSchema, patchAvailabilitySchema, patchWorkPreferencesSchema,
    patchCommunicationsSchema, patchAccountSchema
} from '../validators/user.validator';
import type { z } from 'zod';
type FullProfileData = z.infer<typeof updateFullProfileSchema>;

async function getFormattedProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            educations: true,
            workExperiences: true,
            projects: true,
            certifications: true,
            languageProficiencies: true
        }
    });
    if (!user) return null;
    return {
        ...user,
        domainExpertises: JSON.parse(user.domainExpertises || '[]'),
        languages: JSON.parse(user.languages || '[]')
    };
}

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                educations: true,
                workExperiences: true,
                projects: true,
                certifications: true,
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
            languages: JSON.parse(user.languages || '[]'),
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
        const body = req.body as Record<string, unknown>;
        const hasNested = [body.educations, body.workExperiences, body.projects, body.certifications, body.languageProficiencies].some(
            (x) => Array.isArray(x)
        );
        const data = hasNested ? updateFullProfileSchema.parse(req.body) : updateProfileSchema.parse(req.body);

        const updateData: Record<string, unknown> = { ...data };
        delete (updateData as Record<string, unknown>).educations;
        delete (updateData as Record<string, unknown>).workExperiences;
        delete (updateData as Record<string, unknown>).projects;
        delete (updateData as Record<string, unknown>).certifications;
        delete (updateData as Record<string, unknown>).languageProficiencies;

        if (data.domainExpertises) {
            updateData.domainExpertises = JSON.stringify(data.domainExpertises);
        }
        if ('languages' in data && data.languages) {
            updateData.languages = JSON.stringify(data.languages);
        }
        if (data.dateOfBirth !== undefined) {
            updateData.dateOfBirth = typeof data.dateOfBirth === 'string' ? new Date(data.dateOfBirth) : data.dateOfBirth;
        }
        // Normalize empty URL strings to null for optional link fields
        const urlFields = ['personalWebsite', 'githubUrl', 'portfolioUrl', 'twitterUrl', 'facebookUrl', 'instagramUrl'] as const;
        for (const key of urlFields) {
            if (key in updateData && (updateData[key] === '' || updateData[key] === null)) {
                updateData[key] = null;
            }
        }

        if (hasNested && ('educations' in data || 'workExperiences' in data || 'projects' in data || 'certifications' in data || 'languageProficiencies' in data)) {
            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: updateData as Parameters<typeof prisma.user.update>[0]['data']
                });

                const fullData = data as FullProfileData;

                if ('educations' in fullData) {
                    await tx.education.deleteMany({ where: { userId } });
                    if (fullData.educations?.length) {
                        const eduData: Prisma.EducationCreateManyInput[] = fullData.educations.map((edu) => ({
                            institutionName: edu.institutionName,
                            degree: edu.degree,
                            fieldOfStudy: edu.fieldOfStudy ?? '',
                            startMonth: edu.startMonth ?? undefined,
                            startYear: edu.startYear,
                            endMonth: edu.endMonth ?? undefined,
                            endYear: edu.endYear ?? undefined,
                            description: edu.description ?? undefined,
                            userId
                        }));
                        await tx.education.createMany({ data: eduData });
                    }
                }
                if ('workExperiences' in fullData) {
                    await tx.workExperience.deleteMany({ where: { userId } });
                    if (fullData.workExperiences?.length) {
                        const expData: Prisma.WorkExperienceCreateManyInput[] = fullData.workExperiences.map((exp) => ({
                            jobTitle: exp.jobTitle,
                            organizationName: exp.organizationName,
                            employmentType: exp.employmentType,
                            startMonth: exp.startMonth,
                            startYear: exp.startYear,
                            endMonth: exp.endMonth ?? undefined,
                            endYear: exp.endYear ?? undefined,
                            description: exp.description ?? undefined,
                            userId
                        }));
                        await tx.workExperience.createMany({ data: expData });
                    }
                }
                if ('projects' in fullData) {
                    await tx.project.deleteMany({ where: { userId } });
                    if (fullData.projects?.length) {
                        const projData: Prisma.ProjectCreateManyInput[] = fullData.projects.map((p) => ({
                            projectName: p.projectName,
                            projectLink: p.projectLink || null,
                            description: p.description ?? null,
                            userId
                        }));
                        await tx.project.createMany({ data: projData });
                    }
                }
                if ('certifications' in fullData) {
                    await tx.certification.deleteMany({ where: { userId } });
                    if (fullData.certifications?.length) {
                        const certData: Prisma.CertificationCreateManyInput[] = fullData.certifications.map((c) => ({
                            certificationName: c.certificationName,
                            issuingOrganization: c.issuingOrganization ?? null,
                            issueDate: c.issueDate ? (typeof c.issueDate === 'string' && c.issueDate.length <= 12
                                ? null
                                : new Date(c.issueDate as string)) : null,
                            credentialId: c.credentialId ?? null,
                            credentialUrl: c.credentialUrl || null,
                            userId
                        }));
                        await tx.certification.createMany({ data: certData });
                    }
                }
                if ('languageProficiencies' in fullData || Array.isArray(body.languageProficiencies)) {
                    await tx.languageProficiency.deleteMany({ where: { userId } });
                    const rawLangs = fullData.languageProficiencies ?? body.languageProficiencies;
                    const validatedLangs = Array.isArray(rawLangs)
                        ? languageProficienciesArraySchema.parse(rawLangs)
                        : [];
                    if (validatedLangs.length > 0) {
                        const langData: Prisma.LanguageProficiencyCreateManyInput[] = validatedLangs.map((l) => ({
                            languageName: l.languageName,
                            readingLevel: l.readingLevel,
                            writingLevel: l.writingLevel,
                            userId
                        }));
                        await tx.languageProficiency.createMany({ data: langData });
                    }
                }
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: updateData as Parameters<typeof prisma.user.update>[0]['data']
            });
        }

        const withRelations = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                educations: true,
                workExperiences: true,
                projects: true,
                certifications: true,
                languageProficiencies: true
            }
        });

        if (!withRelations) {
            return res.status(404).json({ error: 'User not found' });
        }

        const parsedUser = {
            ...withRelations,
            domainExpertises: JSON.parse(withRelations.domainExpertises || '[]'),
            languages: JSON.parse(withRelations.languages || '[]')
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

export const submitProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.update({
            where: { id: userId },
            data: { profileCompleted: true }
        });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

/** Section-specific PATCH handlers (auto-save, small payloads) */
const urlFields = ['personalWebsite', 'githubUrl', 'portfolioUrl', 'twitterUrl', 'facebookUrl', 'instagramUrl'] as const;
function normalizeUrlFields(data: Record<string, unknown>) {
    const out = { ...data };
    for (const key of urlFields) {
        if (key in out && (out[key] === '' || out[key] === null)) (out as Record<string, unknown>)[key] = null;
    }
    return out;
}

export const patchProfilePersonal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchPersonalSchema.parse(req.body) as Record<string, unknown>;
        if (data.dateOfBirth !== undefined && typeof data.dateOfBirth === 'string' && data.dateOfBirth.length > 10) {
            data.dateOfBirth = new Date(data.dateOfBirth as string);
        }
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileLinks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = normalizeUrlFields(patchLinksSchema.parse(req.body) as Record<string, unknown>);
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { workExperiences } = patchExperienceSchema.parse(req.body);
        await prisma.workExperience.deleteMany({ where: { userId } });
        if (workExperiences.length) {
            const data: Prisma.WorkExperienceCreateManyInput[] = workExperiences.map((exp) => ({
                jobTitle: exp.jobTitle,
                organizationName: exp.organizationName,
                employmentType: exp.employmentType,
                startMonth: exp.startMonth,
                startYear: exp.startYear,
                endMonth: exp.endMonth ?? undefined,
                endYear: exp.endYear ?? undefined,
                description: exp.description ?? undefined,
                userId
            }));
            await prisma.workExperience.createMany({ data });
        }
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileEducation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { educations } = patchEducationSchema.parse(req.body);
        await prisma.education.deleteMany({ where: { userId } });
        if (educations.length) {
            const data: Prisma.EducationCreateManyInput[] = educations.map((edu) => ({
                institutionName: edu.institutionName,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy ?? '',
                startMonth: edu.startMonth ?? undefined,
                startYear: edu.startYear,
                endMonth: edu.endMonth ?? undefined,
                endYear: edu.endYear ?? undefined,
                description: edu.description ?? undefined,
                userId
            }));
            await prisma.education.createMany({ data });
        }
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { projects } = patchProjectsSchema.parse(req.body);
        await prisma.project.deleteMany({ where: { userId } });
        if (projects.length) {
            await prisma.project.createMany({
                data: projects.map((p) => ({ projectName: p.projectName, projectLink: p.projectLink || null, description: p.description ?? null, userId }))
            });
        }
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileCertifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { certifications } = patchCertificationsSchema.parse(req.body);
        await prisma.certification.deleteMany({ where: { userId } });
        if (certifications.length) {
            await prisma.certification.createMany({
                data: certifications.map((c) => ({
                    certificationName: c.certificationName,
                    issuingOrganization: c.issuingOrganization ?? null,
                    issueDate: c.issueDate ? (typeof c.issueDate === 'string' && c.issueDate.length <= 12 ? null : new Date(c.issueDate as string)) : null,
                    credentialId: c.credentialId ?? null,
                    credentialUrl: c.credentialUrl || null,
                    userId
                }))
            });
        }
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { domainExpertises } = patchSkillsSchema.parse(req.body);
        await prisma.user.update({
            where: { id: userId },
            data: { domainExpertises: JSON.stringify(domainExpertises) }
        });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileLanguages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { languageProficiencies } = patchLanguagesSchema.parse(req.body);
        await prisma.languageProficiency.deleteMany({ where: { userId } });
        if (languageProficiencies.length) {
            await prisma.languageProficiency.createMany({
                data: languageProficiencies.map((l) => ({ languageName: l.languageName, readingLevel: l.readingLevel, writingLevel: l.writingLevel, userId }))
            });
        }
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchLocationSchema.parse(req.body) as Record<string, unknown>;
        if (data.dateOfBirth !== undefined && typeof data.dateOfBirth === 'string' && (data.dateOfBirth as string).length > 10) {
            data.dateOfBirth = new Date(data.dateOfBirth as string);
        }
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchAvailabilitySchema.parse(req.body);
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileWorkPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchWorkPreferencesSchema.parse(req.body) as Record<string, unknown>;
        if (data.domainExpertises !== undefined) {
            data.domainExpertises = JSON.stringify(data.domainExpertises);
        }
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileCommunications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchCommunicationsSchema.parse(req.body);
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};

export const patchProfileAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = patchAccountSchema.parse(req.body);
        await prisma.user.update({ where: { id: userId }, data: data as Parameters<typeof prisma.user.update>[0]['data'] });
        const profile = await getFormattedProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(profile);
    } catch (error) { next(error); }
};
