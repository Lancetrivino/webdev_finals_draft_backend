import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventure/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    public_id: (req, file) => {
      return `event-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    },
  },
});


const feedbackStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventure/feedback',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => {
      const userId = req.user?._id || 'anonymous';
      return `feedback-${userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    },
  },
});


const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventure/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => {
      const userId = req.user?._id || Date.now();
      return `avatar-${userId}`;
    },
  },
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage: eventStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});


export const uploadFeedbackPhotos = multer({
  storage: feedbackStorage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, 
    files: 5 // Maximum 5 photos per review
  },
});


export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ✅ Helper: Extract public_id from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Example: https://res.cloudinary.com/demo/image/upload/v123/eventure/feedback/feedback-123.jpg
  // Extract: eventure/feedback/feedback-123
  const matches = url.match(/\/([^/]+\/[^/]+\/[^/.]+)\./);
  return matches ? matches[1] : null;
};

// ✅ Helper: Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;