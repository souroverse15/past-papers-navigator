// This file contains the security rules for Firebase Firestore
// Copy these rules to the Firebase Console: https://console.firebase.google.com/
// Go to Firestore Database > Rules and paste these rules

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Check if the user is the designated admin
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'souroveahmed15@gmail.com';
    }
    
    // Check if the user is banned
    function isUserBanned(email) {
      return exists(/databases/$(database)/documents/users/$(email)) && 
             (get(/databases/$(database)/documents/users/$(email)).data.status == 'banned' ||
              get(/databases/$(database)/documents/users/$(email)).data.isBanned == true);
    }

    // Check if the user is a teacher
    function isTeacher() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'Teacher';
    }
    
    // Allow authenticated users to read and write to their own user document
    match /users/{email} {
      // Anyone authenticated can read user data, admin can read all, banned users can't read anything
      allow read: if (request.auth != null && !isUserBanned(request.auth.token.email) && 
                     (request.auth.token.email == email || isAdmin()));
      
      // Only the user can update their own document (excluding role, status, isBanned)
      allow create, update: if request.auth != null && 
                   request.auth.token.email == email &&
                   !isUserBanned(request.auth.token.email) &&
                   (!request.resource.data.diff(resource.data).affectedKeys()
                     .hasAny(['role', 'status', 'isBanned', 'bannedAt', 'unbannedAt']));
      
      // Only admin can update roles, ban status, or delete user documents
      allow update, delete: if isAdmin();
    }
    
    // Allow admin to list all users for the admin dashboard
    match /users/{document=**} {
      allow read: if isAdmin();
    }

    // Classes collection rules
    match /classes/{classId} {
      // Teachers can create their own classes
      allow create: if isTeacher() && 
                   request.resource.data.teacherEmail == request.auth.token.email;
      
      // Teachers can read and update their own classes
      allow read, update: if isTeacher() && 
                         resource.data.teacherEmail == request.auth.token.email;
      
      // Admin can read and manage all classes
      allow read, write: if isAdmin();
    }

    // Attendance collection rules
    match /attendance/{attendanceId} {
      // Teachers can create and update attendance for their classes
      allow create, update: if isTeacher() && 
                           exists(/databases/$(database)/documents/classes/$(request.resource.data.classId)) &&
                           get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.teacherEmail == request.auth.token.email;
      
      // Teachers can read attendance for their classes
      allow read: if isTeacher() && 
                 exists(/databases/$(database)/documents/classes/$(resource.data.classId)) &&
                 get(/databases/$(database)/documents/classes/$(resource.data.classId)).data.teacherEmail == request.auth.token.email;
      
      // Admin can read and manage all attendance records
      allow read, write: if isAdmin();
    }
    
    // Default: allow authenticated non-banned users to read, but only admin can write
    match /{document=**} {
      allow read: if request.auth != null && !isUserBanned(request.auth.token.email);
      allow write: if isAdmin();
    }
  }
}
*/
