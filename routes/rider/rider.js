const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;


// อัพเดตโปรไฟล์
router.put("/update/profile", (req, res) => {
    const { username, fullname, email, phone, license_plate, password, image_profile, uid} = req.body;  
    db.run(
      "UPDATE users SET username = ?, fullname = ?, email = ?, phone = ?,  license_plate = ?, password = ?, image_profile = ? WHERE uid = ?",
      [username, fullname, email, phone,  license_plate, password, image_profile, uid],
      function (err) {
        if (err) {
          res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต" });
          return;
        }
  
        if (this.changes > 0) {
          res.json({ message: "updated successfully" });
        } else {
          res.status(404).json({ error: "ไม่พบผู้ใช้ที่มี uid นี้" });
        }
      }
    );
  });


module.exports = router;