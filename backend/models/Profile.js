import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    displayName: { type: String },
    age: { type: Number },
    gender: { type: String },
    skills: { type: String },
    location: { type: String },
    about: { type: String },
    photo: { type: String, default: "" },
    userType: { type: String, enum: ["Artisan", "NGO", "user"] },
    organizationName: { type: String },
    verificationDocument: { type: String },
    organizationId: { type: String },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
