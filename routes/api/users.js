const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const User = require("../../models/user");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./client/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + file.originalname);
  },
});

const filefilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filefilter });

// User registration
router.post(
  "/signup",
  upload.single("photo"),
  [
    check("username").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { username, email, password, birthdate, gender } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ msg: "User is already exists" });
    }

    // console.log(req.file);

    user = new User({
      username,
      email,
      password,
      photo: req.file.path,
      birthdate,
      gender,
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user.password = hash;

    try {
      const ru = await user.save();
      const payload = {
        user: {
          id: ru._id,
        },
      };
      jwt.sign(payload, config.get("jwtKey"), (err, token) => {
        if (err) throw err;
        return res.json(token);
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// User login
router.post(
  "/signin",
  [check("email").isEmail(), check("password").isLength({ min: 5 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ msg: "Unauthenticated" });
    }
    bcrypt.compare(password, user.password, function (err, valid) {
      if (err) console.log(err);
      if (valid) {
        const payload = {
          user: {
            id: user._id,
          },
        };
        jwt.sign(payload, config.get("jwtKey"), (err, token) => {
          if (err) throw err;
          return res.json(token);
        });
      } else {
        return res.status(401).json({ msg: "Unauthenticated" });
      }
    });
  }
);

// change profile info
router.post("/update/", auth, async (req, res) => {
  const update = {
    username: req.body.username,
    email: req.body.email,
    birthdate: req.body.birthdate,
    gender: req.body.gender,
  };
  const doc = await User.findOneAndUpdate({ _id: req.user.id }, update, {
    new: true,
    useFindAndModify: false,
  });
  res.json(doc);
});

// fetch the current user
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// fetch all users
router.get("/users", async (req, res) => {
  let users = await User.find({}).select("-password");
  res.json(users);
});

// fetch a user by id
router.get("/user/:id", async (req, res) => {
  let user = await User.findById(req.params.id).select("-password");
  res.json(user);
});

// fetch a user by username
router.get("/user/username/:username", async (req, res) => {
  let user = await User.find({ username: req.params.username }).select(
    "-password"
  );
  res.json(user);
});

// send a friend request
router.post("/request/:id", auth, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (user._id != req.user.id) {
      user.requests.push(req.user.id);
    }
    await user.save();
    res.json(user);
  } catch (err) {
    res.json("Error");
  }
});

// accept friend request
router.post("/request/:id/accept", auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    let userThatSentRequest = await User.findById(req.params.id);
    let newRequestList;
    if (user.requests.length > 0) {
      newRequestList = user.requests.filter(
        (request) => request != req.params.id
      );
      user.requests = newRequestList;
      userThatSentRequest.friends.push(req.user.id);
      user.friends.push(req.params.id);
    }
    await user.save();
    await userThatSentRequest.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.json("Error accepting the friend request");
  }
});

// show requests
router.get("/request/show", auth, async (req, res) => {
  try {
    const curr_user = await User.findById(req.user.id);
    const req_list = curr_user.requests;
    const records = await User.find({
      _id: { $in: req_list },
    }).select("_id username photo");
    return res.json(records);
  } catch (err) {
    console.log(err.message);
    return res.json("Error in showing requests");
  }
});

// show friends
router.get("/friend/show", auth, async (req, res) => {
  try {
    const curr_user = await User.findById(req.user.id);
    const fr_list = curr_user.friends;
    const records = await User.find({
      _id: { $in: fr_list },
    }).select("_id username photo");
    return res.json(records);
  } catch (err) {
    console.log(err.message);
    return res.json("Error in showing friends");
  }
});

// unfriend a user
router.post("/friend/:id", auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    user.friends = user.friends.filter((usr) => usr != req.params.id);
    let friend = await User.findById(req.params.id);
    friend.friends = friend.friends.filter((usr) => usr != req.user.id);
    await user.save();
    await friend.save();
    return res.json({ msg: "User has been deleted" });
  } catch (err) {
    console.log("Error in unfriend user");
    return res.json({ msg: "Error in unfriend user" });
  }
});

module.exports = router;
