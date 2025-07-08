import { query, transaction } from '@/lib/database';
import { 
  QueryHistory, 
  CreateQueryHistoryParams, 
  DatabaseResult,
  PaginatedResult,
  QueryOptions,
  QueryType
} from '@/lib/database-types';
import { v4 as uuidv4 } from 'uuid';

export class QueryService {
  
  // Create a new query record
  static async createQuery(params: CreateQueryHistoryParams): Promise<DatabaseResult<QueryHistory>> {
    try {
      const id = uuidv4();
      const {
        user_id,
        session_id,
        query_text,
        response_text,
        tokens_used = 0,
        model_used = 'gpt-4o',
        query_type = 'chat',
        niche,
        language = 'ru',
        processing_time_ms,
        success = true,
        error_message,
        metadata
      } = params;

      const result = await query<QueryHistory>(
        `INSERT INTO query_history (
          id, user_id, session_id, query_text, response_text, tokens_used,
          model_used, query_type, niche, language, processing_time_ms,
          success, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          id, user_id, session_id, query_text, response_text, tokens_used,
          model_used, query_type, niche, language, processing_time_ms,
          success, error_message, metadata ? JSON.stringify(metadata) : null
        ]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Failed to create query record' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error creating query record:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get query by ID
  static async getQueryById(id: string): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(
        `SELECT qh.*, u.name as user_name, u.email as user_email
         FROM query_history qh
         LEFT JOIN users u ON qh.user_id = u.id
         WHERE qh.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting query by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's query history with pagination
  static async getUserQueries(
    userId: string, 
    options: QueryOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<QueryHistory>>> {
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
      const whereConditions: string[] = ['qh.user_id = $1'];
      const queryParams: any[] = [userId];
      let paramIndex = 2;

      // Add date filtering
      if (start_date) {
        whereConditions.push(`qh.created_at >= $${paramIndex}`);
        queryParams.push(start_date);
        paramIndex++;
      }
      
      if (end_date) {
        whereConditions.push(`qh.created_at <= $${paramIndex}`);
        queryParams.push(end_date);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM query_history qh ${whereClause}`,
        queryParams
      );
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      queryParams.push(limit, offset);
      const dataResult = await query<QueryHistory>(
        `SELECT qh.*, u.name as user_name, u.email as user_email
         FROM query_history qh
         LEFT JOIN users u ON qh.user_id = u.id
         ${whereClause}
         ORDER BY qh.${sort_by} ${sort_order} 
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
      console.error('Error getting user queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get queries by session ID
  static async getSessionQueries(sessionId: string): Promise<DatabaseResult<QueryHistory[]>> {
    try {
      const result = await query<QueryHistory>(
        `SELECT qh.*, u.name as user_name, u.email as user_email
         FROM query_history qh
         LEFT JOIN users u ON qh.user_id = u.id
         WHERE qh.session_id = $1
         ORDER BY qh.created_at ASC`,
        [sessionId]
      );

      return { 
        success: true, 
        data: result.rows 
      };
    } catch (error) {
      console.error('Error getting session queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's usage statistics for a period
  static async getUserUsageStats(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<DatabaseResult<{
    total_queries: number;
    total_tokens: number;
    successful_queries: number;
    failed_queries: number;
    avg_processing_time: number;
    query_types: Record<string, number>;
  }>> {
    try {
      const result = await query<{
        total_queries: string;
        total_tokens: string;
        successful_queries: string;
        failed_queries: string;
        avg_processing_time: string;
      }>(
        `SELECT 
          COUNT(*) as total_queries,
          COALESCE(SUM(tokens_used), 0) as total_tokens,
          COUNT(*) FILTER (WHERE success = true) as successful_queries,
          COUNT(*) FILTER (WHERE success = false) as failed_queries,
          COALESCE(AVG(processing_time_ms), 0) as avg_processing_time
        FROM query_history 
        WHERE user_id = $1 AND created_at BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );

      // Get query types breakdown
      const queryTypesResult = await query<{
        query_type: string;
        count: string;
      }>(
        `SELECT query_type, COUNT(*) as count
         FROM query_history 
         WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY query_type`,
        [userId, startDate, endDate]
      );

      const stats = result.rows[0];
      const queryTypes: Record<string, number> = {};
      
      queryTypesResult.rows.forEach(row => {
        queryTypes[row.query_type] = parseInt(row.count);
      });

      return {
        success: true,
        data: {
          total_queries: parseInt(stats.total_queries),
          total_tokens: parseInt(stats.total_tokens),
          successful_queries: parseInt(stats.successful_queries),
          failed_queries: parseInt(stats.failed_queries),
          avg_processing_time: parseFloat(stats.avg_processing_time),
          query_types: queryTypes
        }
      };
    } catch (error) {
      console.error('Error getting user usage stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get global query statistics
  static async getGlobalStats(): Promise<DatabaseResult<{
    total_queries: number;
    total_tokens: number;
    active_users_today: number;
    queries_today: number;
    popular_niches: Array<{ niche: string; count: number }>;
    model_usage: Record<string, number>;
  }>> {
    try {
      // Basic stats
      const basicStatsResult = await query<{
        total_queries: string;
        total_tokens: string;
        queries_today: string;
        active_users_today: string;
      }>(
        `SELECT 
          COUNT(*) as total_queries,
          COALESCE(SUM(tokens_used), 0) as total_tokens,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as queries_today,
          COUNT(DISTINCT user_id) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as active_users_today
        FROM query_history`
      );

      // Popular niches (last 30 days)
      const nichesResult = await query<{
        niche: string;
        count: string;
      }>(
        `SELECT niche, COUNT(*) as count
         FROM query_history 
         WHERE niche IS NOT NULL 
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY niche
         ORDER BY count DESC
         LIMIT 10`
      );

      // Model usage
      const modelResult = await query<{
        model_used: string;
        count: string;
      }>(
        `SELECT model_used, COUNT(*) as count
         FROM query_history 
         GROUP BY model_used
         ORDER BY count DESC`
      );

      const basicStats = basicStatsResult.rows[0];
      const popularNiches = nichesResult.rows.map(row => ({
        niche: row.niche,
        count: parseInt(row.count)
      }));

      const modelUsage: Record<string, number> = {};
      modelResult.rows.forEach(row => {
        modelUsage[row.model_used] = parseInt(row.count);
      });

      return {
        success: true,
        data: {
          total_queries: parseInt(basicStats.total_queries),
          total_tokens: parseInt(basicStats.total_tokens),
          active_users_today: parseInt(basicStats.active_users_today),
          queries_today: parseInt(basicStats.queries_today),
          popular_niches: popularNiches,
          model_usage: modelUsage
        }
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete user's query history (GDPR compliance)
  static async deleteUserQueries(userId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'DELETE FROM query_history WHERE user_id = $1',
        [userId]
      );

      return { 
        success: true, 
        data: true,
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error deleting user queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update query with response (for streaming responses)
  static async updateQueryResponse(
    queryId: string, 
    responseText: string, 
    tokensUsed: number,
    processingTimeMs?: number
  ): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(
        `UPDATE query_history 
         SET response_text = $1, tokens_used = $2, processing_time_ms = $3, success = true
         WHERE id = $4 
         RETURNING *`,
        [responseText, tokensUsed, processingTimeMs, queryId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error updating query response:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Mark query as failed
  static async markQueryFailed(
    queryId: string, 
    errorMessage: string
  ): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(
        `UPDATE query_history 
         SET success = false, error_message = $1
         WHERE id = $2 
         RETURNING *`,
        [errorMessage, queryId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error marking query as failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get recent queries for analytics
  static async getRecentQueries(
    limit: number = 50
  ): Promise<DatabaseResult<QueryHistory[]>> {
    try {
      const result = await query<QueryHistory>(
        `SELECT qh.*, u.name as user_name, u.email as user_email
         FROM query_history qh
         LEFT JOIN users u ON qh.user_id = u.id
         ORDER BY qh.created_at DESC
         LIMIT $1`,
        [limit]
      );

      return { 
        success: true, 
        data: result.rows 
      };
    } catch (error) {
      console.error('Error getting recent queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 