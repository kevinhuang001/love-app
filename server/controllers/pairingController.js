const { User, PairingRequest, Message, Anniversary, Moment } = require('../models')
const { Op } = require('sequelize')

const sendError = (res, message, status = 400) => res.status(status).json({ error: message })
const sendSuccess = (res, data) => res.json(data)

exports.sendRequest = async (req, res, next) => {
  try {
    const { username } = req.body
    if (req.user.partnerId) return sendError(res, 'You are already paired with someone')

    const targetUser = await User.findOne({ where: { username } })
    if (!targetUser) return sendError(res, 'User not found', 404)
    if (targetUser.id === req.user.id) return sendError(res, 'Cannot pair with yourself')
    if (targetUser.partnerId) return sendError(res, 'User already paired')

    const existingRequest = await PairingRequest.findOne({
      where: { fromUserId: req.user.id, toUserId: targetUser.id, status: 'pending' },
    })
    if (existingRequest) return sendError(res, 'Request already sent')

    await PairingRequest.create({ fromUserId: req.user.id, toUserId: targetUser.id })
    sendSuccess(res, { success: true, message: 'Request sent' })
  } catch (error) {
    next(error)
  }
}

exports.getRequests = async (req, res, next) => {
  try {
    const requests = await PairingRequest.findAll({
      where: { toUserId: req.user.id, status: 'pending' },
      include: [{ model: User, as: 'Sender', attributes: ['username', 'displayName', 'avatarUrl'] }],
    })
    sendSuccess(res, requests)
  } catch (error) {
    next(error)
  }
}

exports.acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body
    if (req.user.partnerId) return sendError(res, 'You are already paired with someone')

    const request = await PairingRequest.findByPk(requestId)
    if (!request || request.toUserId !== req.user.id) return sendError(res, 'Unauthorized', 403)
    if (request.status !== 'pending') return sendError(res, 'Request already processed')

    const sender = await User.findByPk(request.fromUserId)
    if (!sender || sender.partnerId) {
      request.status = 'rejected'
      await request.save()
      return sendError(res, 'Sender is already paired with someone else')
    }

    request.status = 'accepted'
    await request.save()

    await User.update({ partnerId: request.fromUserId }, { where: { id: req.user.id } })
    await User.update({ partnerId: req.user.id }, { where: { id: request.fromUserId } })

    sendSuccess(res, { success: true })
  } catch (error) {
    next(error)
  }
}

exports.unpair = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user.partnerId) return sendError(res, 'You are not paired with anyone')

    const partner = await User.findByPk(user.partnerId)
    const userIds = [user.id, user.partnerId].filter(Boolean)

    // Clear shared data
    await Message.destroy({ where: { senderId: { [Op.in]: userIds } } })
    await Anniversary.destroy({ where: { userId: { [Op.in]: userIds } } })
    await Moment.destroy({ where: { userId: { [Op.in]: userIds } } })

    user.partnerId = null
    await user.save()
    if (partner) {
      partner.partnerId = null
      await partner.save()
    }

    sendSuccess(res, { success: true, message: 'Unpaired successfully and all shared data cleared' })
  } catch (error) {
    next(error)
  }
}
