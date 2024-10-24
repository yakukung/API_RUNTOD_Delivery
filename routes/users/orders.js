const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;

router.get("/", (req, res) => {
    console.log("Hello Order!!! I AM BatmanS");
    res.send("Hello Order!!!"); 
});

router.get('/order_items', (req, res) => {
    // Query ดึงข้อมูลจากตาราง order_items
    const query = `SELECT * FROM order_items`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
            return;
        }

        // ส่งข้อมูลรายการสินค้าออกมาเป็น JSON
        res.json(rows);
    });
});

router.get("/order_items/:userId", (req, res) => {
    const userId = req.params.userId;
    db.all(`
        SELECT 
            order_items.order_item_id,
            order_items.order_id,
            order_items.sender_id,
            order_items.name_item,
            order_items.detail_item,
            order_items.image_product,
            order_items.created_date
        FROM 
            order_items 
        JOIN 
            users AS sender ON order_items.sender_id = sender.uid 
        WHERE 
            sender.uid = ?;
    `, [userId], (err, rows) => {
        if (err) {
            return handleResponse(res, err, null, 404, "Order not found");
        }
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "Order not found"); 
        }
        return handleResponse(res, null, rows);
    });
});
module.exports = router;