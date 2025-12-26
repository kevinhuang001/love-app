const app = require('./app')
const { sequelize } = require('./models')

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('Database connected.')

    // Sync models
    // In development, we use alter: true to update the schema without dropping data.
    // We disable foreign key checks and drop backup tables to avoid common SQLite/Sequelize sync errors.
    await sequelize.query('DROP TABLE IF EXISTS Users_backup;')
    await sequelize.query('PRAGMA foreign_keys = OFF;')
    await sequelize.sync({ alter: true })
    await sequelize.query('PRAGMA foreign_keys = ON;')

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Unable to start server:', error)
  }
}

startServer()
