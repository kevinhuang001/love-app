const { Sequelize, DataTypes } = require('sequelize')
const path = require('path')
const fs = require('fs')

async function migrate() {
  const sourceDbPath = path.join(__dirname, 'database.sqlite')
  const targetDbPath = path.join(__dirname, '..', 'database2.sqlite')

  if (!fs.existsSync(sourceDbPath)) {
    console.error(`Error: Source database not found at ${sourceDbPath}`)
    process.exit(1)
  }

  console.log(`Copying ${sourceDbPath} to ${targetDbPath}...`)
  fs.copyFileSync(sourceDbPath, targetDbPath)

  try {
    console.log('Synchronizing database schema...')

    // Create a new Sequelize instance specifically for migration that points to database2.sqlite
    const targetSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: targetDbPath,
      logging: false, // Turn off logging for cleaner output
    })

    // Define models on the target instance (mimicking models.js)
    const User = targetSequelize.define('User', {
      username: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      displayName: { type: DataTypes.STRING },
      avatarUrl: { type: DataTypes.STRING },
      birthday: { type: DataTypes.DATEONLY },
      partnerId: { type: DataTypes.INTEGER },
    })

    const PairingRequest = targetSequelize.define('PairingRequest', {
      status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' },
      fromUserId: { type: DataTypes.INTEGER, allowNull: false },
      toUserId: { type: DataTypes.INTEGER, allowNull: false },
    })

    const Anniversary = targetSequelize.define('Anniversary', {
      title: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATE, allowNull: false },
      description: { type: DataTypes.TEXT },
      type: { type: DataTypes.STRING, defaultValue: 'other' },
      color: { type: DataTypes.STRING, defaultValue: 'primary' },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    })

    const Message = targetSequelize.define('Message', {
      content: { type: DataTypes.TEXT, allowNull: false },
      senderId: { type: DataTypes.INTEGER, allowNull: false },
    })

    const Moment = targetSequelize.define('Moment', {
      title: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },
      date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      imageUrl: { type: DataTypes.STRING },
      thumbnailUrl: { type: DataTypes.STRING },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    })

    // Define associations to match models.js (to handle foreign keys correctly)
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
    User.belongsTo(User, { as: 'Partner', foreignKey: 'partnerId' })

    // Sync will update the schema to match the models
    // Using alter: true can be tricky with foreign keys in SQLite
    // Let's try to disable foreign key checks during migration if needed,
    // but first let's try with proper associations.
    await targetSequelize.query('PRAGMA foreign_keys = OFF')
    await targetSequelize.sync({ alter: true })
    await targetSequelize.query('PRAGMA foreign_keys = ON')

    console.log('Migration completed successfully.')
    console.log(`Updated database saved to: ${targetDbPath}`)

    await targetSequelize.close()
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
