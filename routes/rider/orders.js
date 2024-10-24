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
        WHERE orders.order_id = ?
        GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status
    `, [id], (err, rows) => {
        // จัดการข้อผิดพลาดจากการดึงข้อมูล
        if (err) {
            return handleResponse(res, err, null, 500, "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ");
        }
        // ตรวจสอบว่ามีข้อมูลคำสั่งซื้อหรือไม่
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบคำสั่งซื้อ");
        }
        // ส่งข้อมูลคำสั่งซื้อกลับ
        return handleResponse(res, null, rows);
    });
});


router.get("/list-delivery/:id", (req, res) => {
    const id = req.params.id;

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
        LEFT JOIN order_items ON orders.order_id = order_items.order_id
        WHERE orders.rider_id = ?
        GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status
    `, [id], (err, rows) => {
        // จัดการข้อผิดพลาดจากการดึงข้อมูล
        if (err) {
            return handleResponse(res, err, null, 500, "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ");
        }
        
        // ตรวจสอบว่ามีข้อมูลคำสั่งซื้อหรือไม่
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบคำสั่งซื้อสำหรับไรเดอร์นี้");
        }
        
        // ส่งข้อมูลคำสั่งซื้อกลับ
        return handleResponse(res, null, rows);
    });
});



router.put("/get-job", (req, res) => {
    const { order_id, uid } = req.body;

    // ตรวจสอบสถานะของผู้ใช้
    db.get(
        "SELECT status FROM users WHERE uid = ?",
        [uid],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: "เกิดข้อผิดพลาดในการตรวจสอบสถานะ" });
            }
            if (!row) {
                return res.status(404).json({ error: "ไม่พบผู้ใช้ที่มี uid นี้" });
            }
            if (row.status === 0) {
                // อัปเดตคำสั่งซื้อ
                db.run(
                    "UPDATE orders SET rider_id = ?, status = 1 WHERE order_id = ?",
                    [uid, order_id],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตคำสั่ง" });
                        }
                        if (this.changes > 0) {
                            // อัปเดตสถานะผู้ใช้
                            db.run(
                                "UPDATE users SET status = 1 WHERE uid = ?",
                                [uid],
                                function (err) {
                                    if (err) {
                                        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้" });
                                    }
                                    return res.json({ message: "อัปเดตเรียบร้อยแล้ว" });
                                }
                            );
                        } else {
                            return res.status(404).json({ error: "ไม่พบคำสั่งซื้อที่มี order_id นี้" });
                        }
                    }
                );
            } else {
                return res.status(403).json({ error: "ส่งงานก่อนหน้าให้เสร็จก่อนค่อยรับงานใหม่" });
            }
        }
    );
});

//เรียกดูภาพประกอบหลักฐาน
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
        WHERE orders.order_id = ?
        GROUP BY orders.order_id, sender.fullname, receiver.fullname, orders.sender_address, orders.receiver_address, orders.status
    `, [id], (err, rows) => {
        // จัดการข้อผิดพลาดจากการดึงข้อมูล
        if (err) {
            return handleResponse(res, err, null, 500, "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ");
        }
        // ตรวจสอบว่ามีข้อมูลคำสั่งซื้อหรือไม่
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบคำสั่งซื้อ");
        }
        // ส่งข้อมูลคำสั่งซื้อกลับ
        return handleResponse(res, null, rows);
    });
});





module.exports = router;


