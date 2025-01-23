import mongoose, { Types } from "mongoose";
import { iInvoice } from "./invoices";

export interface iCustomer extends mongoose.Document {
 _id: Types.ObjectId;
 name: string;
 email: string;
 image_url: string;
}

export interface iCustomerData extends Omit<iCustomer, "_id" | "customer_id"> {
  _id: string;
}

const customerSchema = new mongoose.Schema<iCustomer>({
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
export const Customer = mongoose.models.customers || mongoose.model<iCustomer>("customers", customerSchema);