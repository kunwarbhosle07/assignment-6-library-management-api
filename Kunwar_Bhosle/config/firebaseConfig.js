const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let rawStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    // Remove wrapping quotes if accidentally added by user
    if ((rawStr.startsWith("'") && rawStr.endsWith("'")) || (rawStr.startsWith('"') && rawStr.endsWith('"'))) {
      // only strip if it wraps valid json (not double stringified object)
    }
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(rawStr)
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
