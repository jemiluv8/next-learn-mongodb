import mongoose, { Types } from "mongoose";

export interface iAttachment extends mongoose.Document {
  _id: Types.ObjectId;
  key: string;
  service_name: string;
  file_name: string;
  record_id: Types.ObjectId;
  content_type: string;
  byte_size: number;
  checksum: string;
  metadata: any;
  record_type: string;
}

export interface iAttachmentData
  extends Omit<iAttachment, "_id" | "attachment_id"> {
  _id: string;
}

// create a mongoose schema based on the above and make the created_at and updated_at use mongoose timestamps
export const attachmentSchema = new mongoose.Schema<iAttachment>(
  {
    key: {
      //full url
      type: String,
      required: [true, "Please provide a key for this attachment."],
    },
    service_name: {
      type: String,
      required: false,
      default: "s3",
    },
    file_name: {
      type: String,
      required: [true, "Please provide a name for this attachment."],
    },
    content_type: {
      type: String,
      required: true,
    },
    byte_size: {
      type: Number,
      required: true,
    },
    record_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    checksum: {
      type: String,
      required: false,
    },
    record_type: {
      type: String,
      required: false,
      index: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Attachment =
  mongoose.models.attachments ||
  mongoose.model<iAttachment>("attachments", attachmentSchema);
