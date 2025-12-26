const { Anniversary } = require('../models')
const { Op } = require('sequelize')

const sendError = (res, message, status = 400) => res.status(status).json({ error: message })
const sendSuccess = (res, data) => res.json(data)

exports.getAll = async (req, res, next) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const items = await Anniversary.findAll({
      where: { userId: { [Op.in]: userIds } },
      order: [['id', 'ASC']],
    })

    // Filter unique start_date (only keep one for the pair)
    const result = []
    let foundStartDate = false
    for (const item of items) {
      if (item.type === 'start_date') {
        if (!foundStartDate) {
          result.push(item)
          foundStartDate = true
        }
      } else {
        result.push(item)
      }
    }
    sendSuccess(res, result)
  } catch (error) {
    next(error)
  }
}

exports.create = async (req, res, next) => {
  try {
    const { type } = req.body
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    if (type === 'start_date') {
      const existing = await Anniversary.findOne({
        where: { type: 'start_date', userId: { [Op.in]: userIds } },
      })
      if (existing) {
        await existing.update(req.body)
        return sendSuccess(res, existing)
      }
    }

    const item = await Anniversary.create({
      ...req.body,
      userId: req.user.id,
    })
    sendSuccess(res, item)
  } catch (error) {
    next(error)
  }
}

exports.update = async (req, res, next) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const item = await Anniversary.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
    })
    if (!item) return sendError(res, 'Not found or unauthorized', 404)

    await item.update(req.body)
    sendSuccess(res, item)
  } catch (error) {
    next(error)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const userIds = [req.user.id]
    if (req.user.partnerId) userIds.push(req.user.partnerId)

    const item = await Anniversary.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
    })
    if (!item) return sendError(res, 'Not found or unauthorized', 404)

    if (item.type === 'start_date' || item.type === 'birthday') {
      return sendError(res, 'Cannot delete start date or birthday cards', 403)
    }

    await item.destroy()
    sendSuccess(res, { success: true })
  } catch (error) {
    next(error)
  }
}
