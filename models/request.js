const mongoose = require("mongoose");
const schema = mongoose.Schema;

const postSchema = new schema({
  from: {
    type: schema.Types.ObjectId,
    ref: "user",
  },
  to: schema.Types.ObjectId,
});

const Request = mongoose.model("request", postSchema);

module.exports = Request;
