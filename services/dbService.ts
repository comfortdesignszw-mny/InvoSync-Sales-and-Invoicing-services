
import { AppState } from '../types.ts';
import { INITIAL_STATE } from '../constants.ts';

const DB_PREFIX = 'invosync_db_';

export const dbService = {
  async loadState(userId: string): Promise<AppState> {
    try {
      await new Promise(r => setTimeout(r, 400)); // Network simulation
      const data = localStorage.getItem(`${DB_PREFIX}${userId}`);
      if (data) {
        const parsed = JSON.parse(data);
        // Basic schema verification: ensure all top-level keys exist
        const merged = { ...INITIAL_STATE, ...parsed };
        return merged;
      }
    } catch (error) {
      console.error("Failed to load state from storage:", error);
    }
    // Return default state with a deep copy to avoid mutations
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  },

  async saveState(userId: string, state: AppState): Promise<void> {
    try {
      localStorage.setItem(`${DB_PREFIX}${userId}`, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to storage:", error);
    }
  }
};
