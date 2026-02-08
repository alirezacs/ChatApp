const mongoose = require("mongoose");
const { ROOM_TYPES } = require("../config/constants");

const { Schema } = mongoose;

const RoomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(ROOM_TYPES), required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    backgroundId: { type: String, required: true },
  },
  { timestamps: true }
);

RoomSchema.index({ type: 1, createdAt: -1 });
RoomSchema.index({ ownerId: 1 });

module.exports = mongoose.model("Room", RoomSchema);
