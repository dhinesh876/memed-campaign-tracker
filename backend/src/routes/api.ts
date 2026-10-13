import { Router } from 'express';
import { signup, login } from '../controllers/authController';
import { createCampaign, getBrandCampaigns, getLiveCampaigns } from '../controllers/campaignController';
import { submitPost, getCreatorSubmissions, patchViews } from '../controllers/submissionController';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/auth/signup', asyncHandler(signup));
router.post('/auth/login', asyncHandler(login));

router.post('/campaigns', authenticate, requireRole('brand'), asyncHandler(createCampaign));
router.get('/campaigns/brand', authenticate, requireRole('brand'), asyncHandler(getBrandCampaigns));
router.get('/campaigns/live', authenticate, requireRole('creator'), asyncHandler(getLiveCampaigns));

router.post('/submissions', authenticate, requireRole('creator'), asyncHandler(submitPost));
router.get('/submissions/creator', authenticate, requireRole('creator'), asyncHandler(getCreatorSubmissions));
router.patch('/submissions/:id/views', asyncHandler(patchViews));

export default router;
