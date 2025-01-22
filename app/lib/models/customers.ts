import mongoose, { Types } from "mongoose";

export interface Customer extends mongoose.Document {
 _id: Types.ObjectId;
 name: string;
 email: string;
 image_url: string;
}

const customerSchema = new mongoose.Schema<Customer>({
  name: {
    type: String,
    required: [true, "Please provide a name for this team."],
    maxlength: [600, "Name cannot be more than 600 characters"],
  },
  email: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    required: true
  }
});

customerSchema.index({ name: "text", email: "text" });

customerSchema.index(
  {
    "$**": "text"
  },
  {
    weights: {
      name: 1,
      email: 2,
    },
  }
);
export const Customer = mongoose.models.customers || mongoose.model<Customer>("customers", customerSchema);