const { Sequelize, DataTypes } = require('sequelize');

// SQLite Datenbankverbindung initialisieren
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database/database.sqlite' // Die SQLite-Datei
});

// Definition des User-Modells
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
    accessToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING
    },
    avatarUrl: {
        type: DataTypes.STRING
    }
});

// Definition des Directory-Modells
const Directory = sequelize.define('Directory', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Für das Root-Verzeichnis oder Unterverzeichnisse
        references: {
            model: 'Directories', // Selbstreferenz
            key: 'id'
        }
    }
});

// Definition des File-Modells
const File = sequelize.define('File', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    directoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Directory,
            key: 'id'
        }
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

// User und Directory Beziehung
User.hasMany(Directory, { foreignKey: 'userId' });
Directory.belongsTo(User, { foreignKey: 'userId' });

// User und File Beziehung
User.hasMany(File, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'userId' });

// Directory und File Beziehung
Directory.hasMany(File, { foreignKey: 'directoryId' });
File.belongsTo(Directory, { foreignKey: 'directoryId' });

// Directory und Directory Beziehung (Selbstreferenz für Unterverzeichnisse)
Directory.hasMany(Directory, { foreignKey: 'parentId', as: 'Subdirectories' });
Directory.belongsTo(Directory, { foreignKey: 'parentId', as: 'ParentDirectory' });

// Datenbank initialisieren
async function initDatabase() {
    await sequelize.sync({ force: false }); // force: false, um Daten nicht zu überschreiben
}

module.exports = { sequelize, User, File, Directory, initDatabase };
