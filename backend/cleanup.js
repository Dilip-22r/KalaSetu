import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const res = await User.updateMany({ role: 'user' }, { followers: [], followRequests: [] });
    console.log('Updated users:', res.modifiedCount);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
