/*
DROP TABLE IF EXISTS users;

*/

CREATE TABLE users (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT DEFAULT NULL,
    type INTEGER CHECK(type IN (0, 1)) NOT NULL,
    license_plate TEXT DEFAULT NULL UNIQUE,
    image_profile TEXT DEFAULT NULL
);

--ผู้ใช้ระบบ
INSERT INTO users (fullname, username, email, phone, password, type, image_profile) 
VALUES ('คามาโดะ ทันจิโร่', '1', 'tanjiro@gmail.com', '0989898989', '1', '0','https://cdn.readawrite.com/articles/764/763922/thumbnail/large.gif?5');

--ไรเดอร์
INSERT INTO users (fullname, username, email, phone, password, type, image_profile) 
VALUES ('โกสต์ไรเดอร์', 'raider', 'raider@gmail.com', '0999999999', '1', '1','https://cdn.readawrite.com/articles/764/763922/thumbnail/large.gif?5');

