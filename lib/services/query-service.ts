import { query, transaction } from '@/lib/database';
import { 
  QueryHistory, 
  CreateQueryParams, 
  UpdateQueryParams, 
  DatabaseResult,
  PaginatedResult,
  QueryOptions 
} from '@/lib/database-types';
import { v4 as uuidv4 } from 'uuid';
export class QueryService {
  static async createQuery(params: CreateQueryParams): Promise<DatabaseResult<QueryHistory>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      const queryRecord = await query<QueryHistory>(`
        INSERT INTO query_history (
          id, user_id, session_id, query_text, response_text, tokens_used,
          model_used, query_type, niche, language, processing_time_ms,
          success, error_message, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        id,
        params.user_id,
        params.session_id || null,
        params.query_text,
        params.response_text || null,
        params.tokens_used || 0,
        params.model_used,
        params.query_type || 'chat',
        params.niche || null,
        params.language || 'ru',
        params.processing_time_ms || null,
        params.success !== undefined ? params.success : true,
        params.error_message || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        now
      ]);
      return { success: true, data: queryRecord.rows[0] };
    } catch (error) {
      console.error('Error creating query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async getQueryById(queryId: string): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(
        'SELECT * FROM query_history WHERE id = $1',
        [queryId]
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
  static async updateQueryResponse(
    queryId: string, 
    responseText: string, 
    tokensUsed?: number, 
    processingTime?: number
  ): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(`
        UPDATE query_history 
        SET response_text = $1, tokens_used = $2, processing_time_ms = $3, success = true
        WHERE id = $4
        RETURNING *
      `, [responseText, tokensUsed || 0, processingTime || null, queryId]);
      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found or update failed' };
      }
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating query response:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async markQueryFailed(queryId: string, errorMessage: string): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(`
        UPDATE query_history 
        SET success = false, error_message = $1
        WHERE id = $2
        RETURNING *
      `, [errorMessage, queryId]);
      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found or update failed' };
      }
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error marking query as failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
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
      const conditions = ['user_id = $1'];
      const params = [userId];
      let paramIndex = 2;
      if (start_date) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(start_date.toISOString());
      }
      if (end_date) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(end_date.toISOString());
      }
      const whereClause = conditions.join(' AND ');
      const countResult = await query(
        `SELECT COUNT(*) as count FROM query_history WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      const result = await query<QueryHistory>(`
        SELECT * FROM query_history 
        WHERE ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, [...params, limit, offset]);
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
      console.error('Error getting user queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async getSessionQueries(sessionId: string): Promise<DatabaseResult<QueryHistory[]>> {
    try {
      const result = await query<QueryHistory>(
        'SELECT * FROM query_history WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error getting session queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async getUserQueryStats(userId: string): Promise<DatabaseResult<{
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    totalTokensUsed: number;
    averageTokensPerQuery: number;
    queriesThisMonth: number;
    mostUsedModel: string;
    averageProcessingTime: number;
  }>> {
    try {
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_queries,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_queries,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_queries,
          COALESCE(SUM(tokens_used), 0) as total_tokens_used,
          COALESCE(AVG(tokens_used), 0) as average_tokens_per_query,
          COALESCE(AVG(processing_time_ms), 0) as average_processing_time
        FROM query_history 
        WHERE user_id = $1
      `, [userId]);
      const currentMonth = new Date().toISOString().slice(0, 7); 
      const monthlyResult = await query(`
        SELECT COUNT(*) as count 
        FROM query_history 
        WHERE user_id = $1 AND created_at >= $2
      `, [userId, `${currentMonth}-01`]);
      const modelResult = await query(`
        SELECT model_used, COUNT(*) as count
        FROM query_history 
        WHERE user_id = $1
        GROUP BY model_used
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);
      const stats = statsResult.rows[0];
      const mostUsedModel = modelResult.rows[0]?.model_used || 'N/A';
      return {
        success: true,
        data: {
          totalQueries: parseInt(stats.total_queries),
          successfulQueries: parseInt(stats.successful_queries),
          failedQueries: parseInt(stats.failed_queries),
          totalTokensUsed: parseInt(stats.total_tokens_used),
          averageTokensPerQuery: Math.round(parseFloat(stats.average_tokens_per_query)),
          queriesThisMonth: parseInt(monthlyResult.rows[0].count),
          mostUsedModel,
          averageProcessingTime: Math.round(parseFloat(stats.average_processing_time))
        }
      };
    } catch (error) {
      console.error('Error getting user query stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async deleteQuery(queryId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        'DELETE FROM query_history WHERE id = $1',
        [queryId]
      );
      return { success: true, data: !!result.rowCount };
    } catch (error) {
      console.error('Error deleting query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async deleteUserQueries(userId: string): Promise<DatabaseResult<number>> {
    try {
      const result = await query(
        'DELETE FROM query_history WHERE user_id = $1',
        [userId]
      );
      return { success: true, data: typeof result.rowCount === 'number' ? result.rowCount : 0 };
    } catch (error) {
      console.error('Error deleting user queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async getRecentQueries(limit: number = 50): Promise<DatabaseResult<QueryHistory[]>> {
    try {
      const result = await query<QueryHistory>(`
        SELECT qh.*, u.name as user_name, u.email as user_email
        FROM query_history qh
        LEFT JOIN users u ON qh.user_id = u.id
        ORDER BY qh.created_at DESC
        LIMIT $1
      `, [limit]);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error getting recent queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async getPopularNiches(limit: number = 10): Promise<DatabaseResult<Array<{
    niche: string;
    count: number;
  }>>> {
    try {
      const result = await query(`
        SELECT niche, COUNT(*) as count
        FROM query_history 
        WHERE niche IS NOT NULL
        GROUP BY niche
        ORDER BY count DESC
        LIMIT $1
      `, [limit]);
      return { 
        success: true, 
        data: result.rows.map(row => ({
          niche: row.niche,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      console.error('Error getting popular niches:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  static async updateQueryMetadata(
    queryId: string, 
    metadata: Record<string, any>
  ): Promise<DatabaseResult<QueryHistory>> {
    try {
      const result = await query<QueryHistory>(`
        UPDATE query_history 
        SET metadata = $1
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(metadata), queryId]);
      if (result.rows.length === 0) {
        return { success: false, error: 'Query not found or update failed' };
      }
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating query metadata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
