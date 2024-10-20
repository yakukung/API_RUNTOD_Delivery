const express = require("express");
const router = express.Router();
const db = require("../database/database.js"); 
const { handleResponse } = require("../helpers/helpers");

router.get("/", (req, res) => {
    console.log("Hello Login!!!");
    res.send("Hello Login!!!"); 
});

// ล็อคอินผู้ใช้
router.post("/", (req, res) => {
  const { usernameOrEmailOrPhone, password } = req.body;

  if (!usernameOrEmailOrPhone || !password) {
    res.status(400).json({ error: "Username/Email/Phone and password are required" });
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  let sql;
  let params;

  if (emailRegex.test(usernameOrEmailOrPhone)) {
    sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    params = [usernameOrEmailOrPhone, password];
  } else if (phoneRegex.test(usernameOrEmailOrPhone)) {
    sql = "SELECT * FROM users WHERE phone = ? AND password = ?";
    params = [usernameOrEmailOrPhone, password];
  } else {
    sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    params = [usernameOrEmailOrPhone, password];
  }

  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(401).json({ error: "Invalid username/email/phone or password" });
      return;
    }

    const userData = { ...row };
    delete userData.password;

    res.json({ message: "Login successful", users: userData });
  });
});

module.exports = router;
