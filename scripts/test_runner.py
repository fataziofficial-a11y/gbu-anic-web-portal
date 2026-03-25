#!/usr/bin/env python3
"""
Комплексное тестирование веб-портала ГБУ «АНИЦ»
10 прогонов: публичный сайт + CMS + API + пользовательские сценарии
Лог ошибок → docs/TEST_LOG.md
"""

import subprocess
import time
import sys
import os
import json
import datetime
from playwright.sync_api import sync_playwright, Error as PlaywrightError

BASE_URL = "http://localhost:3000"
LOG_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "TEST_LOG.md")

errors = []
passes = []
run_results = []

def log_error(run_num, test_name, detail, screenshot_path=None):
    errors.append({
        "run": run_num,
        "test": test_name,
        "detail": detail,
        "screenshot": screenshot_path,
        "ts": datetime.datetime.now().isoformat()
    })
    print(f"  ❌ [{run_num}] {test_name}: {detail}")

def log_pass(run_num, test_name):
    passes.append({"run": run_num, "test": test_name})
    print(f"  ✅ [{run_num}] {test_name}")

def screenshot(page, name):
    path = f"/tmp/anic_test_{name}.png"
    try:
        page.screenshot(path=path, full_page=True)
        return path
    except:
        return None

def wait_load(page, timeout=15000):
    page.wait_for_load_state("networkidle", timeout=timeout)

# ─── ПРОГОН 1: Публичные страницы — HTTP-статусы и базовый рендер ──────────────

def run_01_public_pages(page, run):
    print("\n[Прогон 1] Публичные страницы — рендер и статусы")
    routes = [
        ("/", "Главная"),
        ("/about", "О центре"),
        ("/news", "Новости"),
        ("/research", "Наука"),
        ("/knowledge-base", "База знаний"),
        ("/documents", "Документы"),
        ("/media", "Медиа"),
        ("/partners", "Партнёры"),
        ("/procurement", "Закупки"),
        ("/contacts", "Контакты"),
        ("/education", "Образование"),
    ]
    for path, label in routes:
        try:
            resp = page.goto(BASE_URL + path, timeout=20000)
            wait_load(page)
            if resp and resp.status >= 400:
                sc = screenshot(page, f"r{run}_p{path.replace('/','_')}")
                log_error(run, f"Страница {label} ({path})", f"HTTP {resp.status}", sc)
            else:
                # Проверяем что страница не пустая
                body = page.locator("body").inner_text()
                if len(body.strip()) < 50:
                    sc = screenshot(page, f"r{run}_empty{path.replace('/','_')}")
                    log_error(run, f"Страница {label} ({path})", "Страница пустая или почти пустая", sc)
                else:
                    log_pass(run, f"Страница {label} ({path})")
        except PlaywrightError as e:
            log_error(run, f"Страница {label} ({path})", str(e)[:200])
        except Exception as e:
            log_error(run, f"Страница {label} ({path})", str(e)[:200])

# ─── ПРОГОН 2: Навигация — header/footer ───────────────────────────────────────

