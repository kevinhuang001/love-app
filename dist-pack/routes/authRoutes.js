const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateToken } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})
const upload = multer({ storage })

router.get('/captcha', authController.getCaptcha)
router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticateToken, authController.getMe)
router.put('/profile', authenticateToken, upload.single('avatar'), authController.updateProfile)

module.exports = router
