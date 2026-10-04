/**
 * Полная переиндексация поиска (все разделы сайта).
 *
 * Запуск: pnpm tsx scripts/meili-reindex.ts
 * Та же логика, что и у /api/cron/reindex — src/lib/search/reindex.ts.
 */
import "dotenv/config";
import { reindexAll } from "../src/lib/search/reindex";

reindexAll()
  .then((r) => {
    console.log(`✅  В индексе ${r.total} материалов, удалено устаревших: ${r.removed}`);
    console.log(r.byType);
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ ", e);
    process.exit(1);
  });
