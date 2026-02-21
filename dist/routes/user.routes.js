"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: Onboarding and Profile Management operations
 */
// Require JWT for all user routes
router.use(auth_1.authenticateToken);
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
router.get('/profile', user_controller_1.getProfile);
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
router.put('/profile', user_controller_1.updateProfile);
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
router.post('/onboard', user_controller_1.onboardUser);
exports.default = router;
