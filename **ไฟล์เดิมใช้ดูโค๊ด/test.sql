/*
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS lotto_prize;
DROP TABLE IF EXISTS lotto;
DROP TABLE IF EXISTS my_lotto;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS basket;
DROP TABLE IF EXISTS wallet;
DROP TABLE IF EXISTS wallet_list;

ALTER TABLE lotto RENAME TO lotto_prize;
*/

CREATE TABLE users (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    type INTEGER CHECK(type IN (0, 1)) DEFAULT 1 NOT NULL,
    wallet DECIMAL(10, 2) DEFAULT 0.00,
    image TEXT DEFAULT NULL
);

CREATE TABLE wallet(
  wallet DECIMAL(10, 2) DEFAULT 0.00
);


CREATE TABLE lotto (
  lid INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL,
   type TEXT CHECK(type IN ('หวยเดี่ยว', 'หวยชุด')),
  price DECIMAL(10, 2) DEFAULT 0.00,
  lotto_quantity INTEGER DEFAULT 0,
  date TEXT DEFAULT (datetime('now'))
);

CREATE TABLE lotto_prize (
  lpid INTEGER PRIMARY KEY AUTOINCREMENT,
  lid INTEGER NOT NULL,
  prize INTEGER DEFAULT 0,
  wallet_prize INTEGER DEFAULT 0,
  date TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (lid) REFERENCES lotto (lid)
);




CREATE TABLE basket (
  bid INTEGER PRIMARY KEY AUTOINCREMENT,
  lid INTEGER NOT NULL,
  uid INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  status INTEGER CHECK(status IN (0, 1)) DEFAULT 0 NOT NULL,
  FOREIGN KEY (lid) REFERENCES lotto (lid),
  FOREIGN KEY (uid) REFERENCES users (uid)
);

CREATE TABLE payment (
  pid INTEGER PRIMARY KEY AUTOINCREMENT,
  uid INTEGER NOT NULL,
  lid INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  date TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (lid) REFERENCES lotto (lid),
  FOREIGN KEY (uid) REFERENCES users (uid)
);


CREATE TABLE my_lotto (
  mlid INTEGER PRIMARY KEY AUTOINCREMENT,
  uid INTEGER NOT NULL,
  lid INTEGER NOT NULL,
  total_quantity INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  date TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (lid) REFERENCES lotto (lid),
  FOREIGN KEY (uid) REFERENCES users (uid)
);


CREATE TABLE wallet_list (
  wlid INTEGER PRIMARY KEY AUTOINCREMENT,
  uid INTEGER NOT NULL,
  pid INTEGER DEFAULT NULL,
  total_price INTEGER NOT NULL,
  date TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours')),
  FOREIGN KEY (uid) REFERENCES users (uid),
  FOREIGN KEY (pid) REFERENCES payment (pid)
);




--Insert table users
INSERT INTO users (fullname, username, email, phone, password, type, wallet) 
VALUES ('Admin', 'admin', 'admin@gmail.com', '0999911111', '1', 0, 0.00);

INSERT INTO users (fullname, username, email, phone, password, type, wallet) 
VALUES ('Admin Kung', 'admin_kung', 'adminkung@gmail.com', '0987654321', '1', 0, 0.00);

INSERT INTO users (fullname, username, email, phone, password, wallet, image) 
VALUES ('อัษฎาวุธ ไชยรักษ์', 'yakukung', 'k@gmail.com', '0910091988', '1', 3000.00, 'https://static.wikia.nocookie.net/gensin-impact/images/e/e4/Icon_Emoji_Paimon%27s_Paintings_23_Cyno_1.png/revision/latest?cb=20230506045219');

INSERT INTO users (fullname, username, email, phone, password, wallet) 
VALUES ('ผู้มาเยือนนิรนาม', 'kung', 'kung@gmail.com', '0950939712', '123', 3000.00);

