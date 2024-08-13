const { Sequelize, DataTypes } = require('sequelize');

// SQLite Datenbankverbindung initialisieren
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database/database.sqlite' // Die SQLite-Datei
});

// Benutzer-Modell definieren
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

// Datenbank initialisieren
async function initDatabase() {
    await sequelize.sync({ force: false }); // force: false, um Daten nicht zu überschreiben
}

module.exports = { sequelize, User, initDatabase };
