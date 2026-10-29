# Bilim — платформа проверки знаний студентов

**Тема:** «Студенттердің білімін тексеруге арналған бағдарламалық қамтамасыз етуді әзірлеу».

Статическое веб-приложение (HTML5, Tailwind CSS через CDN, Vanilla JavaScript) на **Firebase**: Authentication для входа и Cloud Firestore для данных. Отдельного сервера, Node.js/Express и SQLite больше нет. Хостинг — Vercel (или Firebase Hosting).

## Запуск за 5 шагов

1. **Firebase Console** → создайте проект → *Build → Authentication → Sign-in method* → включите **Email/Password**.
2. *Build → Firestore Database* → Create database.
3. *Firestore → Rules* → вставьте содержимое `firestore.rules` → **Publish**.
4. *Project settings → General → Your apps → Web (`</>`)* → скопируйте конфиг в `frontend/assets/firebase-config.js` (замените все `PASTE_...`).
5. Откройте сайт по адресу `/setup.html` и нажмите «Запустить настройку»: создаются администратор, учитель и студент, 5 предметов и 10 тестов. Дальше входите на главной странице.

## Vercel

Импортируйте папку проекта в Vercel (Framework Preset: **Other**, build command пустой). `vercel.json` уже указывает папку `frontend` и заголовки безопасности. После деплоя добавьте домен Vercel в *Firebase → Authentication → Settings → Authorized domains*.

## Демонстрационные аккаунты (создаются на /setup.html)

| Роль | Email | Пароль по умолчанию |
| --- | --- | --- |
| Студент | student@bilim.local | Student123! |
| Учитель | teacher@bilim.local | Teacher123! |
| Администратор | admin@bilim.local | Admin123! |

Пароли можно задать свои прямо на странице настройки. После настройки удалите `frontend/setup.html` и `frontend/assets/setup.js` (или смените пароли). Если меняете email администратора, поменяйте его и в `firestore.rules` (`bootstrapEmail`), и в `setup.js` (`ADMIN_EMAIL`).

## Как устроено

| Было | Стало |
| --- | --- |
| Express + REST API | `frontend/assets/backend.js` — те же маршруты и ответы, но поверх Firebase SDK |
| SQLite (`bilim.sqlite`) | Cloud Firestore: `users`, `subjects`, `tests`, `attempts` |
| Свои сессии и scrypt-пароли | Firebase Authentication |
| Роли на сервере | Поле `role` в `users/{uid}` + `firestore.rules` |
| Проверка кода в Node Worker + QuickJS | `frontend/assets/grader.js`: Web Worker в браузере, без сети, 400 мс на пример, принудительное завершение |
| `backend/seed.js` | `frontend/assets/seed.js` (используется `/setup.html`) |

Интерфейс, тексты, темы, RU/ҚАЗ — без изменений. Правила безопасности (`firestore.rules`): студент видит только свои работы и опубликованные тесты, учитель — только свои предметы, администратор — всё; заблокированный пользователь теряет доступ к данным сразу.

## Ограничения версии без собственного сервера

- Автоматическая оценка (теория и практика) считается **в браузере**. Правильные ответы лежат в документе попытки, поэтому технически подкованный студент может их посмотреть или подделать оценку. Для демонстрации и учебного использования это допустимо; для настоящих экзаменов проверку нужно вынести в Cloud Functions (тариф Blaze).
- Удаление пользователя в панели администратора удаляет его профиль и работы, но не запись в Firebase Authentication (это возможно только через Admin SDK). Удалите её вручную в консоли, если нужно снова использовать тот же email.
- Тарифа Spark (бесплатный, без карты) достаточно.

## Файлы проекта

```text
project-root/
├── frontend/
│   ├── index.html, student/teacher/admin.dashboard.html, setup.html
│   └── assets/
│       ├── firebase-config.js   # ВСТАВЬТЕ СЮДА ключи Firebase
│       ├── firebase.js          # инициализация Auth и Firestore
│       ├── backend.js           # логика приложения поверх Firebase
│       ├── grader.js            # проверка кода студента (Web Worker)
│       ├── seed.js              # 100 вопросов и 5 практических заданий
│       ├── setup.js             # первичная настройка
│       └── common.js, login.js, dashboard.js, student.js, teacher.js, admin.js, i18n.js, locales.js, ...
├── firestore.rules, firebase.json
├── vercel.json
├── Dockerfile, compose.yaml, nginx.conf, .dockerignore   # запуск в Docker через nginx
└── tests/preferences.test.js
```

## Docker

Из папки `project-root`:

```bash
docker compose up --build
```

Сайт откроется на **http://localhost:8084** (nginx раздаёт папку `frontend`). Остановка: `docker compose down`. Firebase при этом остаётся в облаке, поэтому ключи в `firebase-config.js` нужны так же. `localhost` уже входит в разрешённые домены Firebase Authentication.

## Предметы и стартовые задания

ООП, Бағдарламалық қамтамасыз етуді әзірлеу, Мобильдік қосымшаны әзірлеу, Мәліметтер базасы, Веб бағдарламалау: у каждого 20 теоретических вопросов (5 баллов за верный ответ, 30 минут) и одно практическое задание с 5 проверочными примерами. Контракт решения — синхронная функция `solve(...args)`, возвращающая JSON-совместимое значение.
