const { Sequelize, DataTypes } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
})

const User = sequelize.define(
  'User',
  {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 20],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      defaultValue: function () {
        return this.username
      },
    },
    avatarUrl: {
      type: DataTypes.STRING,
    },
    birthday: {
      type: DataTypes.DATEONLY,
    },
    partnerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    indexes: [{ unique: true, fields: ['username'] }],
  },
)

const PairingRequest = sequelize.define('PairingRequest', {
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
})

const Anniversary = sequelize.define('Anniversary', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'other',
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: 'primary',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
})

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
})

const Moment = sequelize.define('Moment', {
  title: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
})

// Associations
User.hasMany(Message, { foreignKey: 'senderId' })
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' })

User.hasMany(PairingRequest, { as: 'SentRequests', foreignKey: 'fromUserId' })
User.hasMany(PairingRequest, { as: 'ReceivedRequests', foreignKey: 'toUserId' })
PairingRequest.belongsTo(User, { as: 'Sender', foreignKey: 'fromUserId' })
PairingRequest.belongsTo(User, { as: 'Receiver', foreignKey: 'toUserId' })

User.hasMany(Anniversary, { foreignKey: 'userId' })
Anniversary.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Moment, { foreignKey: 'userId' })
Moment.belongsTo(User, { foreignKey: 'userId' })

// Self-referential association for partners
User.belongsTo(User, { as: 'Partner', foreignKey: 'partnerId' })

module.exports = { sequelize, User, PairingRequest, Anniversary, Message, Moment }