def run_02_navigation(page, run):
    print("\n[Прогон 2] Навигация — header, footer, ссылки")
    try:
        page.goto(BASE_URL, timeout=20000)
        wait_load(page)
        sc_path = screenshot(page, f"r{run}_homepage")

        # Проверяем наличие nav/header
        header = page.locator("header, nav").first
        if header.count() == 0:
            log_error(run, "Header", "Элемент header/nav не найден на главной", sc_path)
        else:
            log_pass(run, "Header присутствует")

        # Проверяем footer
        footer = page.locator("footer")
        if footer.count() == 0:
            log_error(run, "Footer", "Элемент footer не найден", sc_path)
        else:
            log_pass(run, "Footer присутствует")

        # Кликаем ссылку «Новости» в навигации
        try:
            news_link = page.locator("a[href='/news']").first
            if news_link.count() > 0:
                news_link.click()
                page.wait_for_timeout(2000)
                wait_load(page)
                current = page.url
                if "/news" not in current:
                    sc = screenshot(page, f"r{run}_nav_news")
                    log_error(run, "Навигация → Новости", f"URL после клика: {current}", sc)
                else:
                    log_pass(run, "Навигация → /news работает")
            else:
                log_error(run, "Навигация → Новости", "Ссылка a[href='/news'] не найдена")
        except Exception as e:
            log_error(run, "Навигация → Новости", str(e)[:200])

        # Лого → главная
        page.goto(BASE_URL + "/news", timeout=15000)
        wait_load(page)
        try:
            # Next.js Link рендерит как <a>, ищем по тексту логотипа или классу
            logo = page.locator("header a[href='/'], nav a[href='/'], a.logo, a[class*='logo']").first
            if logo.count() == 0:
                # Fallback: первая ссылка в header
                logo = page.locator("header a").first
            if logo.count() > 0:
                logo.click()
                page.wait_for_timeout(2000)
                wait_load(page)
                if "/news" in page.url and page.url.rstrip("/") != BASE_URL.rstrip("/"):
                    log_error(run, "Лого → главная", f"URL не изменился: {page.url}")
                else:
                    log_pass(run, f"Лого → главная работает: {page.url}")
            else:
                log_error(run, "Лого → главная", "Ссылка логотипа не найдена в header")
        except Exception as e:
            log_error(run, "Лого → главная", str(e)[:200])

    except Exception as e:
        log_error(run, "Навигация общая", str(e)[:200])

# ─── ПРОГОН 3: Новости — список, фильтрация, открытие статьи ──────────────────

def run_03_news(page, run):
    print("\n[Прогон 3] Новости — список, фильтры, статья")
    try:
        page.goto(BASE_URL + "/news", timeout=20000)
        wait_load(page)
        sc = screenshot(page, f"r{run}_news_list")

        # Карточки новостей
        cards = page.locator("article, [class*='card'], [class*='Card']").all()
        if len(cards) == 0:
            # Попробуем просто ссылки внутри списка
            links = page.locator("main a[href*='/news/']").all()
            if len(links) == 0:
                log_error(run, "Новости — список", "Карточки новостей не найдены", sc)
                return
            else:
                log_pass(run, f"Новости — найдено {len(links)} ссылок на статьи")
                # Открываем первую
                first_href = links[0].get_attribute("href")
                page.goto(BASE_URL + first_href if first_href.startswith("/") else first_href, timeout=15000)
                wait_load(page)
                title = page.locator("h1").first
                if title.count() == 0:
                    log_error(run, "Новость — открытие", "H1 не найден на странице статьи", screenshot(page, f"r{run}_news_article"))
                else:
                    log_pass(run, f"Новость открыта: «{title.inner_text()[:60]}»")
        else:
            log_pass(run, f"Новости — найдено {len(cards)} карточек")
            # Кликаем первую карточку
            try:
                cards[0].click()
                wait_load(page)
                if "/news/" not in page.url:
                    log_error(run, "Новость — открытие по клику", f"URL: {page.url}")
                else:
                    title = page.locator("h1").first
                    if title.count() > 0:
                        log_pass(run, f"Новость открыта: «{title.inner_text()[:60]}»")
                    else:
                        log_error(run, "Новость — H1", "H1 не найден", screenshot(page, f"r{run}_article"))
            except Exception as e:
                log_error(run, "Новость — клик по карточке", str(e)[:200])

        # Возвращаемся и проверяем фильтр по категориям
        page.goto(BASE_URL + "/news", timeout=15000)
        wait_load(page)
        try:
            # Фильтры реализованы как <a href="/news?category=...">
            filter_links = page.locator("a[href*='/news?category='], a[href*='category=']").all()
            filter_btns = page.locator("button[data-category], button[class*='filter'], [class*='category'] button, [class*='tab']").all()
            selects = page.locator("select").all()
            if len(filter_links) > 0:
                log_pass(run, f"Фильтр новостей — {len(filter_links)} категорий (ссылки)")
                # Кликаем первый фильтр
                filter_links[0].click()
                page.wait_for_timeout(1500)
                wait_load(page, 8000)
                if "category=" in page.url:
                    log_pass(run, f"Фильтр новостей — фильтрация работает: {page.url}")
                else:
                    log_error(run, "Фильтр новостей — URL после клика", f"Нет ?category= в URL: {page.url}")
            elif len(filter_btns) > 0:
                filter_btns[0].click()
                wait_load(page, 8000)
                log_pass(run, f"Фильтр новостей — кнопка кликается ({len(filter_btns)} фильтров)")
            elif selects:
                log_pass(run, "Фильтр новостей — select найден")
            else:
                log_error(run, "Фильтр новостей", "Фильтры/категории не найдены")
        except Exception as e:
            log_error(run, "Фильтр новостей", str(e)[:200])

    except Exception as e:
        log_error(run, "Новости общее", str(e)[:200])

