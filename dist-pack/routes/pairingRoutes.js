const express = require('express')
const router = express.Router()
const pairingController = require('../controllers/pairingController')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)
router.post('/request', pairingController.sendRequest)
router.get('/requests', pairingController.getRequests)
router.post('/accept', pairingController.acceptRequest)
router.post('/unpair', pairingController.unpair)

module.exports = router
