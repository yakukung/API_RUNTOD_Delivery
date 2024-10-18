const express = require("express");
const router = express.Router();
const db = require("../database/database.js"); 
const { handleResponse } = require("../helpers/helpers");


// สมัครบัญชีผู้ใช้
router.post("/user", (req, res) => {
  const { username, fullname, email, phone, password } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return handleResponse(res, err, null, 500, "error");
      }
      
      db.run(
        "INSERT INTO users (username, fullname, email, phone, password, type) VALUES (?, ?, ?, ?, ?, 0)", 
        [username, fullname, email, phone, password],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return handleResponse(res, err, null, 400, "error"); 
          }
          
          db.run("COMMIT", (err) => {
            if (err) {
              return handleResponse(res, err, null, 500, "error");
            }
            handleResponse(res, null, { message: "Register successfully", id: this.lastID }, 201, "success"); 
          });
        }
      );
    });
  });
});

// สมัครบัญชีไรเดอร์
router.post("/raider", (req, res) => {
    const { username, fullname, email, phone, password, license_plate } = req.body;
  
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          return handleResponse(res, err, null, 500, "error");
        }
        
        db.run(
          "INSERT INTO users (username, fullname, email, phone, password, license_plate, type) VALUES (?, ?, ?, ?, ?, ?, 1)", 
          [username, fullname, email, phone, password, license_plate],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return handleResponse(res, err, null, 400, "error");
            }
            
            db.run("COMMIT", (err) => {
              if (err) {
                return handleResponse(res, err, null, 500, "error");
              }
              handleResponse(res, null, { message: "Register successfully", id: this.lastID }, 201, "success"); 
            });
          }
        );
      });
    });
  });

module.exports = router;
