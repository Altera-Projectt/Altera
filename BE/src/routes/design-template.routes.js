const express = require('express');
const router = express.Router();
const controller = require('../controllers/design-template.controller');
router.get('/', controller.list);
router.get('/:id', controller.get);

module.exports = router;
