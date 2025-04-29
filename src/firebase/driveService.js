import { db } from "./config";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Load the Google API client library
export const loadGoogleApi = (callback) => {
  // Check if the script is already loaded
  if (window.gapi) {
    if (callback) callback();
    return;
  }

  // Add the Google API script
  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/api.js";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.gapi.load("client:auth2:picker", () => {
      initializeGoogleClient(callback);
    });
  };
  document.body.appendChild(script);
};

// Initialize the Google API client
const initializeGoogleClient = (callback) => {
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  ];
  const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

  window.gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(() => {
      if (callback) callback();
    });
};

// Create a Google Drive picker instance
export const createDrivePicker = (onPickerSelect, onPickerCancel) => {
  loadGoogleApi(() => {
    const oauthToken = getGoogleAuthToken();
    if (!oauthToken) {
      // Need to authenticate first
      authenticateWithGoogle(() => {
        showDrivePicker(onPickerSelect, onPickerCancel);
      });
    } else {
      showDrivePicker(onPickerSelect, onPickerCancel);
    }
  });
};

// Get the current OAuth token
const getGoogleAuthToken = () => {
  if (window.gapi && window.gapi.auth2) {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance && authInstance.isSignedIn.get()) {
      return authInstance.currentUser.get().getAuthResponse().access_token;
    }
  }
  return null;
};

// Authenticate with Google
const authenticateWithGoogle = (callback) => {
  if (window.gapi && window.gapi.auth2) {
    const authInstance = window.gapi.auth2.getAuthInstance();
    authInstance.signIn().then(() => {
      if (callback) callback();
    });
  }
};

// Show the Drive picker
const showDrivePicker = (onPickerSelect, onPickerCancel) => {
  const oauthToken = getGoogleAuthToken();
  if (!oauthToken) return;

  // The API key from Google Cloud Console
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // The App ID from the Google Cloud Console
  const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID;

  // Create a new picker
  const picker = new window.google.picker.PickerBuilder()
    .addView(window.google.picker.ViewId.DOCUMENTS)
    .addView(window.google.picker.ViewId.PRESENTATIONS)
    .addView(window.google.picker.ViewId.SPREADSHEETS)
    .addView(window.google.picker.ViewId.PDFS)
    .addView(window.google.picker.ViewId.FORMS)
    .addView(window.google.picker.ViewId.DOCS_IMAGES)
    .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
    .setOAuthToken(oauthToken)
    .setDeveloperKey(API_KEY)
    .setAppId(APP_ID)
    .setCallback((data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        if (onPickerSelect) onPickerSelect(data.docs);
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onPickerCancel) onPickerCancel();
      }
    })
    .build();

  picker.setVisible(true);
};

// Process Google Drive files to store the metadata
export const processGoogleDriveFiles = (files) => {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    iconUrl: file.iconUrl,
    thumbnailUrl: file.thumbnailLink || null,
    embedUrl: getEmbedUrl(file),
    viewUrl:
      file.embedLink ||
      file.webViewLink ||
      `https://drive.google.com/file/d/${file.id}/view`,
    size: file.sizeBytes ? formatFileSize(parseInt(file.sizeBytes)) : "Unknown",
    lastModified: file.modifiedDate || null,
    source: "google_drive",
  }));
};

// Get the appropriate embed URL based on file type
const getEmbedUrl = (file) => {
  const fileId = file.id;

  if (file.mimeType.includes("spreadsheet")) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
  } else if (file.mimeType.includes("presentation")) {
    return `https://docs.google.com/presentation/d/${fileId}/preview`;
  } else if (file.mimeType.includes("document")) {
    return `https://docs.google.com/document/d/${fileId}/preview`;
  } else if (file.mimeType.includes("pdf")) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } else if (file.mimeType.includes("image/")) {
    return `https://drive.google.com/uc?id=${fileId}`;
  } else if (file.mimeType.includes("video/")) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } else if (file.mimeType.includes("form")) {
    return `https://docs.google.com/forms/d/${fileId}/viewform`;
  }

  // Default fallback
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
};

// Save Google Drive file metadata to Firestore
export const saveDriveFileToAnnouncement = async (
  classroomId,
  announcementId,
  fileMetadata
) => {
  try {
    const announcementRef = doc(
      db,
      `classrooms/${classroomId}/announcements`,
      announcementId
    );

    // Add the file to the announcement's attachments
    await setDoc(
      announcementRef,
      {
        attachments: fileMetadata,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error saving Drive file to announcement:", error);
    return false;
  }
};

// Save Google Drive file metadata to an assignment
export const saveDriveFileToAssignment = async (
  classroomId,
  assignmentId,
  fileMetadata
) => {
  try {
    const assignmentRef = doc(
      db,
      `classrooms/${classroomId}/assignments`,
      assignmentId
    );

    // Add the file to the assignment's attachments
    await setDoc(
      assignmentRef,
      {
        attachments: fileMetadata,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error saving Drive file to assignment:", error);
    return false;
  }
};

// Save Google Drive file metadata to a module
export const saveDriveFileToModule = async (
  classroomId,
  moduleId,
  fileMetadata
) => {
  try {
    const moduleRef = doc(db, `classrooms/${classroomId}/modules`, moduleId);

    // Add the file to the module's materials
    await setDoc(
      moduleRef,
      {
        materials: fileMetadata,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error saving Drive file to module:", error);
    return false;
  }
};

// Track file access by students
export const trackFileAccess = async (
  classroomId,
  studentId,
  fileId,
  fileType
) => {
  try {
    const accessData = {
      studentId,
      fileId,
      fileType, // 'announcement', 'assignment', 'module', etc.
      accessedAt: serverTimestamp(),
    };

    await addDoc(
      collection(db, `classrooms/${classroomId}/fileAccess`),
      accessData
    );
    return true;
  } catch (error) {
    console.error("Error tracking file access:", error);
    return false;
  }
};
