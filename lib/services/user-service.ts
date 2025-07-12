import { query, transaction } from '@/lib/database';
import { 
  User, 
  CreateUserParams, 
  UpdateUserParams, 
  DatabaseResult,
  PaginatedResult,
  QueryOptions 
} from '@/lib/database-types';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  
  // ================ USER CRUD OPERATIONS ================
  
  // Create a new user
  static async createUser(params: CreateUserParams): Promise<DatabaseResult<User>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const user = await query<User>(`
        INSERT INTO users (
          id, email, name, avatar_url, provider, provider_id, 
          email_verified, preferred_language, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        id,
        params.email,
        params.name,
        params.avatar_url || null,
        params.provider || 'email',
        params.provider_id || null,
        params.email_verified || false,
        params.preferred_language || 'ru',
        now,
        now
      ]);

      return { success: true, data: user.rows[0] };
    } catch (error) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<DatabaseResult<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<DatabaseResult<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user by provider ID
  static async getUserByProviderId(provider: string, providerId: string): Promise<DatabaseResult<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE provider = $1 AND provider_id = $2 AND is_active = true',
        [provider, providerId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting user by provider ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user
  static async updateUser(userId: string, params: UpdateUserParams): Promise<DatabaseResult<User>> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build dynamic update query
      if (params.name !== undefined) {
        updates.push(`name = $${valueIndex++}`);
        values.push(params.name);
      }
      if (params.avatar_url !== undefined) {
        updates.push(`avatar_url = $${valueIndex++}`);
        values.push(params.avatar_url);
      }
      if (params.email_verified !== undefined) {
        updates.push(`email_verified = $${valueIndex++}`);
        values.push(params.email_verified);
      }
      if (params.last_login_at !== undefined) {
        updates.push(`last_login_at = $${valueIndex++}`);
        values.push(params.last_login_at?.toISOString());
      }
      if (params.is_active !== undefined) {
        updates.push(`is_active = $${valueIndex++}`);
        values.push(params.is_active);
      }
      if (params.preferred_language !== undefined) {
        updates.push(`preferred_language = $${valueIndex++}`);
        values.push(params.preferred_language);
      }

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      // Always update the updated_at field
      updates.push(`updated_at = $${valueIndex++}`);
      values.push(new Date().toISOString());

      // Add user ID as the last parameter
      values.push(userId);

      const result = await query<User>(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex} AND is_active = true
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found or update failed' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Soft delete user (set is_active to false)
  static async deleteUser(userId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2 AND is_active = true',
        [new Date().toISOString(), userId]
      );

      if (result.rowCount === 0) {
        return { success: false, error: 'User not found or already deleted' };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get all users with pagination
  static async getUsers(options: QueryOptions = {}): Promise<DatabaseResult<PaginatedResult<User>>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort_by = 'created_at', 
        sort_order = 'DESC' 
      } = options;

      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      );
      const total = parseInt(countResult.rows[0].count);

      // Get users
      const result = await query<User>(`
        SELECT * FROM users 
        WHERE is_active = true
        ORDER BY ${sort_by} ${sort_order}
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: result.rows,
          page,
          limit,
          total,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user's last login timestamp
  static async updateLastLogin(userId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'UPDATE users SET last_login_at = $1, updated_at = $1 WHERE id = $2 AND is_active = true',
        [new Date().toISOString(), userId]
      );

      return { success: true, data: result.rowCount > 0 };
    } catch (error) {
      console.error('Error updating last login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if user exists by email
  static async userExistsByEmail(email: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      const exists = parseInt(result.rows[0].count) > 0;
      return { success: true, data: exists };
    } catch (error) {
      console.error('Error checking user existence:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<DatabaseResult<{
    queriesThisMonth: number;
    totalQueries: number;
    joinDate: string;
  }>> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Get queries this month
      const monthlyResult = await query(`
        SELECT COUNT(*) as count 
        FROM query_history 
        WHERE user_id = $1 AND created_at >= $2
      `, [userId, `${currentMonth}-01`]);

      // Get total queries
      const totalResult = await query(`
        SELECT COUNT(*) as count 
        FROM query_history 
        WHERE user_id = $1
      `, [userId]);

      // Get user join date
      const userResult = await query<User>(`
        SELECT created_at 
        FROM users 
        WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: {
          queriesThisMonth: parseInt(monthlyResult.rows[0].count),
          totalQueries: parseInt(totalResult.rows[0].count),
          joinDate: userResult.rows[0].created_at
        }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 