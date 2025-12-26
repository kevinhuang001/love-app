const express = require('express')
const router = express.Router()
const anniversaryController = require('../controllers/anniversaryController')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)
router.get('/', anniversaryController.getAll)
router.post('/', anniversaryController.create)
router.put('/:id', anniversaryController.update)
router.delete('/:id', anniversaryController.delete)

module.exports = router
