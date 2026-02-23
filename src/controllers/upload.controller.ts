import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db';
import { uploadToBlob } from '../services/azure-storage';

const RESUME_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const RESUME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);
}

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const file = (req as Request & { file?: Express.Multer.File }).file;
        if (!file || !file.buffer) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!RESUME_TYPES.includes(file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type. Allowed: PDF, DOC, DOCX' });
        }
        if (file.size > RESUME_MAX_SIZE) {
            return res.status(400).json({ error: 'File too large. Max 5 MB.' });
        }

        const ext = file.originalname?.split('.').pop() || 'pdf';
        const blobPath = `resumes/${userId}/${Date.now()}-${sanitizeFilename(file.originalname || 'resume')}.${ext}`;
        const resumeUrl = await uploadToBlob(blobPath, file.buffer, file.mimetype);

        await prisma.user.update({
            where: { id: userId },
            data: { resumeUrl },
        });

        res.status(200).json({ resumeUrl });
    } catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const file = (req as Request & { file?: Express.Multer.File }).file;
        if (!file || !file.buffer) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!AVATAR_TYPES.includes(file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' });
        }
        if (file.size > AVATAR_MAX_SIZE) {
            return res.status(400).json({ error: 'File too large. Max 2 MB.' });
        }

        const ext = file.originalname?.split('.').pop() || 'jpg';
        const blobPath = `avatars/${userId}/${Date.now()}.${ext}`;
        const profilePhoto = await uploadToBlob(blobPath, file.buffer, file.mimetype);

        await prisma.user.update({
            where: { id: userId },
            data: { profilePhoto },
        });

        res.status(200).json({ profilePhoto });
    } catch (error) {
        next(error);
    }
};
