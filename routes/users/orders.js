const express = require("express");
const router = express.Router();
const db = require("../../database/database.js");
const helpers = require("../../helpers/helpers.js");
const handleResponse = helpers.handleResponse;

router.get("/", (req, res) => {
    console.log("Hello Order!!! I AM BatmanS");
    res.send("Hello Order!!!"); 
});

// ทำแล้ว
router.get('/order_items', (req, res) => {
    const query = `
        SELECT order_items.*, product.*
        FROM order_items,product
        WHERE product.product_id = order_items.product_id
    `;

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

router.get("/products", (req, res) => {
    db.all(`SELECT * FROM product`, [], (err, rows) => {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถดึงข้อมูลสินค้าได้");
        }
        return handleResponse(res, null, rows, 200, "ดึงข้อมูลสินค้าสำเร็จ");
    });
});

router.get("/products/:uid", (req, res) => {
    const uid = req.params.uid;

    db.all(`SELECT * FROM product WHERE sender_id = ?`, [uid], (err, rows) => {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถดึงข้อมูลสินค้าได้");
        }
        if (rows.length === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบสินค้าที่ตรงกับ uid นี้");
        }
        return handleResponse(res, null, rows, 200, "ดึงข้อมูลสินค้าสำเร็จ");
    });
});
// router.delete('/order_items/:userId', (req, res) => {
//     // Query ดึงข้อมูลจากตาราง order_items
//     const query = `SELECT * FROM order_items WHERE `;

//     db.all(query, [], (err, rows) => {
//         if (err) {
//             console.error(err.message);
//             res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
//             return;
//         }

//         // ส่งข้อมูลรายการสินค้าออกมาเป็น JSON
//         res.json(rows);
//     });
// });

// ทำแล้ว
router.get("/order_items/:userId", (req, res) => {
    const userId = req.params.userId;
    db.all(`
        SELECT 
            order_items.order_item_id,         
            order_items.order_id,     
            order_items.sender_id,           
            product.name_product as name_item,    
            product.detail_product as detail_item,       
            product.image_product,      
            order_items.created_date,             
            users.fullname AS sender_name           
        FROM 
            order_items
        JOIN 
            product ON order_items.product_id = product.product_id
        JOIN 
            users ON order_items.sender_id = users.uid
        WHERE 
            users.uid = ? 
        ;
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


router.post("/products/:userId", (req, res) => {
    const userId = req.params.userId;
    const { sender_id, name_product, detail_product, image_product } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!sender_id || !name_product || !detail_product || !image_product) {
        return handleResponse(res, null, null, 400, "ข้อมูลไม่ครบถ้วน");
    }

    // เพิ่มข้อมูลลงในตาราง product
    db.run(`
        INSERT INTO product (sender_id, name_product, detail_product, image_product, created_date)
        VALUES (?, ?, ?, ?, datetime('now'))
    `, [sender_id, name_product, detail_product, image_product], function(err) {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถสร้างสินค้าได้");
        }

        // ดึง product_id ที่เพิ่งถูกสร้าง
        const newProductId = this.lastID;
        return handleResponse(res, null, { product_id: newProductId }, 201, "สร้างสินค้าเรียบร้อยแล้ว");
    });
});


router.put("/order_items/:userId/:orderItemId", (req, res) => {
    const userId = req.params.userId;
    const orderItemId = req.params.orderItemId;
    const { sender_id, name_item, detail_item, image_product, image_status } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!sender_id || !name_item || !detail_item || !image_product || !image_status) {
        return handleResponse(res, null, null, 400, "ข้อมูลไม่ครบถ้วน");
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    db.run(`
        UPDATE order_items 
        SET 
            sender_id = ?, 
            name_item = ?, 
            detail_item = ?, 
            image_product = ?, 
            image_status = ?, 
            created_date = datetime('now')
        WHERE 
            order_item_id = ? AND sender_id = ?
    `, [sender_id, name_item, detail_item, image_product, image_status, orderItemId, sender_id], function(err) {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถอัปเดต order item ได้");
        }

        if (this.changes === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบ order item ที่ต้องการอัปเดต");
        }

        return handleResponse(res, null, { order_item_id: orderItemId }, 200, "อัปเดต order item สำเร็จ");
    });
});

router.delete("/order_items/:userId/:orderItemId", (req, res) => {
    const userId = req.params.userId;
    const orderItemId = req.params.orderItemId;

    // ลบข้อมูลในฐานข้อมูล
    db.run(`
        DELETE FROM order_items 
        WHERE order_item_id = ? AND sender_id = ?
    `, [orderItemId, userId], function(err) {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถลบ order item ได้");
        }

        if (this.changes === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบ order item ที่ต้องการลบ");
        }

        return handleResponse(res, null, { message: "ลบ order item สำเร็จ" }, 200, "ลบ order item สำเร็จ");
    });
});

// DELETE product by product_id
router.delete("/products/:productId", (req, res) => {
    const productId = req.params.productId;

    db.run(`DELETE FROM product WHERE product_id = ?`, [productId], function (err) {
        if (err) {
            return handleResponse(res, err, null, 500, "ไม่สามารถลบสินค้าได้");
        }
        
        if (this.changes === 0) {
            return handleResponse(res, null, null, 404, "ไม่พบสินค้าที่ต้องการลบ");
        }

        return handleResponse(res, null, null, 200, "ลบสินค้าสำเร็จ");
    });
});

module.exports = router;