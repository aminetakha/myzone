const mongoose = require("mongoose");
const schema = mongoose.Schema;

const postSchema = new schema({
  user: {
    type: schema.Types.ObjectId,
    ref: "user",
  },
  postType: String,
  postContent: String,
  postLikes: Number,
  comment: [
    {
      userIdComment: schema.Types.ObjectId,
      commentContent: String,
      commentLikes: Number,
      commentLike: [
        {
          userIdCommentLike: schema.Types.ObjectId,
        },
      ],
    },
  ],
  postLike: [
    {
      userIdPostLike: schema.Types.ObjectId,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("post", postSchema);

module.exports = Post;
