import { db } from "./config";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  addDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { jwtDecode } from "jwt-decode";

// Collection reference
const usersCollection = collection(db, "users");

// Save or update user after login
export const saveUserOnLogin = async (user) => {
  if (!user || !user.email) return null;

  try {
    const userRef = doc(db, "users", user.email);
    const userSnap = await getDoc(userRef);

    const userData = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      lastLogin: serverTimestamp(),
    };

    // Special roles for admin user
    const isAdmin = user.email === "souroveahmed15@gmail.com";
    if (isAdmin) {
      userData.role = "Admin";
      console.log("Setting admin role for:", user.email);
    } else {
      userData.role = "User"; // Default role
    }

    if (!userSnap.exists()) {
      // New user, set default status
      userData.status = "active";
      userData.isBanned = false;
      userData.createdAt = serverTimestamp();
      console.log("Creating new user with role:", userData.role);
    } else {
      // Existing user, check if they're banned
      const existingData = userSnap.data();

      // Log user data for debugging
      console.log("Existing user data:", existingData);

      if (existingData.status === "banned" || existingData.isBanned) {
        // Don't update banned users
        return existingData;
      }
    }

    console.log("Saving user with final data:", userData);
    await setDoc(userRef, userData, { merge: true });

    // Return user with role
    const updatedUserSnap = await getDoc(userRef);
    return updatedUserSnap.data();
  } catch (error) {
    console.error("Error saving user data:", error);
    return null;
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  if (!email) return null;

  try {
    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }

    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    console.log("Attempting to fetch all users");

    // Attempt to get the current user's document first to verify admin status
    const currentUser = localStorage.getItem("google_auth_token");
    if (!currentUser) {
      console.error("No user is logged in");
      return [];
    }

    const decoded = jwtDecode(currentUser);
    console.log("Current user email:", decoded.email);

    // Check if the current user is admin
    const isAdmin = decoded.email === "souroveahmed15@gmail.com";
    console.log("Is admin according to email check:", isAdmin);

    if (!isAdmin) {
      console.error("User is not admin, cannot fetch all users");
      alert("You don't have admin privileges to view all users.");
      return [];
    }

    // Since we're admin, fetch all users
    const usersSnap = await getDocs(usersCollection);
    console.log("Successfully fetched users:", usersSnap.size);

    return usersSnap.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting users:", error);
    // Check if this is a permission error
    if (error.code === "permission-denied") {
      console.error(
        "Permission denied. Make sure you have admin privileges and Firestore rules are updated."
      );
      alert(
        "Permission denied. Make sure you have admin privileges and have updated the Firestore rules."
      );
    } else {
      // Log the full error for debugging
      console.error("Detailed error:", JSON.stringify(error));
      alert(`Error fetching users: ${error.message}`);
    }
    return [];
  }
};

// Update user role (admin only)
export const updateUserRole = async (email, newRole) => {
  if (!email || !newRole) return false;

  try {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const q = query(usersCollection, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting users by role:", error);
    return [];
  }
};

// Ban a user (admin only)
export const banUser = async (email) => {
  if (!email) return false;

  try {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
      status: "banned",
      isBanned: true,
      bannedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error banning user:", error);
    return false;
  }
};

// Unban a user (admin only)
export const unbanUser = async (email) => {
  if (!email) return false;

  try {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
      status: "active",
      isBanned: false,
      unbannedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error unbanning user:", error);
    return false;
  }
};

// Remove/delete a user (admin only)
export const removeUser = async (email) => {
  if (!email) return false;

  try {
    const userRef = doc(db, "users", email);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error removing user:", error);
    return false;
  }
};

// Get user's paper goals
export const getUserGoals = async (userEmail) => {
  if (!userEmail) {
    console.error("No user email provided to getUserGoals");
    return [];
  }

  try {
    console.log(`Fetching goals for user: ${userEmail}`);

    // Reference to the user's goals collection
    const goalsRef = collection(db, "users", userEmail, "goals");
    const goalsSnapshot = await getDocs(goalsRef);

    if (goalsSnapshot.empty) {
      console.log(`No goals found for user: ${userEmail}`);
      return [];
    }

    // Map documents to objects
    const goals = goalsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamps to JavaScript Dates
      added: doc.data().added ? doc.data().added.toDate() : null,
      targetDate: doc.data().targetDate
        ? doc.data().targetDate.toDate
          ? doc.data().targetDate.toDate()
          : doc.data().targetDate
        : null,
      completedDate: doc.data().completedDate
        ? doc.data().completedDate.toDate
          ? doc.data().completedDate.toDate()
          : doc.data().completedDate
        : null,
    }));

    console.log(`Retrieved ${goals.length} goals for ${userEmail}`);

    // Return sorted by added date (newest first)
    return goals.sort((a, b) => {
      return b.added - a.added;
    });
  } catch (error) {
    console.error(`Error fetching goals for ${userEmail}:`, error);
    return [];
  }
};

