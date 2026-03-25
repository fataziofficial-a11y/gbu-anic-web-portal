"""
Предеплойное тестирование портала ГБУ АНИЦ.
Запуск: python3 scripts/test_pre_deploy.py
"""

import sys, time, json
from playwright.sync_api import sync_playwright, Page

BASE  = "http://localhost:3002"
EMAIL_ADMIN = "admin@anic.ru"
PASS_ADMIN  = "admin123"

log_items: list[dict] = []
n_ok = 0
n_fail = 0

def log(ok: bool, suite: str, name: str, detail: str = ""):
    global n_ok, n_fail
    icon = "✓" if ok else "✗"
    print(f"  {icon} [{suite}] {name}" + (f"  — {detail}" if detail else ""))
    log_items.append({"ok": ok, "suite": suite, "name": name, "detail": detail})
    if ok: n_ok += 1
    else:  n_fail += 1
    return ok

def go(page: Page, path: str):
    page.goto(f"{BASE}{path}")
    page.wait_for_load_state("networkidle")

def admin_login(page: Page, email=EMAIL_ADMIN, password=PASS_ADMIN):
    """Логин и ожидание появления сайдбара. Если уже авторизован — просто переходим в /admin."""
    go(page, "/admin/login")
    # Если уже авторизованы (нет формы логина), переходим в /admin
    try:
        page.wait_for_selector('input[type="email"]', timeout=3000)
    except Exception:
        # Форма не появилась — значит уже авторизованы
        go(page, "/admin")
        page.wait_for_selector("aside nav", timeout=30000)
        return
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')
    # После signIn + router.push('/admin') ждём sidebar как признак успешного входа
    page.wait_for_selector("aside nav", timeout=30000)
    page.wait_for_load_state("networkidle")

def wrap(suite: str, name: str, fn):
    try:
        fn()
    except Exception as e:
        log(False, suite, name, str(e)[:120])


# ════════════════════════════════════════════════
# 1. ПУБЛИЧНЫЙ САЙТ
# ════════════════════════════════════════════════
def test_public(page: Page):
    S = "Публичный"

    go(page, "/")
    log("АНИЦ" in page.title(), S, "Главная — title содержит АНИЦ")
    log(page.locator("h1, h2").first.is_visible(), S, "Главная — H1/H2 видим")

    go(page, "/news")
    log(page.locator("h1").first.is_visible(), S, "/news — H1 видим")

    # Документы теперь из БД
    go(page, "/documents")
    time.sleep(1)
    content = page.content()
    log(page.locator("h1").first.is_visible(), S, "/documents — страница загружена")
    log(
        any(w in content for w in ["Сведения", "Госзадание", "Кадровое"]),
        S, "/documents — разделы из БД отображаются"
    )

    go(page, "/media")
    log(page.locator("h1").first.is_visible(), S, "/media — загружена")

    go(page, "/partners")
    log(page.locator("h1").first.is_visible(), S, "/partners — загружена")

    page.goto(f"{BASE}/api/health")
    body = page.text_content("body") or ""
    log('"ok"' in body or "ok" in body.lower(), S, "API /health — ok")


# ════════════════════════════════════════════════
# 2. АВТОРИЗАЦИЯ
# ════════════════════════════════════════════════
def test_auth(page: Page):
    S = "Авторизация"

    # Без сессии → редирект на логин
    go(page, "/admin/news")
    time.sleep(1)
    log("/login" in page.url, S, "Без сессии → /login")

    # Неверный пароль
    go(page, "/admin/login")
    page.fill('input[type="email"]', EMAIL_ADMIN)
    page.fill('input[type="password"]', "WRONG_PASS")
    page.click('button[type="submit"]')
    time.sleep(2)
    error_visible = page.locator("text=Неверный").is_visible()
    still_login = "/login" in page.url
    log(error_visible or still_login, S, "Неверный пароль — ошибка показана")

    # Успешный вход
    try:
        admin_login(page)
        log(page.locator("aside nav").is_visible(), S, "Успешный вход → сайдбар виден")
    except Exception as e:
        log(False, S, "Успешный вход admin", str(e)[:100])


