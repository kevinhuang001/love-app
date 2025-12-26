const { Message, User } = require('../models')
const { Op } = require('sequelize')

/**
 * 封装统一的响应处理
 */
const sendError = (res, message, status = 400) => res.status(status).json({ error: message })
const sendSuccess = (res, data) => res.json(data)

exports.getAll = async (req, res, next) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const messages = await Message.findAll({
      where: { senderId: { [Op.in]: userIds } },
      include: { model: User, as: 'Sender', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
      order: [['createdAt', 'ASC']],
    })
    sendSuccess(res, messages)
  } catch (e) {
    next(e)
  }
}

exports.create = async (req, res, next) => {
  try {
    const message = await Message.create({
      content: req.body.content,
      senderId: req.user.id,
    })
    const fullMessage = await Message.findByPk(message.id, {
      include: { model: User, as: 'Sender', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
    })
    sendSuccess(res, fullMessage)
  } catch (error) {
    next(error)
  }
}

exports.update = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id)
    if (!message) return sendError(res, 'Message not found', 404)
    if (message.senderId !== req.user.id) return sendError(res, 'Unauthorized', 403)

    message.content = req.body.content
    await message.save()
    sendSuccess(res, message)
  } catch (e) {
    next(e)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id)
    if (!message) return sendError(res, 'Message not found', 404)
    if (message.senderId !== req.user.id) return sendError(res, 'Unauthorized', 403)

    await message.destroy()
    sendSuccess(res, { success: true })
  } catch (e) {
    next(e)
  }
}
