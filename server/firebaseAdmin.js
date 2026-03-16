const admin = require("firebase-admin");

const serviceAccount = require("./config/habittrack-2c615-firebase-adminsdk-fbsvc-bad527660e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;