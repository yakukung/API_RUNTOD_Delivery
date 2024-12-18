const express = require("express");
const app = express();
const port = 3000; 
const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const userRouter = require("./routes/users/users");
const userOrdersRouter = require("./routes/users/orders");
const riderRouter = require("./routes/rider/rider");
const riderOrdersRouter = require("./routes/rider/orders");

app.use(express.json());
app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/user", userRouter);
app.use("/user/orders", userOrdersRouter);
app.use("/rider", riderRouter);
app.use("/rider/orders", riderOrdersRouter);

app.get("/", (req, res) => {
    res.send("API Runtod App ʕ⁠´⁠•⁠ᴥ⁠•⁠`⁠ʔ ท้อเด้");
});

var os = require("os");
var ip = "0.0.0.0"; 
var ips = os.networkInterfaces();

Object.keys(ips).forEach(function (_interface) {
  ips[_interface].forEach(function (_dev) {
    if (_dev.family === "IPv4" && !_dev.internal) {
      ip = _dev.address;
    }
  });
});

app.listen(port, () => {
  console.log(`RUNTOD APP API listening at http://${ip}:${port}`);
});