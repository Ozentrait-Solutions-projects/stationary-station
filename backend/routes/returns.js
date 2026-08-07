const router = require('express').Router();
const {
  createReturnRequest, uploadReturnEvidence, getMyReturnRequests, getReturnRequest,
} = require('../controllers/returnController');
const { protect } = require('../middleware/auth');
const { uploadEvidence } = require('../middleware/upload');

router.use(protect);

router.post('/', createReturnRequest);
router.get('/', getMyReturnRequests);
router.get('/:id', getReturnRequest);
// Accept up to 3 photos + 1 video in a single request
router.post('/:id/evidence', uploadEvidence.fields([
  { name: 'photos', maxCount: 3 },
  { name: 'video', maxCount: 1 },
]), uploadReturnEvidence);

module.exports = router;