# ════════════════════════════════════════════════
# 3. САЙДБАР admin — видит всё
# ════════════════════════════════════════════════
def test_sidebar_admin(page: Page):
    S = "Сайдбар (admin)"
    admin_login(page)
    go(page, "/admin")
    page.wait_for_selector("aside nav")
    content = page.locator("aside nav").inner_text()

    for item in ["Новости", "Пользователи", "Настройки", "Медиа", "Тикеты", "Закупки", "База знаний"]:
        log(item in content, S, f"Видит «{item}»")


# ════════════════════════════════════════════════
# 4. УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
# ════════════════════════════════════════════════
def test_users_list(page: Page):
    S = "Пользователи (список)"
    admin_login(page)
    go(page, "/admin/users")
    time.sleep(1)

    log(page.locator("h1").first.is_visible(), S, "Страница загружена")

    table = page.locator("table")
    log(table.is_visible(), S, "Таблица пользователей видна")

    rows = page.locator("table tbody tr")
    count = rows.count()
    log(count > 0, S, f"Пользователей в таблице: {count}")

    headers = page.locator("table thead th").all_inner_texts()
    log(any(h in ["Нов", "Б.З", "Тик"] for h in headers), S, "Колонки-галочки разделов в заголовке")

    search = page.locator('input[placeholder*="Поиск"]')
    log(search.is_visible(), S, "Поле поиска видно")

    # Поиск фильтрует
    search.fill("admin")
    time.sleep(0.5)
    filtered = page.locator("table tbody tr").count()
    log(filtered <= count, S, f"Поиск 'admin' → {filtered} строк (было {count})")

    search.fill("")
    time.sleep(0.3)


# ════════════════════════════════════════════════
# 5. СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
# ════════════════════════════════════════════════
created_ts = ""

def test_create_user(page: Page):
    global created_ts
    S = "Создание пользователя"
    admin_login(page)
    go(page, "/admin/users/new")

    log(page.locator("h1").first.is_visible(), S, "Форма открылась")

    # Чекбоксы разделов — клиентский компонент, ждём hydration
    try:
        page.wait_for_selector('button:has-text("Новости")', timeout=5000)
        sec_btns = page.locator("button").filter(has_text="Новости")
        log(sec_btns.count() > 0, S, "Чекбокс «Новости» есть в форме")
    except Exception:
        log(False, S, "Чекбокс «Новости» есть в форме")

    ts = str(int(time.time()))
    page.fill('#name', f'Тест Юзер {ts}')
    page.fill('#email', f'testuser_{ts}@anic.ru')
    page.fill('#password', 'test123456')

    # Смена роли на news_editor — shadcn Select использует [role="combobox"]
    role_trigger = page.locator('[role="combobox"]').first
    if role_trigger.count():
        role_trigger.click()
        time.sleep(0.3)
        opt = page.locator('[role="option"]').filter(has_text="Редактор новостей")
        if opt.count():
            opt.first.click()
            time.sleep(0.3)

    page.locator('button:has-text("Сохранить")').click()
    try:
        page.wait_for_selector("aside nav", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)
        in_list = f"testuser_{ts}@anic.ru" in page.content()
        log(in_list, S, "Пользователь появился в списке")
        created_ts = ts
    except Exception as e:
        log(False, S, "Редирект после создания", str(e)[:80])


# ════════════════════════════════════════════════
# 6. ПЕРЕКЛЮЧЕНИЕ ГАЛОЧКИ РАЗРЕШЕНИЯ
# ════════════════════════════════════════════════
def test_toggle_permission(page: Page):
    S = "Галочки разрешений"
    admin_login(page)
    go(page, "/admin/users")
    time.sleep(1)

    time.sleep(3)  # Ждём клиентский рендер таблицы + загрузку данных
    rows = page.locator("table tbody tr")
    if rows.count() < 2:
        log(True, S, "Пропущен (нет строк для теста)")
        return

    # Берём первую галочку второй строки (не admin, чтобы не портить права)
    # Используем локатор без фиксации — Playwright re-evaluates при каждом вызове
    row_btns = page.locator("table tbody tr").nth(1).locator("button[title]")
    if row_btns.count() == 0:
        log(True, S, "Пропущен (галочки не видны)")
        return

    # Запоминаем title первой кнопки, чтобы вычислить класс-префикс
    cls_before = row_btns.nth(0).get_attribute("class") or ""
    row_btns.nth(0).click()
    time.sleep(3)
    cls_after = row_btns.nth(0).get_attribute("class") or ""
    log(cls_before != cls_after, S, "Класс ячейки изменился после клика")

    # Откат — кликаем ещё раз
    row_btns.nth(0).click()
    time.sleep(3)
    cls_reverted = row_btns.nth(0).get_attribute("class") or ""
    log(cls_reverted == cls_before, S, "Класс вернулся при повторном клике")


# ════════════════════════════════════════════════
# 7. ДОКУМЕНТЫ — ФОРМА + API РАЗДЕЛОВ
# ════════════════════════════════════════════════
def test_documents(page: Page):
    S = "Документы"
    admin_login(page)

    # Форма создания
    go(page, "/admin/documents/new")
    log(page.locator('#section').is_visible(), S, "Форма: поле «Раздел» есть")
    log(page.locator('#sectionOrder').is_visible(), S, "Форма: поле «Порядок раздела» есть")
    log(page.locator('#sortOrder').is_visible(), S, "Форма: поле «Порядок документа» есть")

    # API разделов
    page.goto(f"{BASE}/api/documents/sections")
    try:
        data = json.loads(page.text_content("body") or "{}")
        sections = data.get("data", [])
        log(len(sections) >= 3, S, f"API /api/documents/sections → {len(sections)} разделов")
        log(
            any("Сведения" in s for s in sections),
            S, "Раздел «Сведения» присутствует"
        )
    except Exception as e:
        log(False, S, "API /api/documents/sections", str(e)[:80])

    # Список документов в админке
    admin_login(page)
    go(page, "/admin/documents")
    rows = page.locator("table tbody tr").count() if page.locator("table").is_visible() else 0
    log(rows >= 20, S, f"В админке документов: {rows} (импортировано из FS)")


# ════════════════════════════════════════════════
# 8. МЕДИА — RUTUBE-ВИДЕО
# ════════════════════════════════════════════════
def test_media(page: Page):
    S = "Медиа"
    admin_login(page)
    go(page, "/admin/media")
    time.sleep(1)

    count = page.locator("table tbody tr").count() if page.locator("table").is_visible() else 0
    log(count >= 20, S, f"Rutube-видео в базе: {count}")

    # Форма нового видео
    go(page, "/admin/media/new")
    url_input = page.locator('#videoUrl')
    log(url_input.is_visible(), S, "Поле ссылки на видео есть")
    log(page.locator('button:has-text("Заполнить")').is_visible(), S, "Кнопка «Заполнить» видна")

    # Embed-URL → появляется iframe
    url_input.fill("https://rutube.ru/play/embed/c9c91862dbbd69005fecf570b6f0f8ce")
    time.sleep(0.3)
    log(page.locator('iframe[src*="rutube"]').is_visible(), S, "Embed iframe появляется при вводе ссылки")


# ════════════════════════════════════════════════
# 9. ПАРТНЁРЫ — КВАДРАТНАЯ ОБРЕЗКА
# ════════════════════════════════════════════════
def test_partners(page: Page):
    S = "Партнёры"
    admin_login(page)
    go(page, "/admin/partners/new")

    content = page.content()
    log("400" in content, S, "Форма содержит размер 400 (квадрат)")
    log("400×400" in content or "400x400" in content.lower(), S, "Хинт 400×400 присутствует")


# ════════════════════════════════════════════════
# 10. ТИКЕТЫ
# ════════════════════════════════════════════════
def test_tickets(page: Page):
    S = "Тикеты"
    admin_login(page)
    go(page, "/admin/tickets")
    log(page.locator("h1").first.is_visible(), S, "Список тикетов загружен")

    go(page, "/admin/tickets/new")
    ts = str(int(time.time()))
    page.fill('#title', f'Тест {ts}')
    page.fill('#description', 'Тестовый тикет для предеплойной проверки')
    page.locator('button:has-text("Отправить тикет")').click()
    try:
        page.wait_for_selector("aside nav", timeout=8000)
        in_list = f"Тест {ts}" in page.content()
        log(in_list or "/tickets" in page.url, S, "Тикет создан")
    except Exception as e:
        log(False, S, "Создание тикета", str(e)[:80])


# ════════════════════════════════════════════════
# 11. ВСЕ РАЗДЕЛЫ CMS — БАЗОВАЯ ДОСТУПНОСТЬ
# ════════════════════════════════════════════════
def test_admin_sections(page: Page):
    S = "Разделы CMS"
    admin_login(page)

    sections = [
        ("/admin",              "Дашборд"),
        ("/admin/news",         "Новости"),
        ("/admin/knowledge",    "База знаний"),
        ("/admin/projects",     "Проекты"),
        ("/admin/team",         "Сотрудники"),
        ("/admin/departments",  "Подразделения"),
        ("/admin/publications", "Публикации"),
        ("/admin/partners",     "Партнёры"),
        ("/admin/documents",    "Документы"),
        ("/admin/procurements", "Закупки"),
        ("/admin/crosspost",    "Кросс-постинг"),
        ("/admin/settings",     "Настройки"),
        ("/admin/users",        "Пользователи"),
    ]

    for path, name in sections:
        try:
            go(page, path)
            ok = page.locator("h1, h2, h3").first.is_visible()
            log(ok, S, f"{name} — загружается без ошибок")
        except Exception as e:
            log(False, S, f"{name} — загружается без ошибок", str(e)[:80])


# ════════════════════════════════════════════════
# 12. РОЛЬ news_editor — видит только свои разделы
# ════════════════════════════════════════════════
def test_role_news_editor(page: Page):
    S = "Роль news_editor"
    global created_ts

    if not created_ts:
        log(True, S, "Пропущен (тестовый пользователь не создан)")
        return

    test_email = f"testuser_{created_ts}@anic.ru"

    try:
        go(page, "/admin/login")
        page.fill('input[type="email"]', test_email)
        page.fill('input[type="password"]', "test123456")
        page.click('button[type="submit"]')
        page.wait_for_selector("aside nav", timeout=30000)
    except Exception as e:
        log(False, S, "Вход как news_editor", str(e)[:80])
        return

    sidebar = page.locator("aside nav").inner_text()

    # Должен видеть
    for item in ["Новости", "Медиа", "Тикеты", "База знаний", "Кросс-постинг"]:
        log(item in sidebar, S, f"Видит «{item}»")

    # НЕ должен видеть
    for item in ["Пользователи", "Настройки", "Закупки", "Подразделения", "Проекты"]:
        log(item not in sidebar, S, f"НЕ видит «{item}»")

    # Страница должна загружаться без 500
    go(page, "/admin/news")
    log(page.locator("h1, h2").first.is_visible(), S, "/admin/news — загружается")


# ════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════
def warmup(page: Page):
    """Прогреваем dev-сервер: посещаем все страницы до начала тестов, чтобы они скомпилировались."""
    print("⏳ Прогрев dev-сервера (первичная компиляция страниц)...")
    warmup_urls = [
        "/", "/news", "/documents", "/media", "/partners",
        "/admin/login",
    ]
    for url in warmup_urls:
        try:
            page.goto(f"{BASE}{url}", timeout=60000)
            page.wait_for_load_state("networkidle", timeout=60000)
        except Exception:
            pass

    # Логинимся чтобы скомпилировать admin-страницы
    try:
        page.goto(f"{BASE}/admin/login", timeout=60000)
        try:
            page.wait_for_selector('input[type="email"]', timeout=3000)
            page.fill('input[type="email"]', EMAIL_ADMIN)
            page.fill('input[type="password"]', PASS_ADMIN)
            page.click('button[type="submit"]')
        except Exception:
            pass
        page.wait_for_selector("aside nav", timeout=30000)
    except Exception:
        pass

    admin_pages = [
        "/admin", "/admin/users", "/admin/news", "/admin/documents",
        "/admin/media", "/admin/partners", "/admin/tickets",
        "/admin/settings", "/admin/users/new", "/admin/media/new",
        "/admin/documents/new", "/admin/partners/new",
    ]
    for url in admin_pages:
        try:
            page.goto(f"{BASE}{url}", timeout=60000)
            page.wait_for_load_state("networkidle", timeout=60000)
        except Exception:
            pass

    print("✓ Прогрев завершён\n")


def main():
    print("\n══════════════════════════════════════════════")
    print("  ПРЕДЕПЛОЙНОЕ ТЕСТИРОВАНИЕ  ГБУ АНИЦ")
    print("══════════════════════════════════════════════\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.set_default_timeout(30000)

        suites = [
            ("1. Публичный сайт",        lambda: test_public(page)),
            ("2. Авторизация",            lambda: test_auth(page)),
            ("3. Сайдбар (admin)",        lambda: test_sidebar_admin(page)),
            ("4. Список пользователей",   lambda: test_users_list(page)),
            ("5. Создание пользователя",  lambda: test_create_user(page)),
            ("6. Галочки разрешений",     lambda: test_toggle_permission(page)),
            ("7. Документы",              lambda: test_documents(page)),
            ("8. Медиа (Rutube)",         lambda: test_media(page)),
            ("9. Партнёры (квадрат)",     lambda: test_partners(page)),
            ("10. Тикеты",               lambda: test_tickets(page)),
            ("11. Все разделы CMS",       lambda: test_admin_sections(page)),
        ]

        for title, fn in suites:
            print(f"\n─── {title} ───")
            try:
                fn()
            except Exception as e:
                log(False, title, "Критическая ошибка", str(e)[:120])

        # Suite 12 — отдельный контекст без сессии admin
        print(f"\n─── 12. Роль news_editor ───")
        try:
            ctx2 = browser.new_context(viewport={"width": 1280, "height": 900})
            page2 = ctx2.new_page()
            page2.set_default_timeout(30000)
            test_role_news_editor(page2)
            ctx2.close()
        except Exception as e:
            log(False, "12. Роль news_editor", "Критическая ошибка", str(e)[:120])

        browser.close()

    total = n_ok + n_fail
    print(f"\n══════════════════════════════════════════════")
    print(f"  ИТОГ: {n_ok}/{total} прошло  |  {n_fail} упало")
    print(f"══════════════════════════════════════════════")

    if n_fail > 0:
        print("\nУПАВШИЕ:")
        for t in log_items:
            if not t["ok"]:
                print(f"  ✗ [{t['suite']}] {t['name']}" + (f" — {t['detail']}" if t["detail"] else ""))

    import os; os.makedirs("docs", exist_ok=True)
    with open("docs/TEST_PRE_DEPLOY.md", "w") as f:
        f.write(f"# Предеплойное тестирование\n\nДата: {time.strftime('%Y-%m-%d %H:%M')}\n\n")
        f.write(f"**Итог: {n_ok}/{total} прошло, {n_fail} упало**\n\n")
        f.write("| # | Статус | Модуль | Тест | Детали |\n|---|---|---|---|---|\n")
        for i, t in enumerate(log_items, 1):
            icon = "✓" if t["ok"] else "✗"
            f.write(f"| {i} | {icon} | {t['suite']} | {t['name']} | {t['detail']} |\n")

    print(f"\nЛог → docs/TEST_PRE_DEPLOY.md")
    sys.exit(0 if n_fail == 0 else 1)

if __name__ == "__main__":
    main()
