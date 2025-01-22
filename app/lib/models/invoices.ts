import mongoose, { Schema, Types } from "mongoose";

export interface Invoices extends mongoose.Document {
 _id: Types.ObjectId;
 customer_id: Types.ObjectId;
 date: string;
 status: string;
 amount: number;
}

const invoicesSchema = new mongoose.Schema<Invoices>({
  customer_id: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a name for this team."],
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
});

invoicesSchema.virtual('customer', {
  ref: "customer",
  localField: "customer_id",
  foreignField: "_id",
  justOne: true,
})

invoicesSchema.virtual('customer', {
  ref: "customer",
  localField: "customer_id",
  foreignField: "_id",
  justOne: true,
})

export const Invoice = mongoose.models.invoices || mongoose.model<Invoices>("invoices", invoicesSchema);