import * as fs from 'fs';
import * as path from 'path';

function main() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql') && f !== '20260617000021_performance_hardening.sql');

  const hardeningPath = path.join(migrationsDir, '20260617000021_performance_hardening.sql');
  const hardeningContent = fs.readFileSync(hardeningPath, 'utf8');

  // Extract all CREATE INDEX idx_xxx
  const indexMatches = hardeningContent.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+/gi);
  const indexNames = Array.from(indexMatches).map(m => m[1]);

  console.log(`Buscando colisiones para ${indexNames.length} índices...`);

  for (const indexName of indexNames) {
    const collisions: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (content.includes(indexName)) {
        collisions.push(file);
      }
    }
    if (collisions.length > 0) {
      console.log(`⚠️ Colisión para el índice "${indexName}": encontrado en ${collisions.join(', ')}`);
    }
  }
}

main();
