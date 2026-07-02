import { Pool } from 'pg';

/**
 * PostgresStorageService
 * 
 * Drop-in replacement for LocalStorageService.
 * Each DynamoDB "table" maps to one Postgres table:
 *   CREATE TABLE "<tableName>" (id TEXT PRIMARY KEY, data JSONB NOT NULL)
 * 
 * All items are stored as JSONB so no schema changes are needed in the rest
 * of the codebase — the app keeps working exactly as before.
 */
export class PostgresStorageService {
  private _pool: Pool | null = null;
  private initializedTables = new Set<string>();

  private get pool(): Pool {
    if (this._pool) return this._pool;

    // Lazy init — dotenv must be loaded before first DB call
    const rawUrl = process.env.DATABASE_URL || '';
    if (!rawUrl) throw new Error('DATABASE_URL is not set in environment');

    const match = rawUrl.match(
      /^postgresql?:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/
    );

    let poolConfig: any;
    if (match) {
      const [, user, password, hostPort, database] = match;
      const [host, portStr] = hostPort.split(':');
      poolConfig = {
        host,
        port: portStr ? parseInt(portStr) : 5432,
        user: decodeURIComponent(user),
        password: decodeURIComponent(password),
        database,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };
      console.log(`🐘 Postgres → ${host}/${database}`);
    } else {
      poolConfig = { connectionString: rawUrl, ssl: { rejectUnauthorized: false } };
      console.log('🐘 Postgres → connectionString fallback');
    }

    this._pool = new Pool(poolConfig);
    this._pool.on('error', (err) => {
      console.error('❌ Postgres pool error:', err.message);
    });
    return this._pool;
  }

  /** Create the table if it doesn't exist yet (runs once per table per process) */
  private async ensureTable(tableName: string): Promise<void> {
    if (this.initializedTables.has(tableName)) return;

    const safeName = this.safeTableName(tableName);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${safeName} (
        id   TEXT PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);
    this.initializedTables.add(tableName);
  }

  /** Sanitize table name — only allow alphanumerics, hyphens, underscores */
  private safeTableName(name: string): string {
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Postgres identifiers must be quoted if they contain hyphens
    return `"${safe}"`;
  }

  // ─── put (upsert) ────────────────────────────────────────────────────────────

  async put(tableName: string, item: any) {
    await this.ensureTable(tableName);
    const safeName = this.safeTableName(tableName);
    const id = item.id;
    if (!id) throw new Error(`put() called with item missing 'id': ${JSON.stringify(item)}`);

    await this.pool.query(
      `INSERT INTO ${safeName} (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2`,
      [id, JSON.stringify(item)]
    );
    return { success: true };
  }

  // ─── get (by key object e.g. { id: '...' } or { id, userId }) ────────────────

  async get(tableName: string, key: any): Promise<any | undefined> {
    await this.ensureTable(tableName);
    const safeName = this.safeTableName(tableName);

    // Primary lookup — always use the id field first
    if (key.id) {
      const { rows } = await this.pool.query(
        `SELECT data FROM ${safeName} WHERE id = $1`,
        [key.id]
      );
      if (rows.length === 0) return undefined;
      const item = rows[0].data;
      // Verify any extra key fields (e.g. userId)
      const extraKeys = Object.keys(key).filter(k => k !== 'id');
      for (const k of extraKeys) {
        if (item[k] !== key[k]) return undefined;
      }
      return item;
    }

    // Fallback: full scan + filter (rare path)
    const all = await this.scan(tableName);
    return all.find((item: any) =>
      Object.keys(key).every(k => item[k] === key[k])
    );
  }

  // ─── scan (full table + optional filter) ─────────────────────────────────────

