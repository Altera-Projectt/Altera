const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateBasic,
  updateMeasurements,
  updatePreferences,
  uploadAvatar,
  uploadCover,
  getActivities,
  getAllUsers,
  deleteAccount,
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadCoverImage = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', upload.single('avatar'), updateProfile);

// Profile dashboard endpoints. Keep /profile above for backwards compatibility.
router.put('/me/basic', updateBasic);
router.put('/me/measurements', updateMeasurements);
router.put('/me/preferences', updatePreferences);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.post('/me/cover', uploadCoverImage.single('cover'), uploadCover);
router.get('/me/activities', getActivities);

/**
 * @swagger
 * /api/v1/users/profile:
 *   delete:
 *     summary: Delete user account
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/profile', deleteAccount);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users retrieved
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', restrictTo('ADMIN'), getAllUsers);

module.exports = router;