// Add a paper goal for user
export const addPaperGoal = async (userEmail, paperInfo) => {
  if (!userEmail || !paperInfo || !paperInfo.path) {
    console.error("Invalid arguments for addPaperGoal:", {
      userEmail,
      paperInfo,
    });
    return false;
  }

  try {
    console.log(`Attempting to add paper goal for ${userEmail}:`, paperInfo);

    // Normalize path to ensure consistency
    const normalizedPath = paperInfo.path
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/")
      .trim();

    // Create a cleaned version of the paper info with the normalized path
    const cleanPaperInfo = {
      ...paperInfo,
      path: normalizedPath,
      added: serverTimestamp(),
      completed: false,
      targetDate: paperInfo.targetDate || null,
      completedDate: null,
    };

    // Check if goal already exists to prevent duplicates
    const goalRef = collection(db, "users", userEmail, "goals");
    const q = query(goalRef, where("path", "==", normalizedPath));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log(`Paper already exists in goals: ${normalizedPath}`);
      return false;
    }

    // Add the paper goal to Firestore
    console.log("Adding paper goal to Firestore:", cleanPaperInfo);
    await addDoc(collection(db, "users", userEmail, "goals"), cleanPaperInfo);

    console.log(`Successfully added paper goal: ${normalizedPath}`);
    return true;
  } catch (error) {
    console.error(`Error adding paper goal (${paperInfo.path}):`, error);
    return false;
  }
};

// Mark a paper goal as completed
export const markGoalComplete = async (email, goalId) => {
  if (!email || !goalId) return false;

  try {
    const goalsRef = doc(db, "userGoals", email);
    const goalsSnap = await getDoc(goalsRef);

    if (!goalsSnap.exists()) return false;

    const goals = goalsSnap.data().goals || [];
    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        return { ...goal, completed: true, completedAt: serverTimestamp() };
      }
      return goal;
    });

    await updateDoc(goalsRef, {
      goals: updatedGoals,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error marking goal as complete:", error);
    return false;
  }
};

// Remove a paper goal
export const removePaperGoal = async (email, goalId) => {
  if (!email || !goalId) return false;

  try {
    console.log(`Removing paper goal: ${goalId} for user: ${email}`);

    // Reference to the specific goal document using the new structure
    const goalRef = doc(db, "users", email, "goals", goalId);

    // Delete the goal document
    await deleteDoc(goalRef);

    console.log(`Successfully removed paper goal: ${goalId}`);
    return true;
  } catch (error) {
    console.error("Error removing paper goal:", error);
    return false;
  }
};

// Get all completed mock exams for a user
export const getUserCompletedMocks = async (email) => {
  if (!email) return [];

  try {
    const mocksRef = collection(db, "mockExams");
    const q = query(mocksRef, where("userEmail", "==", email));
    const mocksSnap = await getDocs(q);

    return mocksSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting completed mocks:", error);
    return [];
  }
};

// Function to update a mock exam with score
export const updateMockExamScore = async (examId, score) => {
  if (!examId) {
    console.error("Cannot update mock exam: No exam ID provided");
    return false;
  }

  try {
    // Ensure score is properly handled - 0 should be saved as 0, not null or undefined
    const scoreToSave = score === 0 ? 0 : score || null;

    const docRef = doc(db, "mockExams", examId);
    await updateDoc(docRef, {
      score: scoreToSave,
      finalScoreUpdatedAt: serverTimestamp(),
    });

    console.log(
      `Successfully updated mock exam ${examId} with score: ${scoreToSave}`
    );
    return true;
  } catch (error) {
    console.error("Error updating mock exam score:", error);
    return false;
  }
};

// Function to update a mock exam by paper path with a score
export const updateMockExamByPath = async (userEmail, paperPath, score) => {
  if (!userEmail || !paperPath) {
    console.error("Cannot update mock exam: missing user email or paper path");
    return false;
  }

  try {
    // Normalize path for comparison
    const normalizedPath = paperPath
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/")
      .trim();

    // Find the most recent mock exam for this user and paper path
    const q = query(
      collection(db, "mockExams"),
      where("userEmail", "==", userEmail),
      where("rawPath", "==", normalizedPath),
      orderBy("completedAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("No mock exam found for this user and paper path");
      return false;
    }

    // Ensure score is properly handled - 0 should be saved as 0, not null or undefined
    const scoreToSave = score === 0 ? 0 : score || null;

    // Update the most recent mock exam
    const docRef = doc(db, "mockExams", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      score: scoreToSave,
      finalScoreUpdatedAt: serverTimestamp(),
    });

    console.log(
      `Successfully updated mock exam for paper ${normalizedPath} with score: ${scoreToSave}`
    );
    return true;
  } catch (error) {
    console.error("Error updating mock exam by path:", error);
    return false;
  }
};

