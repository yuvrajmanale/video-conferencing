


import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import Meeting from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const login = async (req, res) => {
  const { username, password } = req.body;

   console.log("USERNAME:", username); 

  if (!username || !password) {
    return res.status(400).json({ message: "please provide" });
  }

  try {
    const user = await User.findOne({ username });

    console.log("USER:", user); 

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "invalid password" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({ token });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(httpStatus.FOUND).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (e) {
    res.status(500).json({ message: `Something went wrong ${e}` });
  }
}


const getUserHistory = async(req, res) => {
  const {token} = req.query;

   try {
    const user = await User.findOne({token : token})
    const meeting = await Meeting.find({ user_id: user.username });
     res.json(meeting);
   } catch (e) {
    res.json({message : `Something went wrong ${e}`})
   }

}


const addToHistory = async(req, res) => {
  const {token, meeting_code} = req.body;

  try {
        const user = await User.findOne({token : token});

        const newMeeting = new Meeting({
          user_id : user.username,
          meetingCode : meeting_code
        })
    await newMeeting.save();
    res.status(httpStatus.CREATED).json({message: "Added code to History"})
    
  } catch (e) {
        
    res.json({message :`Something went wrong ${e}`})
  }
}
export { login, register, getUserHistory, addToHistory };