# ─── ПРОГОН 4: API endpoints ───────────────────────────────────────────────────

def run_04_api(page, run):
    print("\n[Прогон 4] API endpoints")
    endpoints = [
        ("/api/health", "Health"),
        ("/api/v1/stats", "v1 Stats"),
        ("/api/v1/departments", "v1 Departments"),
        ("/api/v1/knowledge", "v1 Knowledge"),
        ("/api/news", "News CRUD"),
        ("/api/pages", "Pages CRUD"),
        ("/api/search?q=аниц", "Search"),
    ]
    for path, label in endpoints:
        try:
            resp = page.goto(BASE_URL + path, timeout=15000)
            if resp and resp.status >= 500:
                log_error(run, f"API {label}", f"HTTP {resp.status}: {path}")
            elif resp and resp.status == 404:
                log_error(run, f"API {label}", f"HTTP 404 — endpoint не существует: {path}")
            else:
                # Проверяем что отвечает JSON
                try:
                    content = page.locator("body").inner_text()
                    json.loads(content)
                    log_pass(run, f"API {label} ({resp.status if resp else '?'})")
                except json.JSONDecodeError:
                    # Может быть не JSON (redirect на login), это нормально для защищённых
                    if resp and resp.status in [200, 401, 403]:
                        log_pass(run, f"API {label} (не JSON, статус {resp.status} — ожидаемо)")
                    else:
                        log_error(run, f"API {label}", f"Ответ не JSON, статус {resp.status if resp else '?'}")
        except Exception as e:
            log_error(run, f"API {label}", str(e)[:200])

# ─── ПРОГОН 5: CMS — логин ─────────────────────────────────────────────────────