  async scan(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: any,
    expressionAttributeNames?: any
  ): Promise<any[]> {
    await this.ensureTable(tableName);
    const safeName = this.safeTableName(tableName);
    const { rows } = await this.pool.query(`SELECT data FROM ${safeName}`);
    const all: any[] = rows.map(r => r.data);

    if (!filterExpression) return all;

    // Simple filter parser — mirrors what LocalStorageService handled
    const ev = expressionAttributeValues || {};
    const en = expressionAttributeNames || {};

    // Resolve #alias → real field name
    const resolveField = (expr: string): string => {
      const trimmed = expr.trim();
      return en[trimmed] || trimmed.replace(/^#/, '');
    };

    return all.filter(item => this.applyFilter(item, filterExpression, ev, en));
  }

  private applyFilter(
    item: any,
    expr: string,
    ev: Record<string, any>,
    en: Record<string, string>
  ): boolean {
    // Resolve attribute name aliases
    const resolveField = (f: string) => en[f.trim()] || f.trim().replace(/^#/, '');

    // Split on AND (basic support)
    const parts = expr.split(/\bAND\b/i);
    for (const part of parts) {
      const trimmed = part.trim();

      // field = :value
      const eqMatch = trimmed.match(/^([#\w]+)\s*=\s*(:[\w]+)$/);
      if (eqMatch) {
        const field = resolveField(eqMatch[1]);
        const value = ev[eqMatch[2]];
        if (item[field] !== value) return false;
        continue;
      }

      // field <> :value  (not equal)
      const neqMatch = trimmed.match(/^([#\w]+)\s*<>\s*(:[\w]+)$/);
      if (neqMatch) {
        const field = resolveField(neqMatch[1]);
        const value = ev[neqMatch[2]];
        if (item[field] === value) return false;
        continue;
      }

      // contains(field, :value)
      const containsMatch = trimmed.match(/^contains\(([#\w]+),\s*(:[\w]+)\)$/i);
      if (containsMatch) {
        const field = resolveField(containsMatch[1]);
        const value = ev[containsMatch[2]];
        const fieldVal = item[field];
        if (typeof fieldVal === 'string' && !fieldVal.includes(value)) return false;
        if (Array.isArray(fieldVal) && !fieldVal.includes(value)) return false;
        continue;
      }
    }
    return true;
  }

  // ─── query (treated same as scan with filter) ────────────────────────────────

  async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any
  ): Promise<any[]> {
    return this.scan(tableName, keyConditionExpression, expressionAttributeValues);
  }

  // ─── update ──────────────────────────────────────────────────────────────────

  async update(
    tableName: string,
    key: any,
    updateExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any
  ): Promise<any> {
    const existing = await this.get(tableName, key);
    if (!existing) throw new Error(`Item not found in ${tableName}: ${JSON.stringify(key)}`);

    const item = { ...existing };
    const en = expressionAttributeNames || {};

    // Parse "SET field1 = :v1, field2 = :v2"
    const setMatch = updateExpression.match(/SET\s+(.+)/i);
    if (setMatch) {
      const assignments = setMatch[1].split(',');
      for (const assignment of assignments) {
        const eqIdx = assignment.indexOf('=');
        if (eqIdx === -1) continue;
        let fieldPart = assignment.substring(0, eqIdx).trim();
        const valuePart = assignment.substring(eqIdx + 1).trim();

        // Resolve alias
        if (en[fieldPart]) fieldPart = en[fieldPart];
        else fieldPart = fieldPart.replace(/^#/, '');

        const value = expressionAttributeValues[valuePart];
        if (value !== undefined) item[fieldPart] = value;
      }
    }

    item.updatedAt = new Date().toISOString();
    await this.put(tableName, item);
    return item;
  }

  // ─── delete ──────────────────────────────────────────────────────────────────

  async delete(tableName: string, key: any): Promise<{ success: boolean }> {
    await this.ensureTable(tableName);
    const safeName = this.safeTableName(tableName);

    if (key.id) {
      await this.pool.query(`DELETE FROM ${safeName} WHERE id = $1`, [key.id]);
      return { success: true };
    }

    // Fallback: scan + delete matching rows
    const all = await this.scan(tableName);
    const toDelete = all.filter((item: any) =>
      Object.keys(key).every(k => item[k] === key[k])
    );
    for (const item of toDelete) {
      await this.pool.query(`DELETE FROM ${safeName} WHERE id = $1`, [item.id]);
    }
    return { success: true };
  }

  // ─── health check ────────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this._pool) await this._pool.end();
  }
}

export const postgresService = new PostgresStorageService();
