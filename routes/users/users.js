const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;

//แสดงข้อมูลทั้งหมดของผู้ใช้ id นั้น
router.get("/:id", (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM users WHERE uid = ?", [id], (err, row) => {
        if (err) {
            return handleResponse(res, err, null, 404, "Customer not found");
        }
        if (!row) {
            return handleResponse(res, null, null, 404, "Customer not found");
        }
        return handleResponse(res, null, row);
    });
});

//อัพเดตที่อยู่รับของ
router.put("/set/receiving_address", (req, res) => {
  const { uid, receiving_address } = req.body;  
  db.run(
    "UPDATE users SET receiving_address = ? WHERE uid = ?",
    [receiving_address, uid],
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

// อัพเดตโปรไฟล์
router.put("/update/profile", (req, res) => {
  const { username, fullname, email, phone, address, password, image_profile, uid} = req.body;  
  db.run(
    "UPDATE users SET username = ?, fullname = ?, email = ?, phone = ?, address = ?, password = ?, image_profile = ? WHERE uid = ?",
    [username, fullname, email, phone, address, password, image_profile, uid],
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

//ลบบัญชี
router.delete("/account/delete/:id", (req, res) => {
  const uid = req.params.id;
  db.run("DELETE FROM users WHERE uid = ?", [uid], function (err) {
    handleResponse(
      res,
      err,
      { message: "ลบเรียบร้อย" },
      404,
      "Meeting not found",
      this.lid
    );
  });

});




module.exports = router;
