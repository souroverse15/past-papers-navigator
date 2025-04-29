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
  orderBy,
  serverTimestamp,
  deleteDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
  limit,
} from "firebase/firestore";

// ------------------- ATTENDANCE MANAGEMENT -------------------

// Create or update attendance for a specific date
export const markAttendance = async (classroomId, date, attendanceData) => {
  try {
    const attendanceRef = doc(db, `classrooms/${classroomId}/attendance`, date);
    await setDoc(
      attendanceRef,
      {
        ...attendanceData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error marking attendance:", error);
    return false;
  }
};

// Get attendance for a specific date
export const getAttendanceByDate = async (classroomId, date) => {
  try {
    const attendanceRef = doc(db, `classrooms/${classroomId}/attendance`, date);
    const attendanceSnap = await getDoc(attendanceRef);
    if (attendanceSnap.exists()) {
      return attendanceSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting attendance:", error);
    return null;
  }
};

// Get all attendance records for a classroom
export const getAllAttendance = async (classroomId) => {
  try {
    const attendanceCollection = collection(
      db,
      `classrooms/${classroomId}/attendance`
    );
    const attendanceSnap = await getDocs(attendanceCollection);
    return attendanceSnap.docs.map((doc) => ({
      date: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all attendance:", error);
    return [];
  }
};

// Get attendance summary for a student
export const getStudentAttendanceSummary = async (classroomId, studentId) => {
  try {
    const attendanceCollection = collection(
      db,
      `classrooms/${classroomId}/attendance`
    );
    const attendanceSnap = await getDocs(attendanceCollection);

    let present = 0;
    let absent = 0;
    let late = 0;
    const records = [];

    attendanceSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.students && data.students[studentId]) {
        const status = data.students[studentId];
        if (status === "present") present++;
        else if (status === "absent") absent++;
        else if (status === "late") late++;

        records.push({
          date: doc.id,
          status: status,
        });
      }
    });

    const total = present + absent + late;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      summary: {
        present,
        absent,
        late,
        total,
        percentage,
      },
      records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  } catch (error) {
    console.error("Error getting student attendance summary:", error);
    return {
      summary: { present: 0, absent: 0, late: 0, total: 0, percentage: 0 },
      records: [],
    };
  }
};

// ------------------- MODULES MANAGEMENT -------------------

// Create a new module
export const createModule = async (classroomId, moduleData) => {
  try {
    const moduleRef = collection(db, `classrooms/${classroomId}/modules`);
    const docRef = await addDoc(moduleRef, {
      ...moduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      order: moduleData.order || 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating module:", error);
    return null;
  }
};

// Get all modules for a classroom (ordered)
export const getModules = async (classroomId) => {
  try {
    const modulesRef = collection(db, `classrooms/${classroomId}/modules`);
    const q = query(modulesRef, orderBy("order", "asc"));
    const modulesSnap = await getDocs(q);
    return modulesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting modules:", error);
    return [];
  }
};

// Update a module
export const updateModule = async (classroomId, moduleId, moduleData) => {
  try {
    const moduleRef = doc(db, `classrooms/${classroomId}/modules`, moduleId);
    await updateDoc(moduleRef, {
      ...moduleData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating module:", error);
    return false;
  }
};

// Delete a module
export const deleteModule = async (classroomId, moduleId) => {
  try {
    const moduleRef = doc(db, `classrooms/${classroomId}/modules`, moduleId);
    await deleteDoc(moduleRef);
    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    return false;
  }
};

// Update module order (reordering)
export const updateModuleOrder = async (classroomId, moduleOrders) => {
  try {
    // moduleOrders is an array of objects with { id, order }
    const batch = db.batch();

    moduleOrders.forEach((module) => {
      const moduleRef = doc(db, `classrooms/${classroomId}/modules`, module.id);
      batch.update(moduleRef, {
        order: module.order,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error updating module order:", error);
    return false;
  }
};

// Track student module progress
export const updateStudentModuleProgress = async (
  classroomId,
  moduleId,
  studentId,
  progress
) => {
  try {
    const progressRef = doc(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/progress`,
      studentId
    );
    await setDoc(
      progressRef,
      {
        ...progress,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating student module progress:", error);
    return false;
  }
};

// Get student's progress for all modules in a classroom
export const getStudentModuleProgress = async (classroomId, studentId) => {
  try {
    const modulesRef = collection(db, `classrooms/${classroomId}/modules`);
    const modulesSnap = await getDocs(
      query(modulesRef, orderBy("order", "asc"))
    );

    const modules = modulesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      progress: null,
    }));

    // Fetch progress for each module
    for (const module of modules) {
      const progressRef = doc(
        db,
        `classrooms/${classroomId}/modules/${module.id}/progress`,
        studentId
      );
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        module.progress = progressSnap.data();
      }
    }

    return modules;
  } catch (error) {
    console.error("Error getting student module progress:", error);
    return [];
  }
};

// Get class-wide progress summary for a module
export const getModuleProgressSummary = async (classroomId, moduleId) => {
  try {
    const progressCollection = collection(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/progress`
    );
    const progressSnap = await getDocs(progressCollection);

    return progressSnap.docs.map((doc) => ({
      studentId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting module progress summary:", error);
    return [];
  }
};

// ------------------- TESTS & ASSESSMENTS -------------------

// Create a new test
export const createTest = async (classroomId, moduleId, testData) => {
  try {
    const testRef = collection(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/tests`
    );
    const docRef = await addDoc(testRef, {
      ...testData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating test:", error);
    return null;
  }
};

// Get all tests for a module
export const getModuleTests = async (classroomId, moduleId) => {
  try {
    const testsRef = collection(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/tests`
    );
    const testsSnap = await getDocs(testsRef);
    return testsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting module tests:", error);
    return [];
  }
};

// Save student test submission
export const saveTestSubmission = async (
  classroomId,
  moduleId,
  testId,
  studentId,
  submission
) => {
  try {
    const submissionRef = doc(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/tests/${testId}/submissions`,
      studentId
    );
    await setDoc(submissionRef, {
      ...submission,
      submittedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving test submission:", error);
    return false;
  }
};

// Get student test results
export const getStudentTestResults = async (
  classroomId,
  moduleId,
  testId,
  studentId
) => {
  try {
    const submissionRef = doc(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/tests/${testId}/submissions`,
      studentId
    );
    const submissionSnap = await getDoc(submissionRef);

    if (submissionSnap.exists()) {
      return submissionSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting student test results:", error);
    return null;
  }
};

// Grade student test (teacher)
export const gradeStudentTest = async (
  classroomId,
  moduleId,
  testId,
  studentId,
  gradeData
) => {
  try {
    const submissionRef = doc(
      db,
      `classrooms/${classroomId}/modules/${moduleId}/tests/${testId}/submissions`,
      studentId
    );
    await updateDoc(submissionRef, {
      grade: gradeData.grade,
      feedback: gradeData.feedback,
      gradedBy: gradeData.teacherId,
      gradedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error grading student test:", error);
    return false;
  }
};

// ------------------- PAYMENT MANAGEMENT -------------------

// Update student payment status
export const updateStudentPayment = async (
  classroomId,
  studentId,
  paymentData
) => {
  try {
    const paymentRef = doc(db, `classrooms/${classroomId}/payments`, studentId);
    await setDoc(
      paymentRef,
      {
        ...paymentData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating student payment:", error);
    return false;
  }
};

// Get student payment status
export const getStudentPayment = async (classroomId, studentId) => {
  try {
    const paymentRef = doc(db, `classrooms/${classroomId}/payments`, studentId);
    const paymentSnap = await getDoc(paymentRef);

    if (paymentSnap.exists()) {
      return paymentSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting student payment:", error);
    return null;
  }
};

// Get all payment records for a classroom
export const getAllPayments = async (classroomId) => {
  try {
    const paymentsCollection = collection(
      db,
      `classrooms/${classroomId}/payments`
    );
    const paymentsSnap = await getDocs(paymentsCollection);
    return paymentsSnap.docs.map((doc) => ({
      studentId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all payments:", error);
    return [];
  }
};

// ------------------- RESTRICTIONS ENGINE -------------------

// Set access restrictions for a classroom
export const setClassroomRestrictions = async (classroomId, restrictions) => {
  try {
    const restrictionsRef = doc(db, `classrooms/${classroomId}`, "settings");
    await setDoc(
      restrictionsRef,
      {
        restrictions,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error setting classroom restrictions:", error);
    return false;
  }
};

// Get classroom restrictions
export const getClassroomRestrictions = async (classroomId) => {
  try {
    const restrictionsRef = doc(db, `classrooms/${classroomId}`, "settings");
    const restrictionsSnap = await getDoc(restrictionsRef);

    if (restrictionsSnap.exists()) {
      return restrictionsSnap.data().restrictions || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting classroom restrictions:", error);
    return [];
  }
};

// Check if student passes all restrictions
export const checkStudentRestrictions = async (classroomId, studentId) => {
  try {
    // Get restrictions
    const restrictions = await getClassroomRestrictions(classroomId);
    if (!restrictions || restrictions.length === 0) return { allowed: true };

    const results = [];

    // Iterate over each restriction and check if student passes
    for (const restriction of restrictions) {
      let passes = true;
      let reason = "";

      switch (restriction.type) {
        case "attendance":
          // Check attendance percentage
          const attendanceSummary = await getStudentAttendanceSummary(
            classroomId,
            studentId
          );
          if (
            attendanceSummary.summary.percentage < restriction.minPercentage
          ) {
            passes = false;
            reason = `Attendance below required ${restriction.minPercentage}%`;
          }
          break;

        case "test":
          // Check test score
          if (restriction.moduleId && restriction.testId) {
            const testResult = await getStudentTestResults(
              classroomId,
              restriction.moduleId,
              restriction.testId,
              studentId
            );
            if (
              !testResult ||
              !testResult.grade ||
              testResult.grade < restriction.minScore
            ) {
              passes = false;
              reason = `Test score below required ${restriction.minScore}%`;
            }
          }
          break;

        case "assignment":
          // Check assignment submission
          // Placeholder for now - implementation would depend on assignment structure
          break;

        case "payment":
          // Check payment status
          const paymentStatus = await getStudentPayment(classroomId, studentId);
          if (!paymentStatus || paymentStatus.amountDue > 0) {
            passes = false;
            reason = "Payment required";
          }
          break;
      }

      results.push({
        restrictionType: restriction.type,
        passes,
        reason,
      });
    }

    // Student is allowed if they pass all restrictions
    const allowed = results.every((r) => r.passes);

    return {
      allowed,
      results,
    };
  } catch (error) {
    console.error("Error checking student restrictions:", error);
    return { allowed: false, error: "Error checking restrictions" };
  }
};

// ------------------- BADGES & ACHIEVEMENTS -------------------

// Award a badge to a student
export const awardBadge = async (classroomId, studentId, badge) => {
  try {
    const badgeRef = doc(db, `classrooms/${classroomId}/students/${studentId}`);
    await updateDoc(badgeRef, {
      badges: arrayUnion({
        ...badge,
        awardedAt: serverTimestamp(),
      }),
    });
    return true;
  } catch (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
};

// Get student badges
export const getStudentBadges = async (classroomId, studentId) => {
  try {
    const badgeRef = doc(db, `classrooms/${classroomId}/students/${studentId}`);
    const badgeSnap = await getDoc(badgeRef);

    if (badgeSnap.exists() && badgeSnap.data().badges) {
      return badgeSnap.data().badges;
    }
    return [];
  } catch (error) {
    console.error("Error getting student badges:", error);
    return [];
  }
};

// ------------------- LEADERBOARDS -------------------

// Generate classroom leaderboard
export const generateLeaderboard = async (
  classroomId,
  leaderboardType = "test_scores"
) => {
  try {
    const students = [];

    // Get all students in the classroom
    const classroomRef = doc(db, "classrooms", classroomId);
    const classroomSnap = await getDoc(classroomRef);

    if (!classroomSnap.exists()) {
      return [];
    }

    const studentIds = classroomSnap.data().studentIds || [];

    // Build leaderboard based on type
    switch (leaderboardType) {
      case "test_scores":
        // This would need to aggregate all test scores for each student
        // Simplified implementation
        break;

      case "attendance":
        for (const studentId of studentIds) {
          const attendance = await getStudentAttendanceSummary(
            classroomId,
            studentId
          );
          students.push({
            studentId,
            score: attendance.summary.percentage,
            details: attendance.summary,
          });
        }
        break;

      case "modules_completed":
        for (const studentId of studentIds) {
          const modules = await getStudentModuleProgress(
            classroomId,
            studentId
          );
          const completedCount = modules.filter(
            (m) => m.progress && m.progress.completed
          ).length;

          students.push({
            studentId,
            score: completedCount,
            details: { total: modules.length, completed: completedCount },
          });
        }
        break;
    }

    // Sort by score descending
    return students.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    return [];
  }
};