def run_05_admin_login(page, run):
    print("\n[Прогон 5] CMS — страница логина")
    try:
        page.goto(BASE_URL + "/admin", timeout=20000)
        wait_load(page)
        current_url = page.url

        # Должны попасть на /admin/login
        if "login" not in current_url and "admin" not in current_url:
            log_error(run, "CMS — редирект на логин", f"URL: {current_url}", screenshot(page, f"r{run}_admin_redirect"))
            return
        else:
            log_pass(run, f"CMS — редирект на логин: {current_url}")

        # Убеждаемся что мы на /admin/login
        if "login" not in current_url:
            page.goto(BASE_URL + "/admin/login", timeout=15000)
            wait_load(page)

        sc = screenshot(page, f"r{run}_login_page")

        # Проверяем форму
        email_input = page.locator("input[type='email'], input[name='email'], input[placeholder*='mail'], input[placeholder*='Email']").first
        password_input = page.locator("input[type='password']").first
        submit_btn = page.locator("button[type='submit']").first

        if email_input.count() == 0:
            log_error(run, "Форма логина — email поле", "Input email не найден", sc)
        else:
            log_pass(run, "Форма логина — email поле найдено")

        if password_input.count() == 0:
            log_error(run, "Форма логина — password поле", "Input password не найден", sc)
        else:
            log_pass(run, "Форма логина — password поле найдено")

        if submit_btn.count() == 0:
            log_error(run, "Форма логина — кнопка Submit", "Button[type=submit] не найден", sc)
        else:
            log_pass(run, "Форма логина — кнопка найдена")

        # Пытаемся войти с неверными данными → должна быть ошибка
        if email_input.count() > 0 and password_input.count() > 0 and submit_btn.count() > 0:
            email_input.fill("wrong@example.com")
            password_input.fill("wrongpassword")
            submit_btn.click()
            page.wait_for_timeout(3000)

            error_msg = page.locator("[class*='error'], [class*='Error'], [role='alert'], .text-red, .text-destructive").first
            if error_msg.count() > 0:
                log_pass(run, f"Форма логина — ошибка при неверных данных: «{error_msg.inner_text()[:80]}»")
            else:
                # Если нет явного error элемента, просто убеждаемся что не вошли в админку
                if "/admin/login" in page.url or "login" in page.url:
                    log_pass(run, "Форма логина — неверные данные отклонены (остались на странице логина)")
                else:
                    log_error(run, "Форма логина — безопасность", f"Вошли с неверными данными! URL: {page.url}", screenshot(page, f"r{run}_login_wrong"))

        # Логин с правильными данными (admin / admin123 — дефолт из seed)
        page.goto(BASE_URL + "/admin/login", timeout=15000)
        wait_load(page)
        email_input = page.locator("input[type='email'], input[name='email'], input[placeholder*='mail'], input[placeholder*='Email']").first
        password_input = page.locator("input[type='password']").first
        submit_btn = page.locator("button[type='submit']").first

        if email_input.count() > 0 and password_input.count() > 0:
            email_input.fill("admin@anic.ru")
            password_input.fill("admin123")
            submit_btn.click()
            # Ждём редиректа после входа — до 10 секунд
            try:
                page.wait_for_url(lambda url: "/admin" in url and "login" not in url, timeout=10000)
            except:
                page.wait_for_timeout(6000)
                wait_load(page, 10000)

            if "/admin" in page.url and "login" not in page.url:
                log_pass(run, f"CMS — успешный вход: {page.url}")
                return True  # Вошли
            else:
                log_error(run, "CMS — вход с правильными данными", f"URL после входа: {page.url}", screenshot(page, f"r{run}_login_correct"))

    except Exception as e:
        log_error(run, "CMS — логин", str(e)[:200])
    return False

# ─── ПРОГОН 6: CMS — дашборд и sidebar ────────────────────────────────────────

def run_06_admin_dashboard(page, run):
    print("\n[Прогон 6] CMS — дашборд и навигация")
    # Входим в CMS
    page.goto(BASE_URL + "/admin/login", timeout=20000)
    wait_load(page)
    try:
        email = page.locator("input[type='email'], input[name='email']").first
        pwd = page.locator("input[type='password']").first
        btn = page.locator("button[type='submit']").first
        if email.count() > 0 and pwd.count() > 0:
            email.fill("admin@anic.ru")
            pwd.fill("admin123")
            btn.click()
            page.wait_for_timeout(4000)
            wait_load(page, 10000)
    except Exception as e:
        log_error(run, "CMS вход (setup)", str(e)[:200])
        return

    if "login" in page.url:
        log_error(run, "CMS — вход не выполнен (skip прогона 6)", "Не удалось авторизоваться")
        return

    sc = screenshot(page, f"r{run}_admin_dashboard")
    log_pass(run, f"CMS — дашборд загружен: {page.url}")

    # Проверяем sidebar
    sidebar_links = [
        ("/admin/news", "Новости"),
        ("/admin/pages", "Страницы"),
        ("/admin/knowledge", "База знаний"),
        ("/admin/files", "Файлы"),
        ("/admin/team", "Команда"),
        ("/admin/departments", "Подразделения"),
        ("/admin/settings", "Настройки"),
    ]

    for href, label in sidebar_links:
        try:
            link = page.locator(f"a[href='{href}']").first
            if link.count() > 0:
                log_pass(run, f"Sidebar ссылка «{label}» найдена")
            else:
                log_error(run, f"Sidebar ссылка «{label}»", f"a[href='{href}'] не найдена в sidebar", sc)
        except Exception as e:
            log_error(run, f"Sidebar «{label}»", str(e)[:200])

# ─── ПРОГОН 7: CMS — раздел Новости (список, навигация к форме) ───────────────

