const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const svgCaptcha = require('svg-captcha')
const { User, Anniversary } = require('../models')
const { SECRET_KEY } = require('../middleware/auth')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const compressAvatar = async (filePath) => {
  try {
    const buffer = await sharp(filePath)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
    await fs.promises.writeFile(filePath, buffer)
  } catch (e) {
    console.error('Failed to compress avatar:', e)
  }
}

exports.getCaptcha = (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
    })

    req.session.captcha = captcha.text.toLowerCase()
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Failed to save session' })
      res.type('svg').status(200).send(captcha.data)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.register = async (req, res) => {
  try {
    const { username, password, displayName, birthday, captcha } = req.body
    const sessionCaptcha = req.session ? req.session.captcha : null

    if (!captcha || !sessionCaptcha || captcha.toLowerCase() !== sessionCaptcha) {
      return res.status(400).json({ error: 'Invalid or expired captcha' })
    }
    if (req.session) {
      delete req.session.captcha
      req.session.save()
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ username, password: hashedPassword, displayName, birthday })

    if (birthday) {
      await Anniversary.create({
        title: `${displayName || username}'s Birthday`,
        date: birthday,
        type: 'birthday',
        color: '#2C82E0',
        userId: user.id,
      })
    }

    res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { username, password, captcha } = req.body
    const sessionCaptcha = req.session ? req.session.captcha : null

    if (!captcha || !sessionCaptcha || captcha.toLowerCase() !== sessionCaptcha) {
      return res.status(400).json({ error: 'Invalid or expired captcha' })
    }
    if (req.session) {
      delete req.session.captcha
      req.session.save()
    }

    const user = await User.findOne({ where: { username } })
    if (!user) return res.status(400).json({ error: 'User not found' })

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' })

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' })
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        partnerId: user.partnerId,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMe = async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } })
  const userBirthday = await Anniversary.findOne({ where: { userId: user.id, type: 'birthday' } })

  let partner = null
  let partnerBirthdayAnniversaryId = null

  if (user.partnerId) {
    partner = await User.findByPk(user.partnerId, { attributes: { exclude: ['password'] } })
    if (partner) {
      const pBirthday = await Anniversary.findOne({ where: { userId: partner.id, type: 'birthday' } })
      if (pBirthday) partnerBirthdayAnniversaryId = pBirthday.id
    }
  }

  res.json({
    ...user.toJSON(),
    birthdayAnniversaryId: userBirthday ? userBirthday.id : null,
    partner: partner ? { ...partner.toJSON(), birthdayAnniversaryId: partnerBirthdayAnniversaryId } : null,
  })
}

exports.updateProfile = async (req, res) => {
  try {
    const user = req.user
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename)
      await compressAvatar(filePath)
      user.avatarUrl = '/uploads/' + req.file.filename
    }
    if (req.body.displayName) user.displayName = req.body.displayName
    if (req.body.birthday) {
      user.birthday = req.body.birthday
      const existing = await Anniversary.findOne({ where: { userId: user.id, type: 'birthday' } })
      if (existing) {
        existing.date = req.body.birthday
        if (req.body.birthdayColor) existing.color = req.body.birthdayColor
        if (req.body.displayName) existing.title = `${req.body.displayName}'s Birthday`
        await existing.save()
      } else {
        await Anniversary.create({
          title: `${user.displayName || user.username}'s Birthday`,
          date: req.body.birthday,
          type: 'birthday',
          color: req.body.birthdayColor || '#2C82E0',
          userId: user.id,
        })
      }
    }
    await user.save()
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
