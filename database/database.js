const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/delivery.db", (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Connected database.");
    }
});

module.exports = db;
