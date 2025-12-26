const express = require('express')
const router = express.Router()
const momentController = require('../controllers/momentController')
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

router.use(authenticateToken)
router.get('/', momentController.getAll)
router.post('/', upload.single('image'), momentController.create)
router.put('/:id', momentController.update)
router.delete('/:id', momentController.delete)

module.exports = router
