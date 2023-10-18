const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = mongoose.Schema({
  firstName: {
    type: String,
    minlength: 3,
  },
  middleName: {
    type: String,
    minlength: 3,
  },
  lastName: {
    type: String,
    minlength: 3,
  },
  aboutMe: {
    type: String,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email address already present"],
    validate(v) {
      if (!validator.isEmail(v)) {
        throw new Error("invalid Email");
      }
    },
  },
  designation: {
    type: String,
    minlength: 3,
  },
  company: {
    type: String,
    minlength: 3,
  },
  gender: {
    type: String,
  },
  country: {
    type: String,
  },
  phone: {
    type: Number,
    min: 10,
  },
  dob: {
    type: Date,
  },
  socialMedia: {
    type: Array,
    index: false,
  },
  expertise: {
    type: String,
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "minimum 8 letters"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
