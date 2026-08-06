const router = require('express').Router();
const {
  getProducts, getProduct, getCategories, getFeatured,
  getRecentlyViewed, trackView, addReview, searchSuggestions, checkPurchased,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/featured', getFeatured);
router.get('/categories', getCategories);
router.get('/search/suggestions', searchSuggestions);
router.get('/recently-viewed', protect, getRecentlyViewed);
router.get('/:id', getProduct);
router.post('/:id/track-view', protect, trackView);
router.post('/:id/reviews', protect, addReview);
router.get('/:id/check-purchased', protect, checkPurchased);

module.exports = router;
