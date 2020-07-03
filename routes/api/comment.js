const express = require("express");
const router = express.Router();
const Post = require("../../models/post");
const auth = require("../../middleware/auth");

// add a comment
router.post("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const { commentContent } = req.body;
  if (post) {
    const comment = {
      userIdComment: req.user.id,
      commentContent,
      commentLikes: 0,
      commentLike: [],
    };
    post.comment.push(comment);
    try {
      await post.save();
      return res.status(200).json("Comment added");
    } catch (err) {
      console.log("Error while adding a comment");
    }
  } else {
    return res.status(404).json("Post does not exist");
  }
});

// remove a comment
router.post("/:idpost/:idcomment", auth, async (req, res) => {
  try {
    const doesExiste = await Post.findOne({
      _id: req.params.idpost,
      "comment._id": req.params.idcomment,
      "comment.userIdComment": req.user.id,
    });
    const newCommentList = doesExiste.comment.filter(
      (cmt) => cmt._id != req.params.idcomment
    );
    doesExiste.comment = newCommentList;
    await doesExiste.save();
    return res.json("Comment removed");
  } catch (err) {
    res.json(err);
  }
});

// Like a comment
router.post("/:idpost/:idcomment/like", auth, async (req, res) => {
  try {
    const doesExiste = await Post.findOne({
      _id: req.params.idpost,
      "comment._id": req.params.idcomment,
    });

    doesExiste.comment.forEach(async (cmt) => {
      if (cmt._id == req.params.idcomment) {
        if (cmt.commentLike.length === 0) {
          cmt.commentLikes++;
          cmt.commentLike.push({ userIdCommentLike: req.user.id });
          await doesExiste.save();
          return res.json("comment liked for the first time");
        }
        let alreadyLiked = cmt.commentLike.filter(
          (liked) => liked.userIdCommentLike == req.user.id
        );
        console.log(alreadyLiked);
        if (alreadyLiked.length == 0) {
          cmt.commentLikes++;
          cmt.commentLike.push({ userIdCommentLike: req.user.id });
          await doesExiste.save();
          return res.json("comment liked");
        } else {
          return res.json("comment already liked");
        }
      }
    });
  } catch (err) {
    res.json(err);
  }
});

// unlike a comment
router.post("/:idpost/:idcomment/unlike", auth, async (req, res) => {
  try {
    const doesExiste = await Post.findOne({
      _id: req.params.idpost,
      "comment._id": req.params.idcomment,
    });
    doesExiste.comment.forEach((cmt) => {
      if (cmt._id == req.params.idcomment) {
        let newCommentLikes = cmt.commentLike.filter(
          (cmtL) => cmtL.userIdCommentLike != req.user.id
        );
        cmt.commentLike = newCommentLikes;
        cmt.commentLikes--;
        return;
      }
    });

    await doesExiste.save();
    res.json(doesExiste);
  } catch (err) {
    console.log(err);
    res.json("Error while unliking the comment");
  }
});

module.exports = router;
