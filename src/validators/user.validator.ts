import { z } from 'zod';
import {
    StudentStatus, EmploymentType, ReadingLevel, WritingLevel,
    WeeklyAvailability, PreferredWorkWindow
} from '@prisma/client';

export const updateProfileSchema = z.object({
    fullName: z.string().optional(),
    profilePhoto: z.string().url().optional(),
    linkedInUrl: z.string().url('Must be a valid LinkedIn URL').optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    studentStatus: z.nativeEnum(StudentStatus).optional(),
    domainExpertises: z.array(z.string()).optional(),
    weeklyAvailability: z.nativeEnum(WeeklyAvailability).optional(),
    preferredWorkWindow: z.nativeEnum(PreferredWorkWindow).optional(),
    agreedToTerms: z.boolean().optional(),
});

export const addEducationSchema = z.object({
    institutionName: z.string().min(2),
    degree: z.string().min(2),
    fieldOfStudy: z.string().min(2),
    startYear: z.number().int().min(1900).max(2100),
    endYear: z.number().int().min(1900).max(2100).nullable().optional(),
    description: z.string().optional(),
});

export const addExperienceSchema = z.object({
    jobTitle: z.string().min(2),
    organizationName: z.string().min(2),
    employmentType: z.nativeEnum(EmploymentType),
    startMonth: z.number().int().min(1).max(12),
    startYear: z.number().int().min(1900).max(2100),
    endMonth: z.number().int().min(1).max(12).nullable().optional(),
    endYear: z.number().int().min(1900).max(2100).nullable().optional(),
    description: z.string().optional(),
});

export const addAiExperienceSchema = z.object({
    hasExperience: z.boolean(),
    platformName: z.string().optional(),
    taskTypes: z.array(z.string()).optional(),
    durationMonths: z.number().int().min(0).optional(),
    toolsUsed: z.string().optional(),
});

export const addLanguageSchema = z.object({
    languageName: z.string().min(2),
    readingLevel: z.nativeEnum(ReadingLevel),
    writingLevel: z.nativeEnum(WritingLevel),
});

export const onboardUserSchema = updateProfileSchema.extend({
    educations: z.array(addEducationSchema).optional(),
    workExperiences: z.array(addExperienceSchema).optional(),
    aiExperiences: z.array(addAiExperienceSchema).optional(),
    languageProficiencies: z.array(addLanguageSchema).optional(),
});
