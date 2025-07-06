const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../data/db.sqlite');
const db = new sqlite3.Database(dbPath);

const getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

const getItinerariesByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM itineraries WHERE user_id = ?', [userId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const getItineraryById = (itineraryId) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM itineraries WHERE id = ?', [itineraryId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

const getCacheEntries = () => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT prompt, response, timestamp FROM cache ORDER BY timestamp DESC',
            [],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
};

const getDbHealth = () => {
    return new Promise((resolve) => {
        db.get('SELECT 1', [], (err) => {
            if (err) {
                return resolve({ healthy: false, error: err.message });
            }
            resolve({ healthy: true });
        });
    });
};

const insertUser = async (email, plainPassword, firstName, lastName) => {
    const hashed = await bcrypt.hash(plainPassword, 10);
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (email, password, first_name, last_name)
             VALUES (?, ?, ?, ?)`,
            [email, hashed, firstName, lastName],
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
};

const insertItinerary = (userId, title, location, days, itineraryObj) => {
    const dataStr = JSON.stringify(itineraryObj);
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO itineraries (user_id, title, location, days, data)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title, location, days, dataStr],
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
};

const updateUserPassword = async (userId, hashedPassword) => {
    const query = `UPDATE users SET password = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.run(query, [hashedPassword, userId], function (err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

const updateItinerary = (itineraryId, { title, location, days, data }) => {
    const query = `
        UPDATE itineraries
        SET title = ?, location = ?, days = ?, data = ?
        WHERE id = ?
    `;
    return new Promise((resolve, reject) => {
        db.run(query, [title, location, days, JSON.stringify(data), itineraryId], function (err) {
            if (err) return reject(err);
            resolve(this.changes > 0);
        });
    });
};

const deleteItinerary = (itineraryId) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM itineraries WHERE id = ?', [itineraryId], function (err) {
            if (err) return reject(err);
            resolve(this.changes > 0);
        });
    });
};

module.exports = {
    db,
    select: {
        getUserByEmail,
        getCacheEntries,
        getItinerariesByUserId,
        getItineraryById,
        getDbHealth,
    },
    insert: {
        insertUser,
        insertItinerary,
    },
    update: {
        updateUserPassword,
        updateItinerary,
    },
    dbDelete: {
        deleteItinerary,
    },
};
