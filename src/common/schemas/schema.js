module.exports = {
  registerSchema: {
    type: "object",
    properties: {
      email: { type: "string" },
      password: { type: "string" },
    },
  },
  verifyOtpSchema: {
    type: "object",
    properties: {
      otp: { type: "string" },
    },
  },
  loginSchema: {
    type: "object",
    properties: {
      email: { type: "string" },
      password: { type: "string" },
    },
  },
};