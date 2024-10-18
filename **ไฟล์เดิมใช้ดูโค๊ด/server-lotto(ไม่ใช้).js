// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000; 

const db = new sqlite3.Database("./lotto.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the LOTTO database.");
  }
});

app.use(express.json());


app.get("/", (req, res) => {
  console.log("Hello LOTTO!!!");
  res.send("Hello LOTTO!!!"); 
});

app.get("/allusers", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    handleResponse(res, err, rows);
  });
});



//ล็อคอินผู้ใช้
app.post("/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    res.status(400).json({ error: "Username/Email and password are required" });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let sql;
  let params;

  if (emailRegex.test(usernameOrEmail)) {
    // ถ้าค่าที่ป้อนมาเป็นอีเมล
    sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    params = [usernameOrEmail, password];
  } else {
    // ถ้าค่าที่ป้อนมาไม่ใช่อีเมล (จะถือว่าเป็น username)
    sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    params = [usernameOrEmail, password];
  }

  // ค้นหาข้อมูลในฐานข้อมูล
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(401).json({ error: "Invalid username/email or password" });
      return;
    }

    // ลบรหัสผ่านออกจากผลลัพธ์ก่อนส่งกลับ
    const userData = { ...row };
    delete userData.password;

    // ส่งข้อมูลผู้ใช้กลับไป
    res.json({ message: "Login successful", users: userData });
  });
});



///////////////    สำหรับผู้ใช้     ///////////////////////////


// ดึงข้อมูลผู้ใช้ uid นั้น
app.get("/customers/:uid", (req, res) => {
  const uid = req.params.uid;
  db.get("SELECT * FROM users WHERE uid = ?", [uid], (err, row) => {
    if (err) {
      handleResponse(res, err, null, 404, "Customer not found");
      return;
    }

    if (!row) {
      handleResponse(res, null, null, 404, "Customer not found");
      return;
    }

    const sanitizedRow = { ...row };
    delete sanitizedRow.password;

    handleResponse(res, null, sanitizedRow);
  });
});


// ดึงข้อมูลผู้ใช้ uid นั้น
app.get("/customers/detail/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM users WHERE uid = ?", [id], (err, row) => {
    if (err) {
      handleResponse(res, err, null, 404, "Customer not found");
      return;
    }

    if (!row) {
      handleResponse(res, null, null, 404, "Customer not found");
      return;
    }

    handleResponse(res, null, row); 
  });
});


// อัพเดตข้อมูลผู้ใช้
app.put("/customers/detail/update/:id", (req, res) => {
  const id = req.params.id;
  const { username, fullname, email, phone, password, image } = req.body;
  db.run(
    "UPDATE users SET username = ?, fullname = ?, email = ?, phone = ?, password = ?, image = ? WHERE uid = ?",
    [username, fullname, email, phone, password, image, id],
    function (err) {
      handleResponse(
        res,
        err,
        { message: "Customer updated successfully" },
        404,
        "Customer not found",
        this.changes
      );
    }
  );
});


// ลบข้อมูลผู้ใช้
app.delete("/customers/detail/delete/:id", (req, res) => {
  const uid = req.params.id;
  db.run("DELETE FROM users WHERE uid = ?", [uid], function (err) {
    handleResponse(
      res,
      err,
      { message: "Customer deleted successfully" },
      404,
      "Customer not found",
      this.changes
    );
  });
});



// สมัครสมาชิก
app.post("/register", (req, res) => {
  const { fullname, username, email, phone, password } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    db.run(
      "INSERT INTO users (fullname, username, email, phone, password) VALUES (?, ?, ?, ?, ?)",
      [fullname, username, email, phone, password],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return handleResponse(res, err, null, 404, "error");
        }

        db.get("SELECT wallet FROM wallet", (err, row) => {
          if (err) {
            db.run("ROLLBACK");
            return handleResponse(res, err, null, 404, "error");
          }

          db.run(
            "UPDATE users SET wallet = ? WHERE uid = ?",
            [row.wallet, this.lastID],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return handleResponse(res, err, null, 404, "error");
              }

              db.run("COMMIT");
              handleResponse(res, null, { message: "Register successfully" }, 200, "success", this.lastID);
            }
          );
        });
      }
    );
  });
});


