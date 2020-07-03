const express = require("express");
const router = express.Router();
const Post = require("../../models/post");
const auth = require("../../middleware/auth");

// post route
router.get("/post", auth, async (req, res) => {
  const userpost = await Post.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("user");
  res.json(userpost);
});

// Create a post
router.post("/post", auth, async (req, res) => {
  const { postContent } = req.body;
  const post = new Post({
    user: req.user.id,
    postContent,
    postLikes: 0,
  });

  try {
    await post.save();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Error while adding your post" });
  }

  res.json(post);
});

// Update post
router.put("/post/:id", auth, async (req, res) => {
  const { postContent } = req.body;
  let doc = await Post.findOneAndUpdate(
    { user: req.user.id, _id: req.params.id },
    { postContent },
    { new: true }
  );
  res.json(doc);
});

// delete post
router.delete("/post/:id", auth, async (req, res) => {
  await Post.findOneAndDelete({ user: req.user.id, _id: req.params.id });
  res.json("Post deleted");
});

// like a post
router.post("/post/:id/like", auth, async (req, res) => {
  const likedPostByUser = await Post.findById(req.params.id);

  if (likedPostByUser.postLike.length === 0) {
    likedPostByUser.postLikes++;
    likedPostByUser.postLike.push({ userIdPostLike: req.user.id });
    await likedPostByUser.save();
    return res.json("Post liked for the first time");
  } else {
    let shouldAddLike = true;
    likedPostByUser.postLike.forEach((post) => {
      if (post.userIdPostLike == req.user.id) {
        shouldAddLike = false;
      }
    });
    if (shouldAddLike) {
      likedPostByUser.postLikes++;
      likedPostByUser.postLike.push({ userIdPostLike: req.user.id });
      await likedPostByUser.save();
      return res.json("Post liked");
    }
  }
});

// unlike a post
router.post("/post/:id/unlike", auth, async (req, res) => {
  const likedPostByUser = await Post.findOne({
    _id: req.params.id,
    "postLike.userIdPostLike": req.user.id,
  });

  if (likedPostByUser.postLike.length > 0) {
    const newPostLike = likedPostByUser.postLike.filter(
      (post) => post.userIdPostLike != req.user.id
    );
    likedPostByUser.postLike = newPostLike;
    likedPostByUser.postLikes--;
    await likedPostByUser.save();
    return res.json("Post disliked");
  }
});

module.exports = router;
