/**
 * Seed script: перенести ACTUAL_WORKS и EDITORIAL_PROJECTS из public-content.ts в БД
 * Запуск: npx tsx scripts/seed-projects.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { projects } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const ACTUAL_WORKS = [
  {
    title: "Историко-культурные процессы и материальная культура населения Якутии и сопредельных территорий от каменного века до Нового времени (по данным археологии)",
    lead: "Научный руководитель: к.и.н. В.М. Дьяконов",
    duration: "Сроки реализации: 2025-2028 годы",
  },
  {
    title: "Адаптация механизмов управления устойчивым развитием северных и арктических территорий в условиях изменения климата",
    lead: "Научный руководитель: г.н.с., д.э.н. Гаврильева Т.Н.",
    duration: "Сроки реализации: 2025-2028 годы",
  },
  {
    title: "Углеродный баланс Республики Саха (Якутия)",
    lead: "Научный руководитель: г.н.с., д.э.н. Гаврильева Т.Н.",
    consultant: "Научный консультант: д.б.н. Максимов Т.Х.",
    duration: "Сроки реализации: 2025-2026 годы",
  },
  {
    title: "Концепция низкоуглеродного развития Республики Саха (Якутия)",
    lead: "Научный руководитель: к.э.н. Красильникова Н.А.",
    duration: "Срок реализации: 2025 год",
  },
  {
    title: "Разработка и научное обоснование мероприятий по организации круглогодичной эксплуатации автомобильной дороги «Яна» в Арктике в рамках реализации проекта «Восточный меридиан»: технологии и эффективность",
    lead: "Научный руководитель: д.т.н. Филиппова Надежда Анатольевна",
    partnerOrg: "Индустриальный партнер: КП Дороги Арктики",
    duration: "Сроки реализации: 2026-2028 годы",
  },
];

const EDITORIAL_PROJECTS = [
  {
    title: "Символический капитал древности: археологическое наследие Севера",
    duration: "Срок реализации: 2025 год",
    lead: "Руководитель: руководитель Музея Соловьева Е.Н.",
    partners: ["Арктический государственный университет искусств, культуры и креативных индустрий"],
  },
  {
    title: "Сохранение, использование и популяризация объектов культурного наследия, расположенных на территории Алданского района Республики Саха (Якутия)",
    duration: "Срок реализации: 2026-2030 годы",
    lead: "Руководитель: Соловьева Елена Николаевна",
    partners: ["Администрация муниципального района Алданский район Республики Саха (Якутия)"],
  },
  {
    title: "Комплексная биолого-археологическая экспедиция на архипелаг «Медвежьи острова» и прилегающие территории р. Колыма",
    duration: "Срок реализации: 2025-2027 годы",
    lead: "Руководитель: д.и.н. Дьяконов В.М.",
    partners: [
      "ФГБУ Национальный парк «Ленские столбы»",
      "Якутское региональное отделение Русского географического общества",
      "Лапидарий",
    ],
  },
  {
    title: "Универсам-2",
    duration: "Срок реализации: уточняется",
    partners: [],
  },
  {
    title: "400-летие Якутска: цифровой код города",
    duration: "Срок реализации: 2025-2032 годы",
    partners: [],
  },
  {
    title: "Стратегическое развитие Оймяконского района Республики Саха (Якутия) с учетом мероприятий по минимизации ущербов от негативного воздействия чрезвычайных ситуаций природного характера",
    duration: "Срок реализации: 2026-2027 годы",
    lead: "Руководитель: д.э.н. Гаврильева Т.Н.",
    partners: ["Администрация муниципального района Оймяконский район Республики Саха (Якутия)"],
  },
  {
    title: "Межрегиональный проектный офис НОЦ «Север»",
    duration: "Срок реализации: 2025-2030 годы",
    lead: "Руководитель: Колганов Е.С., директор АНО Центр управления проектами НОЦ Север",
    partners: ["АО «Корпорация развития Якутии»"],
  },
  {
    title: "Офис 10-летия науки и технологий в Республике Саха (Якутия)",
    duration: "Срок реализации: 2025-2031 годы",
    lead: "Руководитель: Хохолов А.А.",
    partners: ["Министерство образования Республики Саха (Якутия)"],
  },
  {
    title: "Офис научно-технологического развития Республики Саха (Якутия)",
    duration: "Срок реализации: 2025-2026 годы",
    lead: "Руководитель: Сосин В.В.",
    partners: ["Министерство образования Республики Саха (Якутия)"],
  },
  {
    title: "Реестр НИОКР РС(Я)",
    duration: "Срок реализации: 2025-2031 годы",
    lead: "Руководитель: Хохолов А.А.",
    partners: ["Министерство образования Республики Саха (Якутия)"],
  },
  {
    title: "Съезд молодых ученых",
    duration: "Срок реализации: 2026 год",
    lead: "Руководитель: Хохолов А.А.",
    partners: ["Министерство образования Республики Саха (Якутия)"],
  },
];

// Simple transliteration for slug generation
const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120); // cap slug length
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding ACTUAL_WORKS...");
  for (const work of ACTUAL_WORKS) {
    const slug = generateSlug(work.title);
    const existing = await db.select().from(projects).where(eq(projects.slug, slug));
    if (existing.length > 0) {
      console.log(`  SKIP (exists): ${slug}`);
      continue;
    }
    await db.insert(projects).values({
      title: work.title,
      slug,
      type: "actual_work",
      lead: work.lead ?? null,
      consultant: (work as { consultant?: string }).consultant ?? null,
      partnerOrg: (work as { partnerOrg?: string }).partnerOrg ?? null,
      partnersList: [],
      duration: work.duration,
      status: "active",
    });
    console.log(`  OK: ${slug}`);
  }

  console.log("Seeding EDITORIAL_PROJECTS...");
  for (const proj of EDITORIAL_PROJECTS) {
    const slug = generateSlug(proj.title);
    const existing = await db.select().from(projects).where(eq(projects.slug, slug));
    if (existing.length > 0) {
      console.log(`  SKIP (exists): ${slug}`);
      continue;
    }
    await db.insert(projects).values({
      title: proj.title,
      slug,
      type: "editorial_project",
      lead: proj.lead ?? null,
      partnersList: proj.partners ?? [],
      duration: proj.duration,
      status: "active",
    });
    console.log(`  OK: ${slug}`);
  }

  console.log("Done!");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
