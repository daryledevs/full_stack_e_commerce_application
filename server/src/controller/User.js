const { User } = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getAllUser = async (req, res) => {
  const userList = await User.find();
  
  if (!userList) return res.status(500).json({ success: false, message: "No users found." });
  res.status(200).send(userList);
};

const getUserByToken = async (req, res) => {
  const secret = process.env.JWT_SECRET;
  const token = req.headers.authorization.replace("Bearer ", "");
  const decode = jwt.verify(token, secret);
  const { userId, isAdmin, exp } = decode;
  if (Date.now() >= exp * 1000)
    return res.status(404).send("Token is expired.");
  if (!userId) return res.status(404).send("User ID not found.");
  const userList = await User.findById(userId);
  res.status(200).send(userList);
};

const getNumberOfUser = async (req, res) => {
  const userCount = await User.estimatedDocumentCount();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
};

const createUser = async (req, res) => {
  const body = req.body;
  const userPassword = req.body.password;

  const newUser = new User({
    ...body,
    passwordHash: bcrypt.hashSync(userPassword, 10),
  });

  newUser
    .save()
    .then((createdUser) => {
      res.status(200).send(createdUser);
    })
    .catch((error) => {
      res.status(500).json({ success: false, error });
    });
};

const userLogIn = async (req, res) => {
  const { email, password } = req.body;
  const userDetails = await User.findOne({ email });
  const secret = process.env.JWT_SECRET;

  if(!userDetails) return res.status(404).json({ success: false, message: "user not found."});

  try {
    if(await bcrypt.compare(password, userDetails.passwordHash)){
      const token = jwt.sign(
        { userId: userDetails._id, isAdmin: userDetails.isAdmin },
        secret,
        { expiresIn: "1d"}
      );

      res.status(200).send({ email: email, token: token})

    } else {
      res.status(500).send("Invalid email or password.");
    }
  } catch (error) {
    res.status(500).json({ success: false, error});
  }
}

module.exports = {
  getAllUser,
  createUser,
  userLogIn,
  getNumberOfUser,
  getUserByToken,
};