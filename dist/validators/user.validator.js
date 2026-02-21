"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardUserSchema = exports.addLanguageSchema = exports.addAiExperienceSchema = exports.addExperienceSchema = exports.addEducationSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().optional(),
    profilePhoto: zod_1.z.string().url().optional(),
    linkedInUrl: zod_1.z.string().url('Must be a valid LinkedIn URL').optional(),
    phone: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    studentStatus: zod_1.z.nativeEnum(client_1.StudentStatus).optional(),
    domainExpertises: zod_1.z.array(zod_1.z.string()).optional(),
    weeklyAvailability: zod_1.z.nativeEnum(client_1.WeeklyAvailability).optional(),
    preferredWorkWindow: zod_1.z.nativeEnum(client_1.PreferredWorkWindow).optional(),
    agreedToTerms: zod_1.z.boolean().optional(),
});
exports.addEducationSchema = zod_1.z.object({
    institutionName: zod_1.z.string().min(2),
    degree: zod_1.z.string().min(2),
    fieldOfStudy: zod_1.z.string().min(2),
    startYear: zod_1.z.number().int().min(1900).max(2100),
    endYear: zod_1.z.number().int().min(1900).max(2100).nullable().optional(),
    description: zod_1.z.string().optional(),
});
exports.addExperienceSchema = zod_1.z.object({
    jobTitle: zod_1.z.string().min(2),
    organizationName: zod_1.z.string().min(2),
    employmentType: zod_1.z.nativeEnum(client_1.EmploymentType),
    startMonth: zod_1.z.number().int().min(1).max(12),
    startYear: zod_1.z.number().int().min(1900).max(2100),
    endMonth: zod_1.z.number().int().min(1).max(12).nullable().optional(),
    endYear: zod_1.z.number().int().min(1900).max(2100).nullable().optional(),
    description: zod_1.z.string().optional(),
});
exports.addAiExperienceSchema = zod_1.z.object({
    hasExperience: zod_1.z.boolean(),
    platformName: zod_1.z.string().optional(),
    taskTypes: zod_1.z.array(zod_1.z.string()).optional(),
    durationMonths: zod_1.z.number().int().min(0).optional(),
    toolsUsed: zod_1.z.string().optional(),
});
exports.addLanguageSchema = zod_1.z.object({
    languageName: zod_1.z.string().min(2),
    readingLevel: zod_1.z.nativeEnum(client_1.ReadingLevel),
    writingLevel: zod_1.z.nativeEnum(client_1.WritingLevel),
});
exports.onboardUserSchema = exports.updateProfileSchema.extend({
    educations: zod_1.z.array(exports.addEducationSchema).optional(),
    workExperiences: zod_1.z.array(exports.addExperienceSchema).optional(),
    aiExperiences: zod_1.z.array(exports.addAiExperienceSchema).optional(),
    languageProficiencies: zod_1.z.array(exports.addLanguageSchema).optional(),
});
