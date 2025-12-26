const jwt = require('jsonwebtoken')
const { User } = require('../models')

const SECRET_KEY = 'love-app-secret-key'

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(token, SECRET_KEY, async (err, userPayload) => {
    if (err) return res.sendStatus(403)

    try {
      const user = await User.findByPk(userPayload.id)
      if (!user) return res.sendStatus(403)

      req.user = user
      next()
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
}

module.exports = { authenticateToken, SECRET_KEY }
