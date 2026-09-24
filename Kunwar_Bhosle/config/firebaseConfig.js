const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (err) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable JSON string: ${err.message}`);
  }
} else {
  const accountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
  const resolvedPath = path.isAbsolute(accountPath)
    ? accountPath
    : path.resolve(process.cwd(), accountPath);

  if (fs.existsSync(resolvedPath)) {
    try {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } catch (err) {
      throw new Error(`Failed to read/parse service account file at ${resolvedPath}: ${err.message}`);
    }
  } else {
    throw new Error(
      `Firebase service account credentials missing!\n` +
      `Please provide FIREBASE_SERVICE_ACCOUNT environment variable or place a valid serviceAccountKey.json file at ${resolvedPath}.`
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = { admin, db };
