const express = require('express');
const {
    getResources,
    addResource,
    updateResource,
    deleteResource
} = require('../controllers/resourceController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getResources)
    .post(addResource);

router.route('/:id')
    .put(updateResource)
    .delete(deleteResource);

module.exports = router;
