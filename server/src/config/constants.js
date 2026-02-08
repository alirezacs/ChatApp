const ROOM_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
};

const MEMBERSHIP_STATUS = {
  MEMBER: "member",
  PENDING: "pending",
  INVITED: "invited",
};

const MEMBERSHIP_ROLE = {
  OWNER: "owner",
  MEMBER: "member",
};

const NOTIFICATION_TYPES = {
  JOIN_REQUEST: "join_request",
  JOIN_APPROVED: "join_approved",
  JOIN_REJECTED: "join_rejected",
  ROOM_INVITE: "room_invite",
};

module.exports = {
  ROOM_TYPES,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_ROLE,
  NOTIFICATION_TYPES,
};
