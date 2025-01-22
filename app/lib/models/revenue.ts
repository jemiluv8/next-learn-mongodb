import mongoose, { Types } from "mongoose";

export interface iRevenue extends mongoose.Document {
 _id: Types.ObjectId;
 month: string;
 revenue: number;
}

const schema = new mongoose.Schema<iRevenue>({
  month: {
    type: String,
    required: [true, "Please provide a month for this team."],
  },
  revenue: {
    type: Number,
    required: true
  },
});

export const Revenue = mongoose.models.revenues || mongoose.model<iRevenue>("revenues", schema);