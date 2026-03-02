import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

function tiptapDoc(...paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...\n");

  // === Пользователи ===
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "admin@anic.ru",
      name: "Администратор",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    })
    .returning();

  const [editor] = await db
    .insert(schema.users)
    .values({
      email: "editor@anic.ru",
      name: "Петрова Мария",
      passwordHash: await bcrypt.hash("editor123", 10),
      role: "editor",
    })
    .returning();

  console.log("✅ Пользователи созданы");

  // === Подразделения ===
  const [dept1] = await db
    .insert(schema.departments)
    .values({
      name: "Лаборатория климатических изменений",
      slug: "laboratory-climate-changes",
      description: "Изучение долгосрочных климатических изменений в арктическом регионе",
      sortOrder: 1,
    })
    .returning();

  const [dept2] = await db
    .insert(schema.departments)
    .values({
      name: "Отдел экологических исследований",
      slug: "ecology-research",
      description: "Мониторинг и исследование экосистем Арктики",
      sortOrder: 2,
    })
    .returning();

  const [dept3] = await db
    .insert(schema.departments)
    .values({
      name: "Лаборатория биоразнообразия",
      slug: "biodiversity-laboratory",
      description: "Изучение флоры и фауны арктического региона",
      sortOrder: 3,
    })
    .returning();

  console.log("✅ Подразделения созданы");

  // === Сотрудники ===
  const [member1] = await db
    .insert(schema.teamMembers)
    .values({
      name: "Иванов Иван Иванович",
      position: "Директор",
      departmentId: dept1.id,
      bio: "Доктор географических наук, профессор. Специализируется на изучении климатических изменений в Арктике. Автор более 120 научных работ.",
      email: "ivanov@anic.ru",
      sortOrder: 1,
    })
    .returning();

  await db.insert(schema.teamMembers).values({
    name: "Петрова Мария Алексеевна",
    position: "Заместитель директора по науке",
    departmentId: dept1.id,
    bio: "Кандидат биологических наук. Руководит направлением экологических исследований. Специалист по наземным экосистемам Арктики.",
    email: "petrova@anic.ru",
    sortOrder: 2,
  });

  await db.insert(schema.teamMembers).values({
    name: "Сидоров Алексей Павлович",
    position: "Старший научный сотрудник",
    departmentId: dept2.id,
    bio: "Специалист в области мониторинга водных экосистем Арктики. Кандидат биологических наук.",
    email: "sidorov@anic.ru",
    sortOrder: 3,
  });

  await db.insert(schema.teamMembers).values({
    name: "Михайлова Екатерина Сергеевна",
    position: "Научный сотрудник",
    departmentId: dept3.id,
    bio: "Специалист по систематике высших растений арктической зоны Якутии.",
    email: "mikhailova@anic.ru",
    sortOrder: 4,
  });

  // Обновим руководителя первого подразделения
  await db
    .update(schema.departments)
    .set({ headId: member1.id })
    .where(eq(schema.departments.id, dept1.id));

  console.log("✅ Сотрудники созданы");

  // === Проекты ===
  await db.insert(schema.projects).values([
    {
      title: "Мониторинг вечной мерзлоты Якутии 2024–2026",
      slug: "monitoring-permafrost-yakutia-2024-2026",
      description:
        "Комплексное изучение динамики вечной мерзлоты в условиях глобального потепления на территории Республики Саха. Включает полевые наблюдения, бурение скважин и дистанционное зондирование.",
      departmentId: dept1.id,
      status: "active",
      startDate: "2024-01-01",
      endDate: "2026-12-31",
    },
    {
      title: "Оценка биоразнообразия озёрных систем Якутии",
      slug: "biodiversity-lake-systems-yakutia",
      description:
        "Исследование биоразнообразия и экологического состояния термокарстовых озёр Центральной и Северной Якутии.",
      departmentId: dept2.id,
      status: "active",
      startDate: "2025-03-01",
    },
    {
      title: "Атлас флоры Арктической Якутии",
      slug: "atlas-flora-arctic-yakutia",
      description:
        "Создание комплексного научного атласа высших растений арктической зоны Якутии с использованием ГИС-технологий.",
      departmentId: dept3.id,
      status: "planned",
      startDate: "2026-06-01",
    },
    {
      title: "Изменение климата и экосистемы тундры",
      slug: "climate-change-tundra-ecosystems",
      description:
        "Оценка влияния изменения климата на структуру и функции тундровых экосистем. Многолетние наблюдения на постоянных площадках.",
      departmentId: dept1.id,
      status: "completed",
      startDate: "2020-01-01",
      endDate: "2024-12-31",
    },
  ]);

  console.log("✅ Проекты созданы");

  // === Публикации ===
  await db.insert(schema.publications).values([
    {
      title: "Динамика деградации вечной мерзлоты в Центральной Якутии за период 2010–2024",
      authors: "Иванов И.И., Петрова М.А., Смирнов В.К.",
      abstract:
        "В статье рассматриваются результаты многолетних наблюдений за состоянием вечной мерзлоты в Центральной Якутии. Показано ускорение процессов деградации в последнем десятилетии.",
      year: 2025,
      journal: "Arctic and Antarctic Research",
      doi: "10.1234/aar.2025.001",
      departmentId: dept1.id,
    },
    {
      title: "Видовой состав зоопланктона термокарстовых озёр Якутии",
      authors: "Сидоров А.П., Фёдоров Н.В.",
      abstract:
        "Проведено исследование зоопланктонных сообществ 47 озёр различных районов Якутии. Выявлено 89 видов зоопланктона, из которых 12 ранее не отмечались в регионе.",
      year: 2024,
      journal: "Сибирский экологический журнал",
      departmentId: dept2.id,
    },
    {
      title: "Новые виды сосудистых растений для флоры Арктической Якутии",
      authors: "Михайлова Е.С.",
      abstract:
        "Приводятся данные о 23 видах сосудистых растений, впервые обнаруженных в арктической зоне Якутии в ходе экспедиций 2022–2024 годов.",
      year: 2024,
      journal: "Ботанический журнал",
      departmentId: dept3.id,
    },
  ]);

  console.log("✅ Публикации созданы");

  // === Новости ===
  await db.insert(schema.news).values([
    {
      title: "АНИЦ принял участие в международной конференции по изучению Арктики",
      slug: "anic-international-conference-arctic-2026",
      content: tiptapDoc(
        "Учёные Арктического научно-исследовательского центра приняли участие в международной конференции по исследованию Арктики, прошедшей в Тромсё (Норвегия) в феврале 2026 года.",
        "На конференции были представлены результаты многолетних исследований вечной мерзлоты, биоразнообразия и климатических изменений в регионе. Доклады вызвали большой интерес среди международного научного сообщества.",
        "По итогам конференции подписаны соглашения о сотрудничестве с норвежскими и американскими научными институтами. Планируется проведение совместных экспедиций в 2026–2027 годах."
      ),
      excerpt:
        "Учёные АНИЦ представили результаты исследований на международной конференции в Тромсё и подписали соглашения о сотрудничестве.",
      category: "Наука",
      tags: ["конференция", "международное сотрудничество", "вечная мерзлота"],
      authorId: admin.id,
      status: "published",
      publishedAt: new Date("2026-02-20"),
      seoTitle: "АНИЦ на международной арктической конференции в Тромсё",
      seoDescription:
        "Учёные АНИЦ приняли участие в международной конференции по изучению Арктики в Норвегии и подписали соглашения о сотрудничестве.",
    },
    {
      title: "Открытие новой лаборатории биогеохимии",
      slug: "opening-biogeochemistry-laboratory",
      content: tiptapDoc(
        "В марте 2026 года в АНИЦ состоялось торжественное открытие новой лаборатории биогеохимии. Лаборатория оснащена современным аналитическим оборудованием общей стоимостью 15 млн рублей.",
        "Новое оборудование позволит проводить анализ химического состава почв, воды и растительного материала на высочайшем уровне точности. Это открывает новые возможности для изучения биогеохимических циклов в арктических экосистемах.",
        "Открытие лаборатории стало возможным благодаря финансированию в рамках национального проекта «Наука и университеты»."
      ),
      excerpt:
        "Новая лаборатория биогеохимии оснащена аналитическим оборудованием стоимостью 15 млн рублей.",
      category: "Инфраструктура",
      tags: ["лаборатория", "оборудование", "биогеохимия"],
      authorId: editor.id,
      status: "published",
      publishedAt: new Date("2026-03-01"),
    },
    {
      title: "АНИЦ выиграл грант РНФ на исследование климатических изменений",
      slug: "rnf-grant-climate-research-2026",
      content: tiptapDoc(
        "АНИЦ стал победителем конкурса Российского научного фонда на проведение исследований климатических изменений в Якутии. Проект рассчитан на 2026–2028 годы.",
        "Объём финансирования составит 12 млн рублей ежегодно. Средства будут направлены на проведение полевых экспедиций, лабораторных исследований и публикации в ведущих международных научных журналах.",
        "Руководитель проекта — директор АНИЦ, доктор географических наук Иванов И.И."
      ),
      excerpt:
        "АНИЦ получил грант РНФ объёмом 12 млн руб./год на исследования климатических изменений в Якутии.",
      category: "Финансирование",
      tags: ["грант", "РНФ", "климат"],
      authorId: admin.id,
      status: "draft",
    },
    {
      title: "Экспедиция в Оймяконский район: предварительные результаты",
      slug: "expedition-oymyakon-preliminary-results",
      content: tiptapDoc(
        "Завершена летняя экспедиция в Оймяконский район Якутии. Учёные работали в полевых условиях в течение 3 недель, собрав обширный материал по состоянию мерзлоты и биоразнообразию.",
        "В ходе экспедиции было отобрано более 500 образцов почв и льда, установлено 12 новых термодатчиков для долгосрочного мониторинга."
      ),
      excerpt: "Завершена летняя экспедиция в Оймяконский район. Собрано 500+ образцов.",
      category: "Экспедиции",
      tags: ["экспедиция", "Оймякон", "полевые исследования"],
      authorId: editor.id,
      status: "published",
      publishedAt: new Date("2026-01-15"),
    },
  ]);

  console.log("✅ Новости созданы");

  // === Страницы ===
  const [aboutPage] = await db
    .insert(schema.pages)
    .values({
      title: "О центре",
      slug: "about",
      content: tiptapDoc(
        "ГБУ «Арктический научно-исследовательский центр Республики Саха (Якутия)» (АНИЦ) — ведущее научное учреждение, занимающееся комплексным изучением природной среды арктического региона.",
        "Центр основан в 2015 году и объединяет ведущих учёных республики в области географии, биологии, экологии, геохимии и климатологии. В составе центра работают 4 лаборатории и 2 исследовательских отдела.",
        "Основные направления деятельности: мониторинг вечной мерзлоты, изучение биоразнообразия, климатические исследования, экологический мониторинг арктических экосистем."
      ),
      template: "about",
      status: "published",
      authorId: admin.id,
      sortOrder: 1,
      seoTitle: "О центре — ГБУ АНИЦ",
      seoDescription:
        "Арктический научно-исследовательский центр Республики Саха (Якутия) — ведущее научное учреждение по изучению арктического региона.",
    })
    .returning();

  await db.insert(schema.pages).values({
    title: "История центра",
    slug: "about-history",
    content: tiptapDoc(
      "История Арктического научно-исследовательского центра начинается в 2015 году, когда Правительство Республики Саха (Якутия) приняло решение о создании специализированного научного учреждения.",
      "Первые экспедиции были проведены уже в 2015 году. К 2018 году центр насчитывал уже более 40 научных сотрудников и располагал современной лабораторной базой.",
      "Сегодня АНИЦ — признанный международный научный центр с публикациями в ведущих мировых журналах и партнёрами в 15 странах."
    ),
    parentId: aboutPage.id,
    status: "published",
    authorId: admin.id,
    sortOrder: 1,
  });

  await db.insert(schema.pages).values({
    title: "Структура центра",
    slug: "about-structure",
    content: tiptapDoc(
      "В состав АНИЦ входят следующие подразделения: Лаборатория климатических изменений, Отдел экологических исследований, Лаборатория биоразнообразия, Отдел геоинформационных систем.",
      "Административный аппарат включает: дирекцию, учёный совет, отдел международного сотрудничества, бухгалтерию и хозяйственный отдел."
    ),
    parentId: aboutPage.id,
    status: "published",
    authorId: admin.id,
    sortOrder: 2,
  });

  await db.insert(schema.pages).values({
    title: "Контакты",
    slug: "contacts",
    content: tiptapDoc(
      "Адрес: 677000, Республика Саха (Якутия), г. Якутск, ул. Арктическая, д. 1",
      "Телефон приёмной: +7 (4112) 000-001",
      "Email: info@anic.ru",
      "Режим работы: Пн–Пт, 9:00–18:00 (обед 13:00–14:00)"
    ),
    template: "contacts",
    status: "published",
    authorId: admin.id,
    sortOrder: 10,
    seoTitle: "Контакты — ГБУ АНИЦ",
  });

  console.log("✅ Страницы созданы");

  // === Категории базы знаний ===
  const [kbCat1] = await db
    .insert(schema.kbCategories)
    .values({
      name: "Климат и атмосфера",
      slug: "climate-atmosphere",
      description: "Материалы о климатических процессах и атмосферных явлениях",
      sortOrder: 1,
    })
    .returning();

  const [kbCat2] = await db
    .insert(schema.kbCategories)
    .values({
      name: "Вечная мерзлота",
      slug: "permafrost",
      description: "Исследования, методики и данные о вечной мерзлоте",
      sortOrder: 2,
    })
    .returning();

  const [kbCat3] = await db
    .insert(schema.kbCategories)
    .values({
      name: "Биоразнообразие",
      slug: "biodiversity",
      description: "Флора и фауна арктического и субарктического поясов",
      sortOrder: 3,
    })
    .returning();

  console.log("✅ Категории базы знаний созданы");

  // === Элементы базы знаний ===
  await db.insert(schema.knowledgeItems).values([
    {
      title: "Методы измерения температуры вечной мерзлоты",
      slug: "methods-permafrost-temperature-measurement",
      content: tiptapDoc(
        "Для измерения температуры вечной мерзлоты применяются несколько основных методов: геотермическое зондирование, термисторные датчики, дистанционное зондирование Земли.",
        "Наиболее точными считаются прямые измерения с помощью термисторных датчиков, установленных в скважинах глубиной от 15 до 100 метров. Данные передаются в режиме реального времени через спутниковые системы связи.",
        "Дистанционное зондирование позволяет охватить большие площади, однако даёт менее точные результаты по сравнению с прямыми измерениями."
      ),
      categoryId: kbCat2.id,
      tags: ["методология", "измерения", "вечная мерзлота", "датчики"],
      departmentId: dept1.id,
      authorId: admin.id,
      status: "published",
      publishedAt: new Date("2026-01-15"),
      metadata: { source_type: "manual", language: "ru", word_count: 280 },
    },
    {
      title: "Термокарстовые озёра: образование и динамика",
      slug: "thermokarst-lakes-formation-dynamics",
      content: tiptapDoc(
        "Термокарстовые озёра образуются в результате таяния льдосодержащих пород вечной мерзлоты. Они являются одним из наиболее характерных элементов ландшафта арктической зоны Якутии.",
        "Динамика термокарстовых озёр в условиях потепления климата характеризуется сложными разнонаправленными процессами: часть озёр расширяется, другие — осушаются в результате дренажа.",
        "Согласно данным дистанционного зондирования, за период 1970–2020 годов площадь термокарстовых озёр в Центральной Якутии изменилась на 8–12%."
      ),
      categoryId: kbCat2.id,
      tags: ["термокарст", "озёра", "ландшафт", "деградация мерзлоты"],
      departmentId: dept2.id,
      authorId: editor.id,
      status: "published",
      publishedAt: new Date("2026-02-10"),
      metadata: { source_type: "manual", language: "ru", word_count: 320 },
    },
    {
      title: "Климатические зоны Республики Саха (Якутия)",
      slug: "climate-zones-sakha-republic",
      content: tiptapDoc(
        "Республика Саха (Якутия) характеризуется резко континентальным климатом с одними из наибольших в мире амплитудами годовых температур воздуха.",
        "На территории республики выделяют три основных климатических зоны: арктическая (к северу от 70° с.ш.), субарктическая и умеренно-континентальная (центральная и южная части).",
        "Среднегодовая температура воздуха варьирует от −14°C на юге до −16°C в центральных районах и до −13°C на арктическом побережье."
      ),
      categoryId: kbCat1.id,
      tags: ["климат", "зоны", "температура", "Якутия"],
      departmentId: dept1.id,
      authorId: admin.id,
      status: "published",
      publishedAt: new Date("2026-01-20"),
      metadata: { source_type: "manual", language: "ru", word_count: 250 },
    },
    {
      title: "Краснокнижные виды растений Арктической Якутии",
      slug: "red-book-plants-arctic-yakutia",
      content: tiptapDoc(
        "На территории арктической зоны Якутии произрастает более 20 видов сосудистых растений, занесённых в Красную книгу Республики Саха (Якутия).",
        "К числу наиболее редких и охраняемых видов относятся: башмачок настоящий (Cypripedium calceolus), кастиллея арктическая (Castilleja arctica), остролодочник Гюльденштедта.",
        "Охрана редких видов осуществляется в рамках системы особо охраняемых природных территорий и ботанических памятников природы."
      ),
      categoryId: kbCat3.id,
      tags: ["красная книга", "редкие виды", "растения", "охрана"],
      departmentId: dept3.id,
      authorId: editor.id,
      status: "draft",
      metadata: { source_type: "manual", language: "ru", word_count: 210 },
    },
  ]);

  console.log("✅ База знаний заполнена");

  // === Настройки ===
  await db.insert(schema.settings).values([
    { key: "site_name", value: "ГБУ АНИЦ" },
    {
      key: "site_full_name",
      value: "Арктический научно-исследовательский центр Республики Саха (Якутия)",
    },
    { key: "site_email", value: "info@anic.ru" },
    { key: "site_phone", value: "+7 (4112) 000-001" },
    { key: "site_address", value: "677000, г. Якутск, ул. Арктическая, д. 1" },
    { key: "crosspost_telegram_enabled", value: "false" },
    { key: "crosspost_vk_enabled", value: "false" },
    { key: "crosspost_dzen_enabled", value: "false" },
    { key: "news_per_page", value: "10" },
    { key: "knowledge_per_page", value: "12" },
  ]);

  console.log("✅ Настройки сохранены");

  console.log("\n🎉 База данных успешно заполнена!");
  console.log("\n📋 Данные для входа в CMS:");
  console.log("   Администратор: admin@anic.ru  /  admin123");
  console.log("   Редактор:      editor@anic.ru  /  editor123");
  console.log("\n🌐 CMS: http://localhost:3000/admin");

  await client.end();
}

main().catch((err) => {
  console.error("❌ Ошибка при заполнении БД:", err);
  process.exit(1);
});
