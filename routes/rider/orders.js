const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;


//แสดงข้อมูลออเดอร์ที่ยังไม่มีไรเดอร์คนไหนรับ
router.get("/", (req, res) => {
    db.all(`
    SELECT 
        orders.order_id,
        sender.fullname AS sender_name, 
        receiver.fullname AS receiver_name,
        orders.sender_address,
        orders.receiver_address,
        orders.status,
        COUNT(order_items.order_id) AS total_orders
    FROM orders
    JOIN users AS sender ON orders.sender_id = sender.uid
    JOIN users AS receiver ON orders.receiver_id = receiver.uid
    LEFT JOIN order_items ON orders.order_id = order_items.order_id  -- ใช้ LEFT JOIN เพื่อรวมข้อมูล
    WHERE orders.status = 0
    GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status;
    ;
    `, (err, rows) => {
        if (err) {
            return handleResponse(res, err, null, 404, "Order not found");
        }
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "Order not found"); 
        }
        return handleResponse(res, null, rows);
    });
});

router.get("/:id", (req, res) => {
    const id = req.params.id;
    db.get(`
        SELECT 
        orders.order_id,
        sender.fullname AS sender_name, 
        receiver.fullname AS receiver_name,
        orders.sender_address,
        orders.receiver_address,
        orders.status,
        COUNT(order_items.order_id) AS total_orders
    FROM orders
    JOIN users AS sender ON orders.sender_id = sender.uid
    JOIN users AS receiver ON orders.receiver_id = receiver.uid
    LEFT JOIN order_items ON orders.order_id = order_items.order_id
    WHERE orders.status = 0
    AND orders.order_id = ?
    GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status;
    `, [id],(err, rows) => {
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