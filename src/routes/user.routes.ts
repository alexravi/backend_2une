import { Router } from 'express';
import {
    getProfile, updateProfile, onboardUser,
    patchProfilePersonal, patchProfileLinks, patchProfileExperience, patchProfileEducation,
    patchProfileProjects, patchProfileCertifications, patchProfileSkills, patchProfileLanguages,
    patchProfileLocation, patchProfileAvailability, patchProfileWorkPreferences,
    patchProfileCommunications, patchProfileAccount
} from '../controllers/user.controller';
import { getUserStepCompletions, completeStep } from '../controllers/application.controller';
import { uploadResume, uploadAvatar } from '../controllers/upload.controller';
import { authenticateToken } from '../middlewares/auth';
import { uploadResumeMiddleware, uploadAvatarMiddleware } from '../middlewares/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: Onboarding and Profile Management operations
 */

// Require JWT for all user routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the current user's full profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns full user profile with all relational data
 *       401:
 *         description: Access token missing or invalid
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update basic user demographic and setting information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *               linkedInUrl:
 *                 type: string
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               studentStatus:
 *                 type: string
 *                 enum: [STUDENT, WORKING_PROFESSIONAL, FREELANCER, OTHER]
 *               domainExpertises:
 *                 type: array
 *                 items:
 *                   type: string
 *               weeklyAvailability:
 *                 type: string
 *                 enum: [HOURS_3_TO_5, HOURS_5_TO_10, HOURS_10_PLUS]
 *               preferredWorkWindow:
 *                 type: string
 *                 enum: [WEEKDAYS, WEEKENDS, FLEXIBLE]
 *               agreedToTerms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated basic demographic profile securely
 *       400:
 *         description: Validation payload error
 */
router.put('/profile', updateProfile);

/** Section-specific PATCH (auto-save, small payloads) */
router.patch('/profile/personal', patchProfilePersonal);
router.patch('/profile/links', patchProfileLinks);
router.patch('/profile/experience', patchProfileExperience);
router.patch('/profile/education', patchProfileEducation);
router.patch('/profile/projects', patchProfileProjects);
router.patch('/profile/certifications', patchProfileCertifications);
router.patch('/profile/skills', patchProfileSkills);
router.patch('/profile/languages', patchProfileLanguages);
router.patch('/profile/location', patchProfileLocation);
router.patch('/profile/availability', patchProfileAvailability);
router.patch('/profile/work-preferences', patchProfileWorkPreferences);
router.patch('/profile/communications', patchProfileCommunications);
router.patch('/profile/account', patchProfileAccount);

/**
 * @swagger
 * /api/user/onboard:
 *   post:
 *     summary: Bulk onboard the user with full multi-nested profile payload
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               linkedInUrl:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               studentStatus:
 *                 type: string
 *                 enum: [STUDENT, WORKING_PROFESSIONAL, FREELANCER, OTHER]
 *               domainExpertises:
 *                 type: array
 *                 items:
 *                   type: string
 *               weeklyAvailability:
 *                 type: string
 *                 enum: [HOURS_3_TO_5, HOURS_5_TO_10, HOURS_10_PLUS]
 *               preferredWorkWindow:
 *                 type: string
 *                 enum: [WEEKDAYS, WEEKENDS, FLEXIBLE]
 *               educations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [institutionName, degree, fieldOfStudy, startYear]
 *                   properties:
 *                     institutionName:
 *                       type: string
 *                     degree:
 *                       type: string
 *                     fieldOfStudy:
 *                       type: string
 *                     startYear:
 *                       type: integer
 *                     endYear:
 *                       type: integer
 *                     description:
 *                       type: string
 *               workExperiences:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [jobTitle, organizationName, employmentType, startMonth, startYear]
 *                   properties:
 *                     jobTitle:
 *                       type: string
 *                     organizationName:
 *                       type: string
 *                     employmentType:
 *                       type: string
 *                       enum: [FULL_TIME, PART_TIME, INTERNSHIP, FREELANCE, CONTRACT]
 *                     startMonth:
 *                       type: integer
 *                     startYear:
 *                       type: integer
 *                     endMonth:
 *                       type: integer
 *                     endYear:
 *                       type: integer
 *                     description:
 *                       type: string
 *               aiExperiences:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [hasExperience]
 *                   properties:
 *                     hasExperience:
 *                       type: boolean
 *                     platformName:
 *                       type: string
 *                     taskTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     durationMonths:
 *                       type: integer
 *                     toolsUsed:
 *                       type: string
 *               languageProficiencies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [languageName, readingLevel, writingLevel]
 *                   properties:
 *                     languageName:
 *                       type: string
 *                     readingLevel:
 *                       type: string
 *                       enum: [BASIC, INTERMEDIATE, ADVANCED, NATIVE_FLUENT]
 *                     writingLevel:
 *                       type: string
 *                       enum: [BASIC, INTERMEDIATE, ADVANCED, NATIVE_FLUENT]
 *     responses:
 *       200:
 *         description: Entire nested profile successfully onboarded via transaction
 *       400:
 *         description: Request payload mismatch
 */
router.post('/onboard', onboardUser);

/**
 * @swagger
 * /api/user/application-steps:
 *   get:
 *     summary: Get all application step completions for the current user
 *     description: Returns step completions that are reused across opportunities (e.g. resume, intro, work auth).
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user step completions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stepId: { type: string }
 *                       stepName: { type: string }
 *                       stepType: { type: string }
 *                       status: { type: string, enum: [PENDING, UPLOADED, COMPLETED] }
 *                       completedAt: { type: string, format: date-time, nullable: true }
 *                       metadata: { type: object, nullable: true }
 *       401:
 *         description: Access token missing or invalid
 */
router.get('/application-steps', getUserStepCompletions);

/**
 * @swagger
 * /api/user/application-steps/{stepId}:
 *   put:
 *     summary: Complete (or update) an application step
 *     description: Mark a step as UPLOADED or COMPLETED. Completions are reused across all opportunities.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application step ID (e.g. step-resume, step-personal-intro, step-work-auth)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [UPLOADED, COMPLETED]
 *                 description: Defaults to COMPLETED if omitted
 *               metadata:
 *                 type: object
 *                 description: Optional JSON (e.g. file URL for resume upload)
 *     responses:
 *       200:
 *         description: Updated or created step completion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 userId: { type: string }
 *                 applicationStepId: { type: string }
 *                 status: { type: string, enum: [PENDING, UPLOADED, COMPLETED] }
 *                 completedAt: { type: string, format: date-time, nullable: true }
 *                 metadata: { type: string, nullable: true }
 *       401:
 *         description: Access token missing or invalid
 *       404:
 *         description: Application step not found
 */
router.put('/application-steps/:stepId', completeStep);

router.post('/resume-upload', uploadResumeMiddleware, uploadResume);
router.post('/avatar-upload', uploadAvatarMiddleware, uploadAvatar);

export default router;
