const mongoose = require("mongoose");
const validator = require("validator");

const OTPSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate(v) {
      if (!validator.isEmail(v)) {
        throw new Error("Invalid Email");
      }
    },
  },
  otp: { type: String, required: true },
  expiryDate: { type: Date, default: Date.now },
});

OTPSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 3600 });

const OTPModel = mongoose.model("OTPModel", OTPSchema);
module.exports = OTPModel;