// อัพเดตข้อมูลผู้ใช้
app.put("/customers/:id", (req, res) => {
  const id = req.params.id;
  const { usersname, fullname, phone, email, password, image } = req.body;
  db.run(
    `UPDATE users
     SET usersname = ?, fullname = ?, phone = ?, email = ?, password = ?, image = ?
     WHERE uid = ?`,
    [usersname, fullname, phone, email, password, image, id],
    function (err) {
      handleResponse(
        res,
        err,
        { message: "Customer updated successfully" },
        404,
        "Customer not found",
        this.changes
      );
    }
  );
});




//แสดงLOTTO ทั้งหมด
app.get('/lotto', (req, res) => {
  const sql = `
             SELECT * FROM lotto
  `;
  db.all(sql, (err, row) => {
    console.log('Response from DB:', row); // แสดงข้อมูลที่ได้จากฐานข้อมูล
    handleResponse(res, err, row, 404, 'Lotto prize not found');
  });
});


// แสดงLOTTO ที่เลือก
app.get("/lotto/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM lotto WHERE lid = ?", [id], (err, row) => {
    if (err) {
      handleResponse(res, err, null, 500, "Error fetching data");
      return;
    }

    if (!row) {
      handleResponse(res, null, null, 404, "Lotto not found");
      return;
    }

    res.json(row);
  });
});


// แสดงว่าถูกรางวัลไหม
app.post("/lotto-check-prize", (req, res) => {
  const { lid, uid } = req.body; 

  const sql = `
    SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.date, ml.total_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    JOIN my_lotto ml ON l.lid = ml.lid
    WHERE lp.lid = ? AND ml.uid = ?;
  `;

  db.get(sql, [lid, uid], (err, row) => {
    if (err) {
      handleResponse(res, err, null, 500, "Error fetching data");
      return;
    }
    if (!row) {
      handleResponse(res, null, null, 404, "Lotto not found");
      return;
    }

    res.json(row);
  });
});



// เติม wallet
app.put('/get-wallet', (req, res) => {
  const { wallet_prize, uid } = req.body;

  const selectSql = 'SELECT wallet FROM users WHERE uid = ?';
  db.get(selectSql, [uid], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error while fetching wallet' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentWallet = row.wallet || 0;
    const newWallet = currentWallet + wallet_prize;

    const updateSql = 'UPDATE users SET wallet = ? WHERE uid = ?';
    db.run(updateSql, [newWallet, uid], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error while updating wallet' });
      }
      res.status(200).json({ message: 'Wallet updated successfully', newWallet });
    });
  });
});

// หลังจากซื้อเสร็จลบ lid   LOTTO ของฉัน
app.delete("/get-wallet/:lid", (req, res) => {
  const lid = req.params.lid; 
  db.run("DELETE FROM my_lotto WHERE lid = ?", [lid], function (err) {
    handleResponse(
      res,
      err,
      { message: "สำเร็จ" },
      404,
      "Meeting not found",
      this.lid
    );
  });
});





//  แสดงรางวัล
app.get('/lotto-prize', (req, res) => {
  const sql = `
             SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.price, l.date, l.lotto_quantity
              FROM lotto_prize lp
              JOIN lotto l ON lp.lid = l.lid
              ORDER BY l.date DESC, lp.prize ASC;
  `;
  db.all(sql, (err, row) => {
    console.log('Response from DB:', row); 
    handleResponse(res, err, row, 404, 'Lotto prize not found');
  });
});