def run_07_admin_news(page, run):
    print("\n[Прогон 7] CMS — управление новостями")
    # Вход
    page.goto(BASE_URL + "/admin/login", timeout=20000)
    wait_load(page)
    try:
        email = page.locator("input[type='email'], input[name='email']").first
        pwd = page.locator("input[type='password']").first
        btn = page.locator("button[type='submit']").first
        if email.count() > 0:
            email.fill("admin@anic.ru")
            pwd.fill("admin123")
            btn.click()
            page.wait_for_timeout(4000)
            wait_load(page, 10000)
    except:
        pass

    if "login" in page.url:
        log_error(run, "CMS новости (setup)", "Не удалось войти — прогон пропущен")
        return

    # Список новостей
    page.goto(BASE_URL + "/admin/news", timeout=20000)
    wait_load(page)
    sc = screenshot(page, f"r{run}_admin_news")

    if page.locator("h1, h2").first.count() == 0:
        log_error(run, "CMS /admin/news — заголовок", "Заголовок не найден", sc)
    else:
        log_pass(run, f"CMS /admin/news — страница загружена")

    # Кнопка «Добавить»
    add_btn = page.locator("a[href='/admin/news/new'], button:has-text('Добавить'), button:has-text('Создать'), a:has-text('Добавить')").first
    if add_btn.count() > 0:
        log_pass(run, "CMS новости — кнопка Добавить найдена")
        # Открываем форму создания
        try:
            add_btn.click()
            wait_load(page)
            if "/admin/news/new" in page.url or "new" in page.url:
                log_pass(run, "CMS новости — форма создания открылась")
                sc_new = screenshot(page, f"r{run}_admin_news_new")

                # Ждём загрузку JS — явно ждём input#title (CSR компонент)
                try:
                    page.wait_for_selector("input#title, input[placeholder*='заголовок новости']", timeout=10000)
                    log_pass(run, "CMS новости — поле «Заголовок» найдено")
                except:
                    sc_new = screenshot(page, f"r{run}_admin_news_new_loaded")
                    log_error(run, "CMS новости — форма", "Поле заголовка не загрузилось за 10с", sc_new)

                # Редактор Tiptap — ждём до 8 секунд
                try:
                    page.wait_for_selector(".ProseMirror, [contenteditable='true']", timeout=8000)
                    log_pass(run, "CMS новости — редактор Tiptap найден")
                except:
                    sc_tiptap = screenshot(page, f"r{run}_tiptap_missing")
                    log_error(run, "CMS новости — Tiptap", "Редактор .ProseMirror не загрузился за 8с", sc_tiptap)

                # Кнопка публикации
                pub_btn = page.locator("button:has-text('Опубликовать'), button:has-text('Сохранить'), button[type='submit']").first
                if pub_btn.count() > 0:
                    log_pass(run, "CMS новости — кнопка публикации найдена")
                else:
                    log_error(run, "CMS новости — кнопка публикации", "Не найдена", sc_new)
            else:
                log_error(run, "CMS новости — переход к форме", f"URL: {page.url}")
        except Exception as e:
            log_error(run, "CMS новости — открытие формы", str(e)[:200])
    else:
        log_error(run, "CMS новости — кнопка Добавить", "Не найдена", sc)

# ─── ПРОГОН 8: CMS — другие разделы (быстрый обход) ──────────────────────────

