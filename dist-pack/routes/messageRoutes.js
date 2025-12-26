const express = require('express')
const router = express.Router()
const messageController = require('../controllers/messageController')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)
router.get('/', messageController.getAll)
router.post('/', messageController.create)
router.put('/:id', messageController.update)
router.delete('/:id', messageController.delete)

module.exports = router
