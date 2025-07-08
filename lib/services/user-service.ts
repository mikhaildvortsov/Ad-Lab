import { query, transaction } from '@/lib/database';
import { 
  User, 
  CreateUserParams, 
  UpdateUserParams, 
  DatabaseResult,
  PaginatedResult,
  QueryOptions,
  AUTH_PROVIDERS
} from '@/lib/database-types';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  
  // Create a new user
  static async createUser(params: CreateUserParams): Promise<DatabaseResult<User>> {
    try {
      const id = uuidv4();
      const {
        email,
        name,
        avatar_url,
        provider = AUTH_PROVIDERS.EMAIL,
        provider_id,
        email_verified = false,
        preferred_language = 'ru'
      } = params;

      const result = await query<User>(
        `INSERT INTO users (
          id, email, name, avatar_url, provider, provider_id, 
          email_verified, preferred_language
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [id, email, name, avatar_url, provider, provider_id, email_verified, preferred_language]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Failed to create user' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<DatabaseResult<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [id]
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
        [email.toLowerCase()]
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

  // Get user by provider ID (for OAuth)
  static async getUserByProvider(provider: string, providerId: string): Promise<DatabaseResult<User>> {
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
      console.error('Error getting user by provider:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user
  static async updateUser(id: string, params: UpdateUserParams): Promise<DatabaseResult<User>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      // Add updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await query<User>(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found or no changes made' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user's last login
  static async updateLastLogin(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return { 
        success: true, 
        data: true,
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error updating last login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Soft delete user (deactivate)
  static async deactivateUser(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return { 
        success: true, 
        data: true,
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error deactivating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Reactivate user
  static async activateUser(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return { 
        success: true, 
        data: true,
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error activating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get users with pagination and filtering
  static async getUsers(options: QueryOptions = {}): Promise<DatabaseResult<PaginatedResult<User>>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC',
        start_date,
        end_date
      } = options;

      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['is_active = true'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Add date filtering
      if (start_date) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(start_date);
        paramIndex++;
      }
      
      if (end_date) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(end_date);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        queryParams
      );
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      queryParams.push(limit, offset);
      const dataResult = await query<User>(
        `SELECT * FROM users ${whereClause} 
         ORDER BY ${sort_by} ${sort_order} 
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
      );

      return {
        success: true,
        data: {
          data: dataResult.rows,
          total,
          page,
          limit,
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

  // Create or update user (for OAuth login)
  static async upsertUser(params: CreateUserParams): Promise<DatabaseResult<User>> {
    try {
      return await transaction(async (client) => {
        // First, try to find existing user
        let existingUser: User | null = null;
        
        if (params.provider_id && params.provider) {
          const providerResult = await client.query<User>(
            'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
            [params.provider, params.provider_id]
          );
          if (providerResult.rows.length > 0) {
            existingUser = providerResult.rows[0];
          }
        }
        
        if (!existingUser) {
          const emailResult = await client.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [params.email.toLowerCase()]
          );
          if (emailResult.rows.length > 0) {
            existingUser = emailResult.rows[0];
          }
        }

        if (existingUser) {
          // Update existing user
          const updateResult = await client.query<User>(
            `UPDATE users SET 
              name = $1, 
              avatar_url = $2, 
              provider = $3, 
              provider_id = $4,
              email_verified = $5,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 
            RETURNING *`,
            [
              params.name,
              params.avatar_url,
              params.provider,
              params.provider_id,
              params.email_verified || true,
              existingUser.id
            ]
          );
          
          return { success: true, data: updateResult.rows[0] };
        } else {
          // Create new user
          const id = uuidv4();
          const createResult = await client.query<User>(
            `INSERT INTO users (
              id, email, name, avatar_url, provider, provider_id, 
              email_verified, preferred_language, last_login_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
              id,
              params.email.toLowerCase(),
              params.name,
              params.avatar_url,
              params.provider || AUTH_PROVIDERS.EMAIL,
              params.provider_id,
              params.email_verified || true,
              params.preferred_language || 'ru'
            ]
          );
          
          return { success: true, data: createResult.rows[0] };
        }
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<DatabaseResult<{
    total_users: number;
    active_users: number;
    new_users_today: number;
    new_users_this_month: number;
  }>> {
    try {
      const result = await query<{
        total_users: string;
        active_users: string;
        new_users_today: string;
        new_users_this_month: string;
      }>(
        `SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as new_users_this_month
        FROM users`
      );

      const stats = result.rows[0];
      
      return {
        success: true,
        data: {
          total_users: parseInt(stats.total_users),
          active_users: parseInt(stats.active_users),
          new_users_today: parseInt(stats.new_users_today),
          new_users_this_month: parseInt(stats.new_users_this_month)
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