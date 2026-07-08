# torchive-server

Torchive server is a NestJS backend that indexes local work resources and stores metadata in SQLite through TypeORM.

## Requirements

- Node.js 22 or a compatible LTS release
- npm
- SQLite native dependency support for `better-sqlite3`

On Windows PowerShell, if `npm` is blocked by the script execution policy, run commands with `npm.cmd`.

## Install

```bash
npm install --omit=optional --legacy-peer-deps
```

The project uses `better-sqlite3` as the SQLite driver. `sqlite3` is not a direct dependency and should not be added back unless the database driver is changed.

If you need the npm mirror:

```bash
npm install --omit=optional --legacy-peer-deps --registry=https://registry.npmmirror.com/
```

## Environment

Create a local `.env` from the template:

```powershell
Copy-Item .env.example .env
```

Required and common variables:

```env
PORT=2333
JWT_SECRET=change-me
JWT_EXPIRES_IN=3600s
SQLITE_DB_PATH=./database/sqlite/
WORK_DIR_PATH=
ADMIN_INITIAL_PASSWORD=
```

`.env` contains secrets and local paths. Do not commit it. If `.env` has already been tracked by Git, remove it from the index once:

```bash
git rm --cached .env
```

## Super Admin

The reserved super admin account is:

```text
uid: admin
login_name: admin
```

Set `ADMIN_INITIAL_PASSWORD` before the first startup to bootstrap the account:

```env
ADMIN_INITIAL_PASSWORD=use-a-strong-password-here
```

Rules:

- The password must be at least 12 characters.
- The account is created only if `admin` does not already exist.
- Startup never resets an existing admin password.
- Public user creation cannot claim `uid` or `login_name` as `admin`.
- The super admin account cannot be deleted through the user service.
- Passwords are stored with salted `scrypt` hashes. Existing SHA-256 hashes are migrated after a successful login.

After the admin account is created, prefer removing `ADMIN_INITIAL_PASSWORD` from the local environment or replacing it with a secret managed by your deployment platform.

## Run

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

## Test

```bash
npm test -- --runInBand
```

## Project Notes

- `ConfigModule` loads `.env` globally.
- The SQLite database path is built from `SQLITE_DB_PATH`.
- Static resources are served from `WORK_DIR_PATH` when configured.
- Uploaded files are stored under `upload-files/`, which is ignored by Git.

## Dependency Notes

- `@nestjs/mapped-types` is pinned with a normal semver range instead of `*`.
- `class-validator` and `class-transformer` are required by the DTO validation layer.
- The package lock should resolve from the configured npm registry and should not contain the old Nexus host `repo.bingosoft.net`.