// ตังกรองประเภท LOTTO
app.post('/lotto-types', (req, res) => {
  const { type } = req.body;

  console.log('Type received:', type);

  if (!type) {
    return res.status(400).json({ error: 'Type parameter is required' });
  }

  const sql = `
    SELECT l.lid, lp.prize, l.number, l.type, price, l.date, lotto_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    WHERE l.type = ?
  `;
  
  db.all(sql, [type], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Querying for type:', type); 
    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});


// ตังกรองประเภท LOTTO
app.get('/lotto/types', (req, res) => {
  const { type } = req.query; 

  console.log('Type received:', type);

  if (!type) {
    return res.status(400).json({ error: 'Type parameter is required' });
  }

  const sql = `
    SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    WHERE l.type = ?
  `;
  
  db.all(sql, [type], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Querying for type:', type); 
    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});



// ตังกรองรางวัลประเภท LOTTO
app.get('/lotto-prize/type', (req, res) => {
  const { type } = req.query; 

  console.log('Type received:', type);

  if (!type) {
    return res.status(400).json({ error: 'Type parameter is required' });
  }

  const sql = `
    SELECT lp.prize, l.number, l.type, price, l.date, lotto_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    WHERE l.type = ?
  `;
  
  db.all(sql, [type], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Querying for type:', type); 
    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});


// เช็คจำนวนในตะกร้า
app.get('/check-basket', (req, res) => {
  const { uid, lid } = req.query;

  const sql = 'SELECT quantity FROM basket WHERE uid = ? AND lid = ?';
  db.get(sql, [uid, lid], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      res.status(200).json({ exists: true, quantity: row.quantity });
    } else {
      res.status(200).json({ exists: false });
    }
  });
});

// เพิ่มลงตะกร้า
app.post("/add-basket", (req, res) => {
  const { lid, uid, quantity } = req.body;
  db.run(
    "INSERT INTO basket (lid, uid, quantity) VALUES (?, ?, ?)",
    [lid, uid, quantity],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Failed to add item to basket" });
      } else {
        res.status(200).json({ message: "เพิ่มสินค้าเข้าตะกร้าสำเร็จ", lid: lid ,uid: uid});
      }
    }
  );
});

// เพิ่มจำนวนลงตะกร้า
app.put('/update-basket', (req, res) => {
  const { uid, lid, quantity } = req.body;

  const sql = 'UPDATE basket SET quantity = ? WHERE uid = ? AND lid = ?';
  db.run(sql, [quantity, uid, lid], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Basket updated successfully' });
  });
});


