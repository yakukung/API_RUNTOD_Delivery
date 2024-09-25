// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000; 

const db = new sqlite3.Database("./delivery.db", (err) => {
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

app.get("/user/:id", (req, res) => {
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



app.put("/user/update/address", (req, res) => {
  const { uid, address } = req.body;
  if (!uid || !address) {
    return res.status(400).json({ message: "UID and address are required" });
  }
  db.run(
    "UPDATE users SET address = ? WHERE uid = ?",
    [address, uid],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error updating address", error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      return res.status(200).json({ message: "Customer updated successfully" });
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
  console.log(`RUNTOD APP API listening at http://${ip}:${port}`);
});
