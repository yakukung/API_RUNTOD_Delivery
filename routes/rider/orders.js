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
router.get("image/status/2/orderID/:id", (req, res) => {
    const id = req.params.id;

    db.get(`
        SELECT 
            o.order_id,
            sd.status
            sd.image_status
        FROM orders o, status_delivery sd
        WHERE o.order_id = ?
        AND sd.status = 2
    `, [id], (err, rows) => {
        // จัดการข้อผิดพลาดจากการดึงข้อมูล
        if (err) {
            return handleResponse(res, err, null, 500, "เกิดข้อผิดพลาด");
        }
        if (!rows || rows.length === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบ");
        }
        // ส่งข้อมูลกลับ
        return handleResponse(res, null, rows);
    });
});


// อัพเดตภาพสถานะส่ง 2
router.post("/image/status", (req, res) => {
    const { order_id, image_status, status } = req.body;
    console.log("Received data:", req.body);

    db.serialize(() => {
        // เริ่มต้นธุรกรรม
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                return handleResponse(res, err, null, 500, "error");
            }

            // แทรกข้อมูลสถานะการส่ง
            db.run(
                "INSERT INTO status_delivery (order_id, image_status, status) VALUES (?, ?, ?)",
                [order_id, image_status, status],
                function (err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return handleResponse(res, err, null, 400, "error");
                    }

                    // อัปเดตสถานะในตาราง orders
                    db.run(
                        "UPDATE orders SET status = ? WHERE order_id = ?",
                        [status, order_id],
                        function (err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return handleResponse(res, err, null, 400, "error");
                            }

                            // เสร็จสิ้นธุรกรรม
                            db.run("COMMIT", (err) => {
                                if (err) {
                                    return handleResponse(res, err, null, 500, "error");
                                }
                                handleResponse(res, null, { message: "successfully", id: this.lastID }, 201, "success");
                            });
                        }
                    );
                }
            );
        });
    });
});



// อัพเดตภาพสถานะส่ง 3
router.post("/image/status/success", (req, res) => {
    const { order_id, image_status, status } = req.body;
    console.log("Received data:", req.body);

    db.serialize(() => {
        // เริ่มต้นธุรกรรม
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                return handleResponse(res, err, null, 500, "error");
            }

            // แทรกข้อมูลสถานะการส่ง
            db.run(
                "INSERT INTO status_delivery (order_id, image_status, status) VALUES (?, ?, ?)",
                [order_id, image_status, status],
                function (err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return handleResponse(res, err, null, 400, "error");
                    }

                    // อัปเดตสถานะในตาราง orders
                    db.run(
                        "UPDATE orders SET status = ? WHERE order_id = ?",
                        [status, order_id],
                        function (err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return handleResponse(res, err, null, 400, "error");
                            }

                            // อัปเดตสถานะในตาราง users (แก้ไขให้ใช้ uid จากฐานข้อมูล)
                            db.run(
                                "UPDATE users SET status = 0 WHERE uid = (SELECT rider_id FROM orders WHERE order_id = ?)",
                                [order_id],
                                function (err) {
                                    if (err) {
                                        db.run("ROLLBACK");
                                        return handleResponse(res, err, null, 400, "error");
                                    }

                                    db.run("COMMIT", (err) => {
                                        if (err) {
                                            return handleResponse(res, err, null, 500, "error");
                                        }
                                        handleResponse(res, null, { message: "successfully", id: this.lastID }, 201, "success");
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});



module.exports = router;