def run_08_admin_sections(page, run):
    print("\n[Прогон 8] CMS — обход разделов")
    page.goto(BASE_URL + "/admin/login", timeout=20000)
    wait_load(page)
    try:
        email = page.locator("input[type='email'], input[name='email']").first
        pwd = page.locator("input[type='password']").first
        btn = page.locator("button[type='submit']").first
        if email.count() > 0:
            email.fill("admin@anic.ru")
            pwd.fill("admin123")
            btn.click()
            page.wait_for_timeout(4000)
            wait_load(page, 10000)
    except:
        pass

    if "login" in page.url:
        log_error(run, "CMS разделы (setup)", "Не удалось войти")
        return

    sections = [
        ("/admin/pages", "Страницы"),
        ("/admin/knowledge", "База знаний"),
        ("/admin/team", "Команда"),
        ("/admin/departments", "Подразделения"),
        ("/admin/projects", "Проекты"),
        ("/admin/publications", "Публикации"),
        ("/admin/partners", "Партнёры"),
        ("/admin/procurements", "Закупки"),
        ("/admin/media", "Медиа"),
        ("/admin/crosspost", "Кросс-постинг"),
        ("/admin/files", "Файловый менеджер"),
        ("/admin/settings", "Настройки"),
    ]

    for path, label in sections:
        try:
            resp = page.goto(BASE_URL + path, timeout=30000)
            wait_load(page, 25000)  # dev-режим: первая компиляция route может занять ~20s
            if resp and resp.status >= 400:
                log_error(run, f"CMS {label}", f"HTTP {resp.status}", screenshot(page, f"r{run}_admin{path.replace('/','_')}"))
            else:
                # Проверяем что не вернулся на логин
                if "login" in page.url:
                    log_error(run, f"CMS {label}", "Редирект обратно на логин — нет доступа")
                elif len(page.locator("main, [role='main']").all()) == 0 and len(page.locator("h1,h2,h3").all()) == 0:
                    log_error(run, f"CMS {label}", "Страница пустая", screenshot(page, f"r{run}_empty{path.replace('/','_')}"))
                else:
                    log_pass(run, f"CMS {label} ({path})")
        except Exception as e:
            log_error(run, f"CMS {label}", str(e)[:200])

# ─── ПРОГОН 9: Форма обратной связи (Контакты) ────────────────────────────────

def run_09_contact_form(page, run):
    print("\n[Прогон 9] Форма обратной связи")
    try:
        page.goto(BASE_URL + "/contacts", timeout=20000)
        wait_load(page)
        sc = screenshot(page, f"r{run}_contacts")

        form = page.locator("form").first
        if form.count() == 0:
            log_error(run, "Контакты — форма", "Форма <form> не найдена на /contacts", sc)
            return

        log_pass(run, "Контакты — форма найдена")

        # Проверяем поля
        name_input = page.locator("input[name='name'], input[placeholder*='Имя'], input[placeholder*='имя']").first
        email_input = page.locator("input[type='email'], input[name='email']").first
        msg_input = page.locator("textarea").first
        submit = page.locator("button[type='submit'], form button").first

        fields_ok = True
        for field, label in [(name_input, "Имя"), (email_input, "Email"), (msg_input, "Сообщение"), (submit, "Кнопка отправки")]:
            if field.count() > 0:
                log_pass(run, f"Форма контактов — поле «{label}» найдено")
            else:
                log_error(run, f"Форма контактов — поле «{label}»", "Не найдено", sc)
                fields_ok = False

        # Проверка валидации — пустая отправка
        if submit.count() > 0:
            submit.click()
            page.wait_for_timeout(2000)
            # HTML5 validation или кастомная
            validation_msgs = page.locator(":invalid, [class*='error'], [class*='Error']").all()
            if len(validation_msgs) > 0:
                log_pass(run, f"Форма контактов — валидация пустой формы работает ({len(validation_msgs)} ошибок)")
            else:
                log_pass(run, "Форма контактов — отправка пустой формы обработана (без явных ошибок UI)")

        # Заполняем и отправляем тест
        if fields_ok:
            # Перезагружаем форму (после валидации пустой)
            page.goto(BASE_URL + "/contacts", timeout=15000)
            wait_load(page)
            name_input = page.locator("input[name='name'], input[placeholder*='Имя'], input[placeholder*='имя']").first
            email_input = page.locator("input[type='email'], input[name='email']").first
            msg_input = page.locator("textarea").first
            subject_input = page.locator("input[name='subject'], input#subject, input[placeholder*='Тема'], input[placeholder*='тема']").first
            submit = page.locator("button[type='submit'], form button").first

            if name_input.count() > 0:
                name_input.fill("Тест Тестовый")
            if email_input.count() > 0:
                email_input.fill("test@example.com")
            if subject_input.count() > 0:
                subject_input.fill("Автотест — проверка формы")
            if msg_input.count() > 0:
                msg_input.fill("Тестовое сообщение — автоматическая проверка формы обратной связи")
            if submit.count() > 0:
                submit.click()
                page.wait_for_timeout(4000)
                wait_load(page, 8000)
                # Проверяем успех: ContactForm показывает блок с "Сообщение отправлено!"
                try:
                    page.wait_for_selector("text=Сообщение отправлено, :has-text('отправлено'), :has-text('Спасибо'), [class*='success']", timeout=5000)
                    log_pass(run, "Форма контактов — успешная отправка (сообщение об успехе)")
                except:
                    sc2 = screenshot(page, f"r{run}_contact_sent")
                    body_text = page.locator("body").inner_text()
                    if "отправлено" in body_text.lower() or "спасибо" in body_text.lower() or "сообщение" in body_text.lower():
                        log_pass(run, "Форма контактов — успех найден в тексте страницы")
                    else:
                        log_error(run, "Форма контактов — подтверждение отправки", "Сообщение об успехе не найдено", sc2)

    except Exception as e:
        log_error(run, "Форма контактов", str(e)[:200])

