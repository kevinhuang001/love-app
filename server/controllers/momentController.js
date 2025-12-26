const { Moment, User } = require('../models')
const { Op } = require('sequelize')
const path = require('path')
const sharp = require('sharp')
const fs = require('fs')

const generateThumbnail = async (filePath) => {
  try {
    const ext = path.extname(filePath)
    const thumbPath = filePath.replace(ext, '_thumb.jpg')
    await sharp(filePath).rotate().resize(400, 400, { fit: 'cover' }).jpeg({ quality: 70 }).toFile(thumbPath)
    return thumbPath
  } catch (e) {
    console.error('Failed to generate thumbnail:', e)
    return null
  }
}

exports.getAll = async (req, res) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const moments = await Moment.findAll({
      where: { userId: { [Op.in]: userIds } },
      include: [
        {
          model: User,
          attributes: ['id', 'displayName', 'avatarUrl'],
        },
      ],
      order: [['date', 'DESC']],
    })
    res.json(moments)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { title, description, date } = req.body
    let imageUrl = null
    let thumbnailUrl = null

    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename)
      const thumbPath = await generateThumbnail(filePath)
      if (thumbPath) {
        thumbnailUrl = imageUrl.replace(path.extname(imageUrl), '_thumb.jpg')
      }
    }

    const moment = await Moment.create({
      title,
      description,
      date,
      imageUrl,
      thumbnailUrl,
      userId: req.user.id,
    })
    res.json(moment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const moment = await Moment.findOne({ where: { id: req.params.id, userId: { [Op.in]: userIds } } })
    if (!moment) return res.status(404).json({ error: 'Moment not found' })

    // Delete files if they exist
    if (moment.imageUrl) {
      const filePath = path.join(__dirname, '..', moment.imageUrl)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      const thumbPath = path.join(
        __dirname,
        '..',
        moment.thumbnailUrl || moment.imageUrl.replace(path.extname(moment.imageUrl), '_thumb.jpg'),
      )
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath)
    }

    await moment.destroy()
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const moment = await Moment.findOne({ where: { id: req.params.id, userId: { [Op.in]: userIds } } })
    if (!moment) return res.status(404).json({ error: 'Moment not found' })

    if (req.body.title !== undefined) moment.title = req.body.title
    if (req.body.description !== undefined) moment.description = req.body.description
    if (req.body.date !== undefined) moment.date = req.body.date

    await moment.save()
    res.json(moment)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
