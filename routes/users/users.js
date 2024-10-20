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
router.put("/update/address", (req, res) => {
    const { uid, _address } = req.body;
    db.run(
        "UPDATE users SET receiving_address = ? WHERE uid = ?",
        [ _address, uid],
        function (err) {
          handleResponse(
            res,
            err,
            { message: "updated successfully" },
            404,
            "not found",
            this.changes
          );
        }
      );
});



module.exports = router;
