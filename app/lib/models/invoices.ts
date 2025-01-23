import mongoose, { Schema, Types } from "mongoose";

export interface iInvoice extends mongoose.Document {
 _id: Types.ObjectId;
 customer_id: Types.ObjectId;
 date: string;
 status: string;
 amount: number;
}

export interface iInvoiceData extends Omit<iInvoice, "_id" | "customer_id"> {
  customer_id: string;
  _id: string;
}

const invoicesSchema = new mongoose.Schema<iInvoice>({
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

export const Invoice = mongoose.models.invoices || mongoose.model<iInvoice>("invoices", invoicesSchema);