INSERT INTO users (fullname, username, email, phone, password, wallet, image) 
VALUES ('Yakukung', 'kung123', 'kung123@gmail.com', '0950855604', '123', 3000.00, 'https://static.wikia.nocookie.net/gensin-impact/images/e/e4/Icon_Emoji_Paimon%27s_Paintings_23_Cyno_1.png/revision/latest?cb=20230506045219');

INSERT INTO users (fullname, username, email, phone, password, wallet, image) 
VALUES ('คามาโดะ ทันจิโร่', '1', 'tanjiro@gmail.com', '0989898989', '1', 3000.00, 'https://cdn.readawrite.com/articles/764/763922/thumbnail/large.gif?5');


--Insert table  wallet
INSERT INTO wallet VALUES(3000.00);


--Insert table lotto แบบออโต้

WITH RECURSIVE
  numbers AS (
    SELECT 1 AS lid
    UNION ALL
    SELECT lid + 1
    FROM numbers
    WHERE lid < 100
  )
INSERT INTO lotto (lid, number, type, price, lotto_quantity, date)
SELECT
  lid,
  (ABS(RANDOM()) % 900000 + 100000) AS number,
  CASE
    WHEN lid <= 50 THEN 'หวยเดี่ยว'
    ELSE 'หวยชุด'
  END AS type,
  CASE
    WHEN lid <= 50 THEN 80.00
    ELSE 400.00
  END AS price,
  150 AS lotto_quantity, 
  datetime('now') AS date
FROM numbers;


-- Insert table lotto_prize กำหนดรางวัล
INSERT INTO lotto_prize (lid, prize, wallet_prize) VALUES (1, 5, 100000);
INSERT INTO lotto_prize (lid, prize, wallet_prize) VALUES (2, 4, 500000);
INSERT INTO lotto_prize (lid, prize, wallet_prize) VALUES (3, 3, 1000000);
INSERT INTO lotto_prize (lid, prize, wallet_prize) VALUES (4, 2, 2000000);
INSERT INTO lotto_prize (lid, prize, wallet_prize) VALUES (5, 1, 6000000);



INSERT INTO lotto_prize (lid, prize, wallet_prize)
SELECT 
    lid,
    2 AS prize,
    CASE
        WHEN 2 = 1 THEN 6000000
        WHEN 2 = 2 THEN 2000000
        WHEN 2 = 3 THEN 1000000
        WHEN 2 = 4 THEN 500000
        WHEN 2 = 5 THEN 100000
        ELSE 0
    END AS wallet_prize
FROM lotto
ORDER BY RANDOM()
LIMIT 1;


UPDATE lotto_prize
SET 
    lid = (SELECT lid FROM lotto ORDER BY RANDOM() LIMIT 1),
    prize = 2,
    wallet_prize = CASE
        WHEN prize = 1 THEN 6000000
        WHEN prize = 2 THEN 2000000
        WHEN prize = 3 THEN 1000000
        WHEN prize = 4 THEN 500000
        WHEN prize = 5 THEN 100000
        ELSE 0
    END
WHERE lpid = (SELECT lpid FROM lotto_prize ORDER BY RANDOM() LIMIT 1);



DELETE FROM lotto_prize
WHERE lpid = 3;

SELECT * FROM lotto
SELECT * FROM lotto_prize

SELECT * FROM lotto WHERE lid = 46


