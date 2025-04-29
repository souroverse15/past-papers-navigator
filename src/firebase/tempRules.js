// TEMPORARY RULES FOR DEVELOPMENT ONLY
// DO NOT USE THESE RULES IN PRODUCTION!
// These rules allow anyone to read/write your database

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/
