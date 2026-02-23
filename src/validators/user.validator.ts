import { z } from 'zod';
import {
    StudentStatus, EmploymentType, ReadingLevel, WritingLevel,
    WeeklyAvailability, PreferredWorkWindow
} from '@prisma/client';

export const updateProfileSchema = z.object({
    fullName: z.string().optional(),
    profilePhoto: z.string().optional(),
    linkedInUrl: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    studentStatus: z.nativeEnum(StudentStatus).optional(),
    dateOfBirth: z.union([z.string().datetime(), z.date()]).optional(),
    workAuthCountry: z.string().optional(),
    locationSameAsPhysical: z.boolean().optional(),
    legalWorkAuthorized: z.boolean().optional(),
    legalNotifyRelocation: z.boolean().optional(),
    availabilityToStart: z.string().optional(),
    preferredHoursPerWeek: z.number().int().min(0).max(168).optional(),
    timezone: z.string().optional(),
    workingHours: z.string().optional(),
    dateSpecificExceptions: z.string().optional(),
    domainExpertises: z.array(z.string()).optional(),
    minFullTimeCompensationYear: z.number().int().min(0).optional(),
    minPartTimeCompensationHour: z.number().int().min(0).optional(),
    notifyEmail: z.boolean().optional(),
    notifySms: z.boolean().optional(),
    notifyFullTime: z.boolean().optional(),
    notifyPartTime: z.boolean().optional(),
    notifyReferral: z.boolean().optional(),
    notifyJobOpportunities: z.boolean().optional(),
    notifyWorkUpdates: z.boolean().optional(),
    unsubscribeAll: z.boolean().optional(),
    resumeUrl: z.string().optional(),
    generativeProfileEnabled: z.boolean().optional(),
    referredBy: z.string().optional(),
    weeklyAvailability: z.nativeEnum(WeeklyAvailability).optional(),
    preferredWorkWindow: z.nativeEnum(PreferredWorkWindow).optional(),
    agreedToTerms: z.boolean().optional(),
    // Personal / Resume
    about: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    personalWebsite: z.string().url().optional().or(z.literal('')),
    githubUrl: z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    facebookUrl: z.string().url().optional().or(z.literal('')),
    instagramUrl: z.string().url().optional().or(z.literal('')),
    languages: z.array(z.string()).optional(),
});

export const addEducationSchema = z.object({
    institutionName: z.string().min(2),
    degree: z.string().min(2),
    fieldOfStudy: z.string().optional().default(''),
    startMonth: z.number().int().min(1).max(12).nullable().optional(),
    startYear: z.number().int().min(1900).max(2100),
    endMonth: z.number().int().min(1).max(12).nullable().optional(),
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

export const languageProficienciesArraySchema = z.array(addLanguageSchema);

export const addProjectSchema = z.object({
    projectName: z.string().min(1),
    projectLink: z.string().url().optional().or(z.literal('')).nullable(),
    description: z.string().optional().nullable(),
});

export const addCertificationSchema = z.object({
    certificationName: z.string().min(1),
    issuingOrganization: z.string().optional().nullable(),
    issueDate: z.union([z.string().datetime(), z.date(), z.string()]).optional().nullable(),
    credentialId: z.string().optional().nullable(),
    credentialUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export const onboardUserSchema = updateProfileSchema.extend({
    educations: z.array(addEducationSchema).optional(),
    workExperiences: z.array(addExperienceSchema).optional(),
    aiExperiences: z.array(addAiExperienceSchema).optional(),
    languageProficiencies: z.array(addLanguageSchema).optional(),
});

/** Full profile update: User fields + replace-all nested lists */
export const updateFullProfileSchema = updateProfileSchema.extend({
    educations: z.array(addEducationSchema).optional(),
    workExperiences: z.array(addExperienceSchema).optional(),
    projects: z.array(addProjectSchema).optional(),
    certifications: z.array(addCertificationSchema).optional(),
    languageProficiencies: z.array(addLanguageSchema).optional(),
});

/** Section-specific PATCH schemas (for auto-save, small payloads) */
export const patchPersonalSchema = z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    dateOfBirth: z.union([z.string().datetime(), z.string(), z.date()]).optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    about: z.string().optional(),
});

export const patchLinksSchema = z.object({
    linkedInUrl: z.string().optional(),
    personalWebsite: z.string().url().optional().or(z.literal('')),
    githubUrl: z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    facebookUrl: z.string().url().optional().or(z.literal('')),
    instagramUrl: z.string().url().optional().or(z.literal('')),
});

export const patchExperienceSchema = z.object({
    workExperiences: z.array(addExperienceSchema),
});

export const patchEducationSchema = z.object({
    educations: z.array(addEducationSchema),
});

export const patchProjectsSchema = z.object({
    projects: z.array(addProjectSchema),
});

export const patchCertificationsSchema = z.object({
    certifications: z.array(addCertificationSchema),
});

export const patchSkillsSchema = z.object({
    domainExpertises: z.array(z.string()),
});

export const patchLanguagesSchema = z.object({
    languageProficiencies: z.array(addLanguageSchema),
});

export const patchLocationSchema = z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    locationSameAsPhysical: z.boolean().optional(),
    dateOfBirth: z.union([z.string().datetime(), z.string(), z.date()]).optional(),
    legalWorkAuthorized: z.boolean().optional(),
    legalNotifyRelocation: z.boolean().optional(),
});

export const patchAvailabilitySchema = z.object({
    availabilityToStart: z.string().optional(),
    preferredHoursPerWeek: z.number().int().min(0).max(168).optional(),
    timezone: z.string().optional(),
    workingHours: z.string().optional(),
    dateSpecificExceptions: z.string().optional(),
    weeklyAvailability: z.nativeEnum(WeeklyAvailability).optional(),
    preferredWorkWindow: z.nativeEnum(PreferredWorkWindow).optional(),
});

export const patchWorkPreferencesSchema = z.object({
    domainExpertises: z.array(z.string()).optional(),
    minFullTimeCompensationYear: z.number().int().min(0).optional(),
    minPartTimeCompensationHour: z.number().int().min(0).optional(),
});

export const patchCommunicationsSchema = z.object({
    notifyEmail: z.boolean().optional(),
    notifySms: z.boolean().optional(),
    notifyFullTime: z.boolean().optional(),
    notifyPartTime: z.boolean().optional(),
    notifyReferral: z.boolean().optional(),
    notifyJobOpportunities: z.boolean().optional(),
    notifyWorkUpdates: z.boolean().optional(),
    unsubscribeAll: z.boolean().optional(),
});

export const patchAccountSchema = z.object({
    generativeProfileEnabled: z.boolean().optional(),
});