// Auto-complete goal when a mock exam is completed
export const autoCompleteGoalWhenMockCompleted = async (
  email,
  paperPath,
  mockScore
) => {
  if (!email || !paperPath) {
    console.error(
      "Missing required parameters for autoCompleteGoalWhenMockCompleted:",
      {
        email,
        paperPath,
      }
    );
    return false;
  }

  try {
    console.log(
      `Checking if paper ${paperPath} exists in goals for user ${email}`
    );

    // Normalize the paper path for comparison
    const normalizedPaperPath = paperPath
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/")
      .trim();

    // Get user's goals
    const goalsRef = collection(db, "users", email, "goals");
    const q = query(goalsRef, where("path", "==", normalizedPaperPath));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(
        `Paper ${normalizedPaperPath} not found in goals for user ${email}`
      );
      return false;
    }

    // Update the goal to completed status
    for (const doc of querySnapshot.docs) {
      const goalRef = doc.ref;
      // Handle score properly, ensuring 0 is saved as 0 and not converted to null
      const scoreToSave =
        mockScore === 0 ? 0 : mockScore !== undefined ? mockScore : null;

      await updateDoc(goalRef, {
        completed: true,
        completedDate: serverTimestamp(),
        completedAsMock: true,
        mockScore: scoreToSave,
      });
      console.log(
        `Updated goal ${doc.id} for paper ${normalizedPaperPath} to completed status with score ${scoreToSave}`
      );
    }

    console.log(`Successfully completed goal for paper ${normalizedPaperPath}`);
    return true;
  } catch (error) {
    console.error(`Error auto-completing goal for paper ${paperPath}:`, error);
    return false;
  }
};

// Set target date for a goal
export const setGoalTargetDate = async (email, goalId, targetDate) => {
  if (!email || !goalId) return false;

  try {
    const goalsRef = doc(db, "userGoals", email);
    const goalsSnap = await getDoc(goalsRef);

    if (!goalsSnap.exists()) return false;

    const goals = goalsSnap.data().goals || [];
    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        return { ...goal, targetDate };
      }
      return goal;
    });

    await updateDoc(goalsRef, {
      goals: updatedGoals,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error setting goal target date:", error);
    return false;
  }
};

// Batch set target date for multiple goals
export const batchSetGoalTargetDate = async (email, goalIds, targetDate) => {
  if (!email || !goalIds || goalIds.length === 0) return false;

  try {
    const goalsRef = doc(db, "userGoals", email);
    const goalsSnap = await getDoc(goalsRef);

    if (!goalsSnap.exists()) return false;

    const goals = goalsSnap.data().goals || [];
    const updatedGoals = goals.map((goal) => {
      if (goalIds.includes(goal.id)) {
        return { ...goal, targetDate };
      }
      return goal;
    });

    await updateDoc(goalsRef, {
      goals: updatedGoals,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error batch setting goal target dates:", error);
    return false;
  }
};

export const updateGoalStatus = async (userEmail, goalId, isCompleted) => {
  if (!userEmail || !goalId) {
    console.error("Missing required parameters:", { userEmail, goalId });
    return false;
  }

  try {
    console.log(
      `Updating goal status: ${goalId} to ${
        isCompleted ? "completed" : "not completed"
      }`
    );

    // Reference to the specific goal document
    const goalRef = doc(db, "users", userEmail, "goals", goalId);

    // Update the goal with completed status and completion date if needed
    await updateDoc(goalRef, {
      completed: isCompleted,
      completedDate: isCompleted ? serverTimestamp() : null,
    });

    console.log(`Successfully updated goal status for ${goalId}`);
    return true;
  } catch (error) {
    console.error(`Error updating goal status:`, error);
    return false;
  }
};

export const deleteGoal = async (userEmail, goalId) => {
  if (!userEmail || !goalId) {
    console.error("Missing required parameters:", { userEmail, goalId });
    return false;
  }

  try {
    console.log(`Deleting goal: ${goalId} for user: ${userEmail}`);

    // Reference to the specific goal document
    const goalRef = doc(db, "users", userEmail, "goals", goalId);

    // Delete the goal document
    await deleteDoc(goalRef);

    console.log(`Successfully deleted goal: ${goalId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting goal:`, error);
    return false;
  }
};