// เรียกดู lotto ในตะกร้าของผู้ใช้นั้น
app.get('/basket/:uid', (req, res) => {
  const { uid } = req.params;

  console.log('basket UID:', uid);

  if (!uid) {
    return res.status(400).json({ error: 'Failed no item basket' });
  }

  const sql = `
    SELECT u.uid, l.lid, l.number, l.type, l.price, l.date, l.lotto_quantity, bk.quantity
    FROM basket bk
    JOIN lotto l ON bk.lid = l.lid
    JOIN users u ON bk.uid = u.uid
    WHERE u.uid = ?
  `;
  
  db.all(sql, [uid], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});



// ลบออกจากตะกร้า
app.delete("/basket/:id", (req, res) => {
  const lid = req.params.id;
  db.run("DELETE FROM basket WHERE lid = ?", [lid], function (err) {
    handleResponse(
      res,
      err,
      { message: "ลบ LOTTO ในตะกร้าเรียบร้อย" },
      404,
      "Meeting not found",
      this.lid
    );
  });

});


// เพิ่มจำนวนลงตะกร้า
app.put("/basket/quantity", (req, res) => {
  const { uid, lid, quantity } = req.body;
  
  // ตรวจสอบข้อมูลที่ส่งมาให้แน่ใจว่าไม่ว่าง
  if (!uid || !lid || quantity == null) {
    return res.status(400).json({ error: "Invalid data provided" });
  }

  // อัปเดตตาราง basket โดยใช้ฟิลด์ที่สอดคล้องกัน
  db.run(
    "UPDATE basket SET quantity = ? WHERE uid = ? AND lid = ?",
    [quantity, uid, lid],
    function (err) {
      if (err) {
        console.error("Error updating quantity:", err.message);
        res.status(500).json({ error: "Failed to update quantity" });
      } else {
        console.log(`Quantity updated for uid: ${uid}, lid: ${lid}, quantity: ${quantity}`);
        res.status(200).json({ message: "Quantity updated successfully" });
      }
    }
  );
});

// จ่ายเงิน
app.post("/payment", (req, res) => {
  const { lid, uid, quantity, total_price } = req.body;
  console.log("Received payment data:", req.body);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get(
      "SELECT pid, quantity, total_price FROM payment WHERE lid = ? AND uid = ?",
      [lid, uid],
      (err, row) => {
        if (err) {
          console.error("Error checking existing payment:", err);
          return db.run("ROLLBACK", () => {
            res.status(500).json({ error: "Failed to check existing payment" });
          });
        }

        db.run(
          "INSERT INTO payment (uid, lid, quantity, total_price) VALUES (?, ?, ?, ?)",
          [uid, lid, quantity, total_price],
          function (err) {
            if (err) {
              console.error("Error inserting data into payment:", err);
              return db.run("ROLLBACK", () => {
                res.status(500).json({ error: "Failed to add item to payment" });
              });
            }

            const insertedPaymentId = this.lastID; 

            db.get(
              "SELECT total_quantity, total_price FROM my_lotto WHERE lid = ? AND uid = ?",
              [lid, uid],
              (err, row) => {
                if (err) {
                  console.error("Error checking existing my_lotto:", err);
                  return db.run("ROLLBACK", () => {
                    res.status(500).json({ error: "Failed to check existing my_lotto" });
                  });
                }

                if (row) {
                  const newQuantity = row.total_quantity + quantity;
                  const newTotalPrice = row.total_price + total_price;

                  console.log(`Updating my_lotto with newQuantity: ${newQuantity}, newTotalPrice: ${newTotalPrice}`);

                  db.run(
                    "INSERT INTO wallet_list (pid, uid, total_price) VALUES (?, ?, ?)",
                    [insertedPaymentId, uid, total_price],
                    function (err) {
                      if (err) {
                        console.error("Error inserting data into wallet_list:", err);
                        return db.run("ROLLBACK", () => {
                          res.status(500).json({ error: "Failed to add item to wallet_list" });
                        });
                      }

                      db.run(
                        "UPDATE my_lotto SET total_quantity = ?, total_price = ? WHERE lid = ? AND uid = ?",
                        [newQuantity, newTotalPrice, lid, uid],
                        function (err) {
                          if (err) {
                            console.error("Error updating my_lotto:", err);
                            return db.run("ROLLBACK", () => {
                              res.status(500).json({ error: "Failed to update my_lotto" });
                            });
                          }

                          db.run(
                            "UPDATE lotto SET lotto_quantity = lotto_quantity - ? WHERE lid = ?",
                            [quantity, lid],
                            function (err) {
                              if (err) {
                                console.error("Error updating lotto_quantity:", err);
                                return db.run("ROLLBACK", () => {
                                  res.status(500).json({ error: "Failed to update lotto_quantity" });
                                });
                              }

                              db.run(
                                "DELETE FROM basket WHERE uid = ? AND lid = ?",
                                [uid, lid],
                                function (err) {
                                  if (err) {
                                    console.error("Error deleting data from basket:", err);
                                    return db.run("ROLLBACK", () => {
                                      res.status(500).json({ error: "Failed to delete item from basket" });
                                    });
                                  }

                                  db.run(
                                    "UPDATE users SET wallet = wallet - ? WHERE uid = ?",
                                    [total_price, uid],
                                    function (err) {
                                      if (err) {
                                        console.error("Error updating wallet:", err);
                                        return db.run("ROLLBACK", () => {
                                          res.status(500).json({ error: "Failed to update wallet" });
                                        });
                                      }

                                      db.run("COMMIT", () => {
                                        res.status(200).json({ message: "Payment processed successfully" });
                                      });
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  db.run(
                    "INSERT INTO my_lotto (uid, lid, total_quantity, total_price) VALUES (?, ?, ?, ?)",
                    [uid, lid, quantity, total_price],
                    function (err) {
                      if (err) {
                        console.error("Error inserting data into my_lotto:", err);
                        return db.run("ROLLBACK", () => {
                          res.status(500).json({ error: "Failed to add item to my_lotto" });
                        });
                      }

                      db.run(
                        "INSERT INTO wallet_list (pid, uid, total_price) VALUES (?, ?, ?)",
                        [insertedPaymentId, uid, total_price], 
                        function (err) {
                          if (err) {
                            console.error("Error inserting data into wallet_list:", err);
                            return db.run("ROLLBACK", () => {
                              res.status(500).json({ error: "Failed to add item to wallet_list" });
                            });
                          }

                          db.run(
                            "DELETE FROM basket WHERE uid = ? AND lid = ?",
                            [uid, lid],
                            function (err) {
                              if (err) {
                                console.error("Error deleting data from basket:", err);
                                return db.run("ROLLBACK", () => {
                                  res.status(500).json({ error: "Failed to delete item from basket" });
                                });
                              }

                              db.run(
                                "UPDATE lotto SET lotto_quantity = lotto_quantity - ? WHERE lid = ?",
                                [quantity, lid],
                                function (err) {
                                  if (err) {
                                    console.error("Error updating lotto_quantity:", err);
                                    return db.run("ROLLBACK", () => {
                                      res.status(500).json({ error: "Failed to update lotto_quantity" });
                                    });
                                  }

                                  db.run(
                                    "UPDATE users SET wallet = wallet - ? WHERE uid = ?",
                                    [total_price, uid],
                                    function (err) {
                                      if (err) {
                                        console.error("Error updating wallet:", err);
                                        return db.run("ROLLBACK", () => {
                                          res.status(500).json({ error: "Failed to update wallet" });
                                        });
                                      }

                                      db.run("COMMIT", () => {
                                        res.status(200).json({ message: "Payment processed successfully" });
                                      });
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  });
});


// แสดงรายการที่ซื้อแล้ว
app.get('/my_lotto/:uid', (req, res) => {
  const { uid } = req.params;

  console.log('My Lotto UID:', uid);

  if (!uid) {
    return res.status(400).json({ error: 'Failed no item ' });
  }

  const sql = `
  SELECT ml.uid, l.lid, l.number, l.type, ml.date, ml.total_quantity, ml.total_price
  FROM my_lotto ml
  JOIN lotto l ON ml.lid = l.lid
  WHERE ml.uid = ?
  ORDER BY ml.mlid DESC;

  `;
  
  db.all(sql, [uid], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});


// แสดงรายการที่ซื้อแล้ว
app.get('/my_lotto/:uid', (req, res) => {
  const { uid } = req.params;

  console.log('My Lotto UID:', uid);

  if (!uid) {
    return res.status(400).json({ error: 'Failed no item ' });
  }

  const sql = `
  SELECT ml.uid, l.lid, l.number, l.type, ml.date, ml.total_quantity, ml.total_price
  FROM my_lotto ml
  JOIN lotto l ON ml.lid = l.lid
  WHERE ml.uid = ?
  ORDER BY ml.mlid DESC;

  `;
  
  db.all(sql, [uid], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});



// แสดงรายการรายรับรายจ่าย
app.get('/lotto_list/:uid', (req, res) => {
  const { uid } = req.params;

  console.log('My Lotto UID:', uid);

  if (!uid) {
    return res.status(400).json({ error: 'Failed no item ' });
  }

  const sql = `
  SELECT *
  FROM wallet_list
  WHERE uid = ?
  ORDER BY date DESC;
  `;
  
  db.all(sql, [uid], (err, rows) => {
    if (err) {
      console.error('Database error:', err); 
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lotto prize not found' });
    }

    console.log('Response from DB:', rows);

    res.status(200).json(rows);
  });
});



// เติม wallet
app.put('/topup_wallet/:uid', (req, res) => {
  const uid = req.params.uid;
  const { wallet } = req.body;

  if (isNaN(wallet) || wallet <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const queryUpdateWallet = 'UPDATE users SET wallet = wallet + ? WHERE uid = ?';
  const queryInsertWalletList = 'INSERT INTO wallet_list (uid, total_price) VALUES (?, ?)';
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(queryInsertWalletList, [uid, wallet], function (err) {
      if (err) {
        console.error('Error inserting data into wallet_list:', err);
        db.run('ROLLBACK', () => {
          res.status(500).json({ error: 'Failed to add item to wallet_list' });
        });
        return;
      }

      db.run(queryUpdateWallet, [wallet, uid], function (err) {
        if (err) {
          db.run('ROLLBACK', () => {
            res.status(500).json({ error: 'Database error', details: err.message });
          });
          return;
        }

        if (this.changes === 0) {
          db.run('ROLLBACK', () => {
            res.status(404).json({ error: 'User not found' });
          });
          return;
        }

        db.run('COMMIT', () => {
          res.json({ message: 'Wallet updated successfully' });
        });
      });
    });
  });
});






///////////////    สำหรับแอดมิน     ///////////////////////////
 
//แอดมิน รีเซ็ตค่าเริ่มต้น
app.delete("/admin/reset", (req, res) => {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION", function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // ลบข้อมูลในตาราง 'lotto'
      db.run("DELETE FROM lotto", function (err) {
        if (err) {
          return db.run("ROLLBACK", () => {
            res.status(500).json({ error: err.message });
          });
        }

        // ลบข้อมูลในตาราง 'users' ที่มี type = 1
        db.run("DELETE FROM users WHERE type = 1", function (err) {
          if (err) {
            return db.run("ROLLBACK", () => {
              res.status(500).json({ error: err.message });
            });
          }

          // ลบข้อมูลในตาราง 'my_lotto'
          db.run("DELETE FROM my_lotto", function (err) {
            if (err) {
              return db.run("ROLLBACK", () => {
                res.status(500).json({ error: err.message });
              });
            }

            // ลบข้อมูลในตาราง 'payment'
            db.run("DELETE FROM payment", function (err) {
              if (err) {
                return db.run("ROLLBACK", () => {
                  res.status(500).json({ error: err.message });
                });
              }

              // ลบข้อมูลในตาราง 'basket'
              db.run("DELETE FROM basket", function (err) {
                if (err) {
                  return db.run("ROLLBACK", () => {
                    res.status(500).json({ error: err.message });
                  });
                }

                // ลบข้อมูลในตาราง 'wallet_list'
                db.run("DELETE FROM wallet_list", function (err) {
                  if (err) {
                    return db.run("ROLLBACK", () => {
                      res.status(500).json({ error: err.message });
                    });
                  }

                  // ลบข้อมูลในตาราง 'lotto_prize'
                  db.run("DELETE FROM lotto_prize", function (err) {
                    if (err) {
                      return db.run("ROLLBACK", () => {
                        res.status(500).json({ error: err.message });
                      });
                    }

                    // Insert ข้อมูลใหม่เข้าตาราง 'lotto'
                    db.run(`
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
                    `, function (err) {
                      if (err) {
                        return db.run("ROLLBACK", () => {
                          res.status(500).json({ error: err.message });
                        });
                      }

                      db.run("COMMIT", function (err) {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }
                        res.json({
                          message: "Tables deleted and lotto table reset successfully.",
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});



// แสดงข้อมูลรางวัลทั้งหมด
app.get('/admin/prize', (req, res) => {
  const sql = `
    SELECT l.lid, lp.prize, lp.wallet_prize, l.number, l.type, l.price, l.date, l.lotto_quantity
    FROM lotto_prize lp
    JOIN lotto l ON lp.lid = l.lid
    WHERE l.date = (
      SELECT MAX(date) FROM lotto
    )
    ORDER BY lp.prize ASC;
  `;
  db.all(sql, (err, rows) => {
    console.log('Response from DB:', rows);
    handleResponse(res, err, rows, 404, 'Lotto prize not found');
  });
});

// ตัวสุ่มรางวัล
app.post("/admin/random/prize", (req, res) => {
  const { prize } = req.body;

  db.get("SELECT COUNT(*) as count FROM lotto_prize WHERE DATE(date) = DATE('now') AND prize = ?", [prize], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const hasTodayPrize = row.count > 0;

    if (!hasTodayPrize) {
      db.run(`
        INSERT INTO lotto_prize (lid, prize, wallet_prize, date)
        SELECT
          lid,
          ? AS prize,
          CASE
            WHEN ? = 1 THEN 6000000
            WHEN ? = 2 THEN 2000000
            WHEN ? = 3 THEN 1000000
            WHEN ? = 4 THEN 500000
            WHEN ? = 5 THEN 100000
            ELSE 0
          END AS wallet_prize,
          DATE('now') AS date
        FROM lotto
        ORDER BY RANDOM()
        LIMIT 1
      `, [prize, prize, prize, prize, prize, prize], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Error inserting new prize" });
        }
        res.status(200).json({ message: "New prize assigned successfully" });
      });
    } else {
      db.run(`
        UPDATE lotto_prize
        SET
          lid = (SELECT lid FROM lotto ORDER BY RANDOM() LIMIT 1),
          wallet_prize = CASE
            WHEN prize = 1 THEN 6000000
            WHEN prize = 2 THEN 2000000
            WHEN prize = 3 THEN 1000000
            WHEN prize = 4 THEN 500000
            WHEN prize = 5 THEN 100000
            ELSE 0
          END
        WHERE DATE(date) = DATE('now') AND prize = ?
      `, [prize], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Error updating prize" });
        }
        res.status(200).json({ message: "Prize updated successfully" });
      });
    }
  });
});

// อัพเดตค่าเริ่มต้น wallet
app.put('/set-wallet', (req, res) => {
  const { wallet} = req.body;

    const updateSql = 'UPDATE wallet SET wallet = ?';
    db.run(updateSql, [wallet], function(err) {
      if (err) {
        return res.status(500).json({ error: 'set wallet error' });
      }
      res.status(200).json({ message: 'set wallet successfully', wallet});
  });
});


// อัพเดตข้อมูลผู้ใช้
app.put("/admin/update/profile/user/:id", (req, res) => {
  const id = req.params.id;
  const { username, fullname, email, phone, password, image, wallet } = req.body;

  // ตรวจสอบว่าฟิลด์ที่จำเป็นมีข้อมูลครบถ้วน
  if (!username || !fullname || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  db.run(
    "UPDATE users SET username = ?, fullname = ?, email = ?, phone = ?, password = ?, image = ?, wallet = ? WHERE uid = ?",
    [username, fullname, email, phone, password, image, wallet, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "An error occurred while updating the user." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.status(200).json({ message: "Customer updated successfully" });
    }
  );
});





// ------------------------------------------------------------
// HELPER FUNCTION
// ------------------------------------------------------------
// Helper function to handle API responses
function handleResponse(
  res,
  err,
  data,
  notFoundStatusCode = 404,
  notFoundMessage = "Not found",
  changes = null
) {
  if (err) {
    res.status(500).json({ error: err.message });
    return;
  }
  if (!data && !changes) {
    res.status(notFoundStatusCode).json({ error: notFoundMessage });
    return;
  }
  res.json(data);
}

var os = require("os");
var ip = "0.0.0.0";
var ips = os.networkInterfaces();
Object.keys(ips).forEach(function (_interface) {
  ips[_interface].forEach(function (_dev) {
    if (_dev.family === "IPv4" && !_dev.internal) ip = _dev.address;
  });
});

app.listen(port, () => {
  console.log(`LOTTO APP API listening at http://${ip}:${port}`);
});
