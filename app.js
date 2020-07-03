const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();

app.use(cors());
app.use("/client/uploads", express.static("client/uploads"));
app.use(express.json({ extended: false }));
connectDB();

app.get("/", (req, res) => {
  res.send("Home route");
});

app.use("/api/user", require("./routes/api/users"));
app.use("/api/post", require("./routes/api/post"));
app.use("/api/comment", require("./routes/api/comment"));

app.listen(9000, () => {
  console.log("Server running...");
});
