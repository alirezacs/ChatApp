const mongoose = require("mongoose");
const { MEMBERSHIP_ROLE, MEMBERSHIP_STATUS } = require("../config/constants");

const { Schema } = mongoose;

const MembershipSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(MEMBERSHIP_ROLE),
      default: MEMBERSHIP_ROLE.MEMBER,
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ roomId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Membership", MembershipSchema);
