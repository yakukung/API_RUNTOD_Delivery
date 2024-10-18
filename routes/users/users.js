const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;


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

module.exports = router;
