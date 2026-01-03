
import { AttendanceRecord, Course, Semester } from "../types";
import { API_CONFIG } from "../config";

class MongoService {
  private static get API_BASE_URL() {
    return API_CONFIG.BASE_URL;
  }

  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MongoDB request failed:', error);
      throw error;
    }
  }

  static async syncRecords(records: AttendanceRecord[], userId: string) {
    try {
      const unsyncedRecords = records.filter(r => !r.isSynced);
      
      if (unsyncedRecords.length === 0) {
        return { success: true, synced: 0 };
      }

      const result = await this.makeRequest('/sync/records', {
        method: 'POST',
        body: JSON.stringify({ records: unsyncedRecords, userId })
      });

      console.log(`Synced ${result.synced} attendance records to MongoDB`);
      return result;
    } catch (error) {
      console.error('Failed to sync records:', error);
      return { success: false, synced: 0 };
    }
  }

  static async syncCourses(courses: Course[], userId: string) {
    try {
      const unsyncedCourses = courses.filter(c => !c.isSynced);
      
      if (unsyncedCourses.length === 0) {
        return { success: true, synced: 0 };
      }

      const result = await this.makeRequest('/sync/courses', {
        method: 'POST',
        body: JSON.stringify({ courses: unsyncedCourses, userId })
      });

      console.log(`Synced ${result.synced} courses to MongoDB`);
      return result;
    } catch (error) {
      console.error('Failed to sync courses:', error);
      return { success: false, synced: 0 };
    }
  }

  static async syncSemesters(semesters: Semester[], userId: string) {
    try {
      const unsyncedSemesters = semesters.filter(s => !s.isSynced);
      
      if (unsyncedSemesters.length === 0) {
        return { success: true, synced: 0 };
      }

      const result = await this.makeRequest('/sync/semesters', {
        method: 'POST',
        body: JSON.stringify({ semesters: unsyncedSemesters, userId })
      });

      console.log(`Synced ${result.synced} semesters to MongoDB`);
      return result;
    } catch (error) {
      console.error('Failed to sync semesters:', error);
      return { success: false, synced: 0 };
    }
  }

  static async fetchUserData(userId: string) {
    try {
      const result = await this.makeRequest(`/data?userId=${encodeURIComponent(userId)}`, {
        method: 'GET'
      });

      return {
        records: result.records || [],
        courses: result.courses || [],
        semesters: result.semesters || []
      };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return { records: [], courses: [], semesters: [] };
    }
  }

  static async deleteUserData(userId: string) {
    try {
      await this.makeRequest(`/data?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });

      console.log('Deleted all user data from MongoDB');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return { success: false };
    }
  }

  static async checkHealth() {
    try {
      const result = await this.makeRequest('/health');
      return result.status === 'ok' && result.database === 'connected';
    } catch (error) {
      return false;
    }
  }
}

export default MongoService;
