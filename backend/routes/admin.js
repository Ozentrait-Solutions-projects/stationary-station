const router = require('express').Router();
const {
  getDashboard, getOrderDetails, getAllOrders, updateOrderStatus,
  getAllUsers, createProduct, updateProduct, deleteProduct,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetails);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.post('/products', upload.single('image'), createProduct);
router.put('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
