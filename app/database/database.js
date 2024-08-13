const { Sequelize, DataTypes } = require('sequelize');

// SQLite Datenbankverbindung initialisieren
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database/database.sqlite' // Die SQLite-Datei
});

// define User
const User = sequelize.define('User', {
    githubId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING
    },
    avatarUrl: {
        type: DataTypes.STRING
    }
});

// define File
const File = sequelize.define('File', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    }
});

User.hasMany(File, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'userId' });

// Datenbank initialisieren
async function initDatabase() {
    await sequelize.sync({ force: false }); // force: false, um Daten nicht zu überschreiben
}

module.exports = { sequelize, User, File, initDatabase };
