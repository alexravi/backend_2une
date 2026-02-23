import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadResumeMiddleware = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single('resume');

export const uploadAvatarMiddleware = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');
