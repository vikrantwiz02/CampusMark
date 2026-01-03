
import { AttendanceRecord, Course, Semester } from "../types";
import MongoService from "./mongoService";
import { STORAGE_KEYS, BACKUP_CONFIG } from "../config";

class SyncService {
  private static STORAGE_KEY_RECORDS = STORAGE_KEYS.RECORDS;
  private static STORAGE_KEY_COURSES = STORAGE_KEYS.COURSES;
  private static STORAGE_KEY_SEMESTERS = STORAGE_KEYS.SEMESTERS;
  private static STORAGE_KEY_USER = STORAGE_KEYS.USER;

  private static getUserId(): string | null {
    try {
      const user = localStorage.getItem(this.STORAGE_KEY_USER);
      if (user) {
        const userData = JSON.parse(user);
        return userData.email || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static getLocalData() {
    try {
      const records = JSON.parse(localStorage.getItem(this.STORAGE_KEY_RECORDS) || '[]');
      const courses = JSON.parse(localStorage.getItem(this.STORAGE_KEY_COURSES) || '[]');
      const semesters = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SEMESTERS) || '[]');
      return { records, courses, semesters };
    } catch (e) {
      console.error("Storage corruption detected. Resetting local data.");
      return { records: [], courses: [], semesters: [] };
    }
  }

  static async saveLocally(records: AttendanceRecord[], courses: Course[], semesters: Semester[]) {
    localStorage.setItem(this.STORAGE_KEY_RECORDS, JSON.stringify(records));
    localStorage.setItem(this.STORAGE_KEY_COURSES, JSON.stringify(courses));
    localStorage.setItem(this.STORAGE_KEY_SEMESTERS, JSON.stringify(semesters));
    
    if (navigator.onLine) {
      await this.syncWithMongoDB(records, courses, semesters);
    }
  }

  static async clearAllData() {
    console.log("Performing Master Reset...");
    
    const userId = this.getUserId();
    
    localStorage.clear();
    
    if (navigator.onLine && userId) {
      console.log("Deleting data from MongoDB...");
      await MongoService.deleteUserData(userId);
    }
    
    console.log("All data cleared.");
  }

  static async syncWithMongoDB(records: AttendanceRecord[], courses: Course[], semesters: Semester[]) {
    if (!navigator.onLine) {
      console.log("Offline - sync postponed");
      return false;
    }

    const userId = this.getUserId();
    if (!userId) {
      console.log("No user logged in - skipping sync");
      return false;
    }

    try {
      console.log("Syncing data to MongoDB...");
      console.log("User ID:", userId);
      console.log("Records to sync:", records.filter(r => !r.isSynced).length);
      console.log("Courses to sync:", courses.filter(c => !c.isSynced).length);
      console.log("Semesters to sync:", semesters.filter(s => !s.isSynced).length);
      
      // Sync all data types
      const [recordsResult, coursesResult, semestersResult] = await Promise.all([
        MongoService.syncRecords(records, userId),
        MongoService.syncCourses(courses, userId),
        MongoService.syncSemesters(semesters, userId)
      ]);

      const totalSynced = 
        recordsResult.synced + 
        coursesResult.synced + 
        semestersResult.synced;

      if (totalSynced > 0) {
        console.log(`Synced ${totalSynced} items to MongoDB`);
        
        // Update local data to mark items as synced
        const updatedRecords = records.map(r => ({ ...r, isSynced: true }));
        const updatedCourses = courses.map(c => ({ ...c, isSynced: true }));
        const updatedSemesters = semesters.map(s => ({ ...s, isSynced: true }));
        
        localStorage.setItem(this.STORAGE_KEY_RECORDS, JSON.stringify(updatedRecords));
        localStorage.setItem(this.STORAGE_KEY_COURSES, JSON.stringify(updatedCourses));
        localStorage.setItem(this.STORAGE_KEY_SEMESTERS, JSON.stringify(updatedSemesters));
      }

      return true;
    } catch (error) {
      console.error("MongoDB Sync Failed:", error);
      return false;
    }
  }

  static async fetchAndMergeFromMongoDB() {
    const userId = this.getUserId();
    if (!userId || !navigator.onLine) {
      return this.getLocalData();
    }

    try {
      console.log("Fetching data from MongoDB...");
      const remoteData = await MongoService.fetchUserData(userId);
      const localData = this.getLocalData();

      const mergeByUpdatedAt = <T extends { id: string; updatedAt: number }>(
        local: T[], 
        remote: T[]
      ): T[] => {
        const merged = new Map<string, T>();
        
        [...local, ...remote].forEach(item => {
          const existing = merged.get(item.id);
          if (!existing || item.updatedAt > existing.updatedAt) {
            merged.set(item.id, item);
          }
        });
        
        return Array.from(merged.values());
      };

      const mergedData = {
        records: mergeByUpdatedAt(localData.records, remoteData.records),
        courses: mergeByUpdatedAt(localData.courses, remoteData.courses),
        semesters: mergeByUpdatedAt(localData.semesters, remoteData.semesters)
      };

      this.saveLocally(mergedData.records, mergedData.courses, mergedData.semesters);
      
      console.log("Data merged successfully");
      return mergedData;
    } catch (error) {
      console.error("Failed to fetch from MongoDB:", error);
      return this.getLocalData();
    }
  }

  static performHourlyBackup() {
    const { records, courses, semesters } = this.getLocalData();
    if (records.length === 0 && courses.length === 0 && semesters.length === 0) return;

    const backupName = `backup_${new Date().toISOString()}`;
    const backupData = JSON.stringify({ records, courses, semesters, timestamp: Date.now() });
    localStorage.setItem(backupName, backupData);
    
    console.log(`Auto-backup created: ${backupName}`);
    
    if (navigator.onLine) {
      this.syncWithMongoDB(records, courses, semesters);
    }
  }
}

export default SyncService;