-- INSERT INTO lotto (number, type, price, lotto_quantity, date) VALUES (123456, 'หวยเดี่ยว', 80, 99, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number, type, price, lotto_quantity, date) VALUES (654321, 'หวยชุด', 400, 40, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (112233, 'หวยเดี่ยว', 80, 54, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (888999, 'หวยชุด', 400, 19, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (123321, 'หวยเดี่ยว', 80, 23, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (111111, 'หวยเดี่ยว', 80, 10, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (122222, 'หวยเดี่ยว', 80, 9, '2024-08-23 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (676767, 'หวยเดี่ยว', 80, 9, '2024-08-23 13:02:19');


-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (222222, 'หวยเดี่ยว', 80, 9, '2024-08-24 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (232323, 'หวยชุด', 400, 19, '2024-08-24 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (223333, 'หวยเดี่ยว', 80, 9, '2024-08-24 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (678904, 'หวยเดี่ยว', 80, 9, '2024-08-24 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (567801, 'หวยเดี่ยว', 80, 9, '2024-08-24 13:02:19');
-- INSERT INTO lotto (number,type, price, lotto_quantity, date) VALUES (567802, 'หวยเดี่ยว', 80, 9, '2024-08-24 13:02:19');





SELECT * FROM lotto_prize

CREATE TRIGGER update_wallet_prize
AFTER INSERT ON lotto_prize
FOR EACH ROW
WHEN NEW.prize = 1
BEGIN
    UPDATE lotto_prize
    SET wallet_prize = 6000000
    WHERE lpid = NEW.lpid;
END;


SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
FROM lotto_prize lp
JOIN lotto l ON lp.lid = l.lid
WHERE lp.prize = 1;


 SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
              FROM lotto_prize lp
              JOIN lotto l ON lp.lid = l.lid
              WHERE DATE(l.date) = DATE('now');



  SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
              FROM lotto_prize lp
              JOIN lotto l ON lp.lid = l.lid

SELECT * FROM lotto


SELECT lp.prize, lp.wallet_prize, l.number, l.type, l.price, l.date, l.lotto_quantity
FROM lotto_prize lp
JOIN lotto l ON lp.lid = l.lid
ORDER BY l.date DESC, lp.prize ASC;

SELECT * FROM basket
SELECT * FROM lotto

INSERT INTO basket (lid, uid, quantity) 
VALUES (1, 8, 4);

PRAGMA table_info(basket);






UPDATE users
SET image = 'https://static.wikia.nocookie.net/gensin-impact/images/e/e4/Icon_Emoji_Paimon%27s_Paintings_23_Cyno_1.png/revision/latest?cb=20230506045219'
WHERE uid = 3;


UPDATE users
SET fullname = '', phone = 0123, email = 'nani@gmail.com', image = NULL
WHERE uid = 2;







    SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    WHERE l.type = 'หวยชุด'


SELECT * FROM lotto


SELECT * FROM users WHERE uid = 6;



SELECT * FROM users



SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.price, l.date, l.lotto_quantity
              FROM lotto_prize lp
              JOIN lotto l ON lp.lid = l.lid
              ORDER BY l.date DESC, lp.prize ASC;

SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.date
FROM lotto_prize lp
JOIN lotto l ON lp.lid = l.lid
WHERE lp.lid = 1;

SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.date, ml.total_quantity
FROM lotto_prize lp
JOIN lotto l ON lp.lid = l.lid
JOIN my_lotto ml ON l.lid = ml.lid
WHERE lp.lid = 5 AND ml.uid = 6;

SELECT * FROM users WHERE uid = 6


SELECT * FROM my_lotto
SELECT * FROM payment
SELECT * FROM lotto
SELECT * FROM lotto_prize


SELECT ml.uid, l.lid, l.number, l.type, ml.date, ml.total_quantity, ml.total_price
FROM  my_lotto ml
JOIN lotto l ON ml.lid = l.lid
WHERE ml.uid = 6


SELECT ml.uid, l.lid, l.number, l.type, ml.date, ml.total_quantity, ml.total_price, lp.prize
FROM  my_lotto ml
JOIN lotto l ON ml.lid = l.lid
JOIN lotto_prize lp ON l.lid = lp.lid
WHERE ml.uid = 6

SELECT ml.uid, l.lid, ml.date, ml.total_quantity, ml.total_price, lp.prize
FROM  my_lotto ml
JOIN lotto l ON ml.lid = l.lid
JOIN lotto_prize lp ON l.lid = lp.lid
WHERE ml.uid = 6


SELECT * FROM users

UPDATE users
SET wallet = 10000000.00
WHERE uid = 1;



SELECT wallet FROM wallet;
UPDATE wallet SET wallet = 5000