const { sequelize, User } = require('./models')
const bcrypt = require('bcryptjs')

async function seed() {
  try {
    await sequelize.sync({ force: true })
    console.log('Database synced (force: true).')

    const hashedPassword = await bcrypt.hash('password123', 10)

    const users = [
      {
        username: 'admin',
        password: hashedPassword,
        displayName: 'Admin User',
      },
      {
        username: 'user1',
        password: hashedPassword,
        displayName: 'User One',
      },
      {
        username: 'user2',
        password: hashedPassword,
        displayName: 'User Two',
      },
    ]

    for (const userData of users) {
      await User.create(userData)
      console.log(`User created: ${userData.username}`)
    }

    console.log('Seeding completed successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seed()
