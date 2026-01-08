
import { AppState } from '../types.ts';
import { INITIAL_STATE } from '../constants.ts';

const DB_PREFIX = 'invosync_cloud_db_';

/**
 * simulatedCloudDb functions as a mock for a cross-browser database.
 * In a real-world scenario, this would be an API call to Firebase or a REST API.
 */
export const dbService = {
  /**
   * Loads the state for a specific user.
   * This simulates fetching from a global persistent store.
   */
  async loadState(userId: string): Promise<AppState> {
    // Simulate cloud network latency
    await new Promise(r => setTimeout(r, 600));
    
    try {
      const data = localStorage.getItem(`${DB_PREFIX}${userId}`);
      if (data) {
        const parsed = JSON.parse(data);
        // Deep merge with INITIAL_STATE to ensure schema safety
        return {
          ...INITIAL_STATE,
          ...parsed,
          profile: { ...INITIAL_STATE.profile, ...parsed.profile },
          products: parsed.products || [],
          clients: parsed.clients || [],
          invoices: parsed.invoices || [],
          quotes: parsed.quotes || [],
          cart: parsed.cart || []
        };
      }
    } catch (error) {
      console.error("Cloud Retrieval Error:", error);
    }
    
    // Return fresh state if no data found
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  },

  /**
   * Persists the state to the "Cloud".
   */
  async saveState(userId: string, state: AppState): Promise<void> {
    // In a real app, this is where you'd handle conflict resolution (last-write-wins)
    try {
      localStorage.setItem(`${DB_PREFIX}${userId}`, JSON.stringify(state));
    } catch (error) {
      throw new Error("Cloud Persistence Failed");
    }
  }
};
