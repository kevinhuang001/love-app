const express = require('express')
const cors = require('cors')
const path = require('path')
const session = require('express-session')
const fs = require('fs')

const authRoutes = require('./routes/authRoutes')
const pairingRoutes = require('./routes/pairingRoutes')
const anniversaryRoutes = require('./routes/anniversaryRoutes')
const messageRoutes = require('./routes/messageRoutes')
const momentRoutes = require('./routes/momentRoutes')

const app = express()

// --- Middleware ---
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use(
  session({
    secret: 'captcha-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 600000,
      sameSite: 'lax',
    },
  }),
)

// --- Static Files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'))
}

// Serve frontend static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')))

// --- Routes ---
app.use('/api/auth', authRoutes)
app.use('/api/pairing', pairingRoutes)
app.use('/api/anniversaries', anniversaryRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/moments', momentRoutes)

// Catch-all route for SPA: serve index.html for any non-API request
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'public', 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).send('Not Found')
    }
  } else {
    res.status(404).json({ error: 'API Not Found' })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err)

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: err.errors ? err.errors.map((e) => e.message).join(', ') : err.message,
    })
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

module.exports = app