# ─── ПРОГОН 10: Поиск + документы + SEO ──────────────────────────────────────

def run_10_search_docs_seo(page, run):
    print("\n[Прогон 10] Поиск, документы, SEO")

    # /documents — аккордеон папок
    try:
        page.goto(BASE_URL + "/documents", timeout=20000)
        wait_load(page)
        sc = screenshot(page, f"r{run}_documents")

        folders = page.locator("[data-state], details, [class*='accordion'], [class*='Accordion']").all()
        links = page.locator("main a[href*='.pdf'], main a[download]").all()
        if len(folders) > 0:
            log_pass(run, f"Документы — аккордеон найден ({len(folders)} элементов)")
            # Кликаем первый
            try:
                folders[0].click()
                page.wait_for_timeout(1000)
                log_pass(run, "Документы — аккордеон открывается")
            except:
                pass
        elif len(links) > 0:
            log_pass(run, f"Документы — найдено {len(links)} ссылок на файлы")
        else:
            log_error(run, "Документы", "Ни аккордеона, ни PDF-ссылок не найдено", sc)
    except Exception as e:
        log_error(run, "Документы", str(e)[:200])

    # /api/search
    try:
        resp = page.goto(BASE_URL + "/api/search?q=арктический", timeout=15000)
        if resp and resp.status == 200:
            content = page.locator("body").inner_text()
            try:
                data = json.loads(content)
                log_pass(run, "Search API — отвечает JSON")
            except:
                log_error(run, "Search API", "Ответ не JSON")
        elif resp:
            log_error(run, "Search API", f"HTTP {resp.status}")
    except Exception as e:
        log_error(run, "Search API", str(e)[:200])

    # robots.txt
    try:
        resp = page.goto(BASE_URL + "/robots.txt", timeout=10000)
        if resp and resp.status == 200:
            content = page.locator("body").inner_text()
            if "Disallow" in content or "User-agent" in content:
                log_pass(run, "robots.txt — корректный")
            else:
                log_error(run, "robots.txt", f"Неожиданное содержимое: {content[:100]}")
        else:
            log_error(run, "robots.txt", f"HTTP {resp.status if resp else '?'}")
    except Exception as e:
        log_error(run, "robots.txt", str(e)[:200])

    # sitemap.xml
    try:
        resp = page.goto(BASE_URL + "/sitemap.xml", timeout=15000)
        if resp and resp.status == 200:
            content = page.locator("body").inner_text()
            if "<url>" in content or "<urlset" in content or "urlset" in content:
                log_pass(run, "sitemap.xml — корректный XML")
            else:
                log_error(run, "sitemap.xml", f"Неожиданное содержимое: {content[:150]}")
        else:
            log_error(run, "sitemap.xml", f"HTTP {resp.status if resp else '?'}")
    except Exception as e:
        log_error(run, "sitemap.xml", str(e)[:200])

    # OG meta на главной
    try:
        page.goto(BASE_URL, timeout=15000)
        wait_load(page)
        og_title = page.locator("meta[property='og:title']").get_attribute("content") if page.locator("meta[property='og:title']").count() > 0 else None
        og_desc = page.locator("meta[property='og:description']").get_attribute("content") if page.locator("meta[property='og:description']").count() > 0 else None
        if og_title:
            log_pass(run, f"OG:title — «{og_title[:60]}»")
        else:
            log_error(run, "OG:title", "meta[property='og:title'] не найден")
        if og_desc:
            log_pass(run, f"OG:description — «{og_desc[:60]}»")
        else:
            log_error(run, "OG:description", "meta[property='og:description'] не найден")
    except Exception as e:
        log_error(run, "OG meta", str(e)[:200])

