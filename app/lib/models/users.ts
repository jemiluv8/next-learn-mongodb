import mongoose, { Types } from "mongoose";

export interface iUser extends mongoose.Document {
 _id: Types.ObjectId;
 name: string;
 email: string;
 password: string;
}

const userSchema = new mongoose.Schema<iUser>({
  name: {
    type: String,
    required: [true, "Please provide a name for this team."],
    maxlength: [600, "Name cannot be more than 600 characters"],
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

export const User = mongoose.models.users || mongoose.model<iUser>("users", userSchema);