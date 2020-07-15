const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();
const path = require("path");

app.use(cors());
app.use("/client/uploads", express.static("client/uploads"));
app.use(express.json({ extended: false }));
connectDB();

app.use("/api/user", require("./routes/api/users"));
app.use("/api/post", require("./routes/api/post"));
app.use("/api/comment", require("./routes/api/comment"));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log("Server running...");
});
