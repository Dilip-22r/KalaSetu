import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    // password: {
    //   type: String,
    //   required: true,
    // },
    password: {
      type: String,
      required: function () {
        return this.authMethod === "local";
        // Password only required for normal signups
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      // Allows multiple local accounts with null googleId
    },
    authMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      default: "user",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
