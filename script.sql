/*
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;

DROP TRIGGER IF EXISTS update_orders_timestamp;

*/

CREATE TABLE users (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT DEFAULT NULL,
    receiving_address TEXT DEFAULT NULL,
    type INTEGER CHECK(type IN (0, 1)) NOT NULL,
    license_plate TEXT DEFAULT NULL UNIQUE,
    image_profile TEXT DEFAULT NULL,
    status INTEGER CHECK(type IN (0, 1)) DEFAULT 0
);


-- สร้างตาราง orders สำหรับเก็บข้อมูลการสั่งซื้อ
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- รหัสออเดอร์
    receiver_id INTEGER NOT NULL,                -- รหัสผู้รับ
    sender_id INTEGER NOT NULL,                -- รหัสผู้รับ
    rider_id INTEGER DEFAULT NULL,               -- รหัสไรเดอร์ที่รับออเดอร์
    location_rider TEXT DEFAULT NULL,               -- ที่อยู่ไรเดอร์
    sender_address TEXT NOT NULL,                    -- ที่อยู่ผู้ส่ง
    receiver_address TEXT NOT NULL,                    -- ที่อยู่ผู้รับ
    status INTEGER NOT NULL DEFAULT 0             -- สถานะออเดอร์
        CHECK (status IN (0,1,2,3)),             -- 0=รอไรเดอร์รับสินค้า, 1=ไรเดอร์รับสินค้าแล้ว, 2=กำลังจัดส่ง, 3=ส่งเสร็จสิ้น
    image_status TEXT NOT NULL,                    -- ที่อยู่ภาพประกอบสถานะ
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- วันเวลาที่สร้างออเดอร์
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- วันเวลาที่อัพเดทออเดอร์ล่าสุด
    FOREIGN KEY (receiver_id) REFERENCES users(uid),
    FOREIGN KEY (sender_id) REFERENCES users(uid),
    FOREIGN KEY (rider_id) REFERENCES users(uid)
);

-- สร้างตาราง order_items สำหรับเก็บรายการสินค้าในแต่ละออเดอร์
CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT, -- รหัสรายการสินค้า
    order_id INTEGER NOT NULL,                       -- รหัสออเดอร์
    sender_id TEXT NOT NULL,                    -- idผู้ส่ง
    name_item TEXT NOT NULL,                 -- ชื่อสินค้า
    detail_item TEXT NOT NULL,                  -- รายละเอียดสินค้า
    image_product TEXT NOT NULL,                -- ที่อยู่ภาพสินค้า
    image_status TEXT NOT NULL,                    -- ที่อยู่ภาพประกอบสถานะ
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,    -- วันเวลาที่เพิ่มรายการสินค้า
    FOREIGN KEY (sender_id) REFERENCES users(uid),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TRIGGER update_orders_timestamp 
    AFTER UPDATE ON orders
BEGIN
    UPDATE orders 
    SET updated_date = CURRENT_TIMESTAMP
    WHERE order_id = NEW.order_id;
END;



--ผู้ใช้ระบบ
INSERT INTO users (fullname, username, email, phone, password, type, address,image_profile) VALUES 
('คามาโดะ ทันจิโร่', '1', 'tanjiro@gmail.com', '0989898989', '1', '0', '762Q+J4Q ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fprofile%2F0989898989%2Flarge.jpeg?alt=media&token=51fe0442-8e99-4dde-9393-147f10ab43c1'),
('โรบิ้น เวลคัมทูมายเวล', '2', 'robin@gmail.com', '0989898981', '2', '0', '66XV+85P 2202 ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fprofile%2F0989898981%2Fartworks-sgpOXr15Mrad7i6C-YGggwQ-t500x500.jpg?alt=media&token=ebd34fb3-9a25-4250-ae3c-ce1a7108502f'),
('ไรเดน เมย์', '3', 'mei@gmail.com', '0989898982', '3', '0', '764J+4MX มค.4009 ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fprofile%2F0989898982%2FScreenshot%202567-10-23%20at%2002.26.26.png?alt=media&token=c42e8817-30a0-40dd-bafd-592f15a20c02');

--ไรเดอร์
INSERT INTO users (fullname, username, email, phone, password, type, license_plate, image_profile) VALUES 
('โกสต์ไรเดอร์', 'grider', 'grider@gmail.com', '0999999999', '1', 1, 'abc1234', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fprofile%2F0999999999%2FScreenshot%202567-10-23%20at%2002.28.41.png?alt=media&token=3bbfd450-79a5-4836-9a45-a79fcacb488f'),
('Qingque', 'qrider', 'qrider@gmail.com', '0999999991', '1', 1, 'abc555', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fprofile%2F0999999991%2FScreenshot%202567-10-23%20at%2002.31.27.png?alt=media&token=2c8bf224-180c-4f64-8455-140b51ecb8d8');




INSERT INTO orders (receiver_id, sender_id, rider_id, sender_address, receiver_address, status, image_status) VALUES
    (1, 2, null, '66XV+85P 2202 ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', '762Q+J4Q ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', 0, 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.31.04.png?alt=media&token=ed447141-8754-42b6-9574-80bcc3657ada'),
    (1, 2, 5, '66XV+85P 2202 ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', '762Q+J4Q ตำบล ขามเรียง อำเภอกันทรวิชัย มหาสารคาม 44150 ประเทศไทย, , ตำบล ขามเรียง, 44150, ประเทศไทย', 2, 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.31.04.png?alt=media&token=ed447141-8754-42b6-9574-80bcc3657ada');

-- เพิ่มข้อมูลรายการสินค้าในออเดอร์ (order_items)
INSERT INTO order_items (order_id, sender_id, name_item, detail_item, image_product, image_status) VALUES
    (1, 1, 'โมเดลโทปาส', 'ไม่รุ้คิดรายละเอียดไม่ออก', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.26.42.png?alt=media&token=4f213e74-bb84-43de-b7ae-f838f4bf3748', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.31.04.png?alt=media&token=ed447141-8754-42b6-9574-80bcc3657ada'),
    (1, 1, 'โมเดลน้องคลี', 'ลูกสาวววว', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.34.25.png?alt=media&token=730e0296-87cd-4d4c-a8ed-25be3dc900ff', 'https://firebasestorage.googleapis.com/v0/b/runtod-delivery.appspot.com/o/ex_data%2Fproduct%2FScreenshot%202567-10-23%20at%2003.31.04.png?alt=media&token=ed447141-8754-42b6-9574-80bcc3657ada');



SELECT 
    orders.order_id,
    sender.fullname AS sender_name, 
    receiver.fullname AS receiver_name,
    orders.sender_address,
    orders.receiver_address,
    orders.status
FROM orders
JOIN users AS sender ON orders.sender_id = sender.uid
JOIN users AS receiver ON orders.receiver_id = receiver.uid
WHERE orders.status = 0;








                                         ตัวอย่างภาพสถานะสินค้า


    