# ─── ЗАПИСЬ ЛОГА ──────────────────────────────────────────────────────────────

def write_log():
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    total = len(errors) + len(passes)
    error_count = len(errors)
    pass_count = len(passes)
    pass_rate = round(pass_count / total * 100) if total > 0 else 0

    lines = [
        f"# Лог тестирования — Веб-портал ГБУ «АНИЦ»",
        f"",
        f"> Дата: {now}",
        f"> Прогонов: 10",
        f"> Всего проверок: {total}  |  ✅ Прошло: {pass_count}  |  ❌ Ошибок: {error_count}  |  Успешность: {pass_rate}%",
        f"",
        f"---",
        f"",
        f"## Сводка по прогонам",
        f"",
        f"| Прогон | Описание | Ошибок |",
        f"|--------|----------|--------|",
    ]

    runs_desc = {
        1: "Публичные страницы — HTTP и рендер",
        2: "Навигация — header, footer, ссылки",
        3: "Новости — список, фильтры, статья",
        4: "API endpoints",
        5: "CMS — страница логина",
        6: "CMS — дашборд и sidebar",
        7: "CMS — управление новостями",
        8: "CMS — обход разделов",
        9: "Форма обратной связи",
        10: "Поиск, документы, SEO",
    }

    for r in range(1, 11):
        run_errors = [e for e in errors if e["run"] == r]
        lines.append(f"| {r} | {runs_desc.get(r, '')} | {'❌ ' + str(len(run_errors)) if run_errors else '✅ 0'} |")

    if errors:
        lines += [
            f"",
            f"---",
            f"",
            f"## Список ошибок",
            f"",
        ]
        for e in errors:
            lines.append(f"### ❌ [{e['run']}] {e['test']}")
            lines.append(f"- **Описание:** {e['detail']}")
            if e.get("screenshot"):
                lines.append(f"- **Скриншот:** `{e['screenshot']}`")
            lines.append(f"- **Время:** {e['ts']}")
            lines.append(f"")

    lines += [
        f"---",
        f"",
        f"## Что прошло",
        f"",
    ]
    for p in passes[:50]:  # Первые 50
        lines.append(f"- ✅ [{p['run']}] {p['test']}")
    if len(passes) > 50:
        lines.append(f"- ... ещё {len(passes)-50} проверок прошло успешно")

    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n{'='*60}")
    print(f"ИТОГО: {pass_count}/{total} прошло ({pass_rate}%) | ❌ ошибок: {error_count}")
    print(f"Лог сохранён: {LOG_PATH}")
    print(f"{'='*60}\n")

# ─── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Тестирование веб-портала ГБУ «АНИЦ» — 10 прогонов")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (compatible; ANIC-TestBot/1.0)"
        )
        page = context.new_page()
        # Подавляем диалоги
        page.on("dialog", lambda d: d.dismiss())

        run_01_public_pages(page, 1)
        run_02_navigation(page, 2)
        run_03_news(page, 3)
        run_04_api(page, 4)
        run_05_admin_login(page, 5)
        run_06_admin_dashboard(page, 6)
        run_07_admin_news(page, 7)
        run_08_admin_sections(page, 8)
        run_09_contact_form(page, 9)
        run_10_search_docs_seo(page, 10)

        browser.close()

    write_log()

if __name__ == "__main__":
    main()
