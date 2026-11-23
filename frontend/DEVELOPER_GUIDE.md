# Developer Guide: Migrating from Supabase to PostgreSQL

This guide provides step-by-step instructions to migrate your project from Supabase to a direct PostgreSQL backend, including how to set up a local PostgreSQL database for development and testing **on Windows using Command Prompt (cmd)**.

---

## 1. Install PostgreSQL Locally

**a. Download and Install:**
- Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) and download the installer for Windows.
- Run the installer and follow the prompts (default settings are fine for local development).
- Remember the username (default: `postgres`) and password you set during installation.

**b. Verify Installation:**
- Open **Command Prompt** and run:
  ```cmd
  psql --version
  ```
- You should see the installed version.

---

## 2. Create a Local Database for Testing
    
**a. Open the PostgreSQL shell:**
- In **Command Prompt**, run:
  ```cmd
  psql -U postgres
  ```
  (If you set a different username, use that instead of `postgres`.)
- Enter your password when prompted.

**b. Create a new database:**
  ```sql
  CREATE DATABASE transbridge_dev;
  ```

**c. (Optional) Create a dedicated user:**
  ```sql
  CREATE USER transbridge_user WITH PASSWORD 'yourpassword';
  GRANT ALL PRIVILEGES ON DATABASE transbridge_dev TO transbridge_user;
  ```
- To exit the psql shell:
  ```sql
  \q
  ```

---

## 3. Export Your Supabase Schema (If Needed)

- In the Supabase dashboard, go to your project > SQL Editor > click "Generate types" or "Export schema".
- Save the SQL file to your computer, e.g., `C:\Users\YourName\Downloads\exported_schema.sql`.

- **Import schema into PostgreSQL:**
  ```cmd
  psql -U postgres -d transbridge_dev -f "C:\Users\YourName\Downloads\exported_schema.sql"
  ```
  (Update the path as needed.)

---

## 4. Update Your Project to Use PostgreSQL

### a. Install PostgreSQL Client for Node.js

In your project directory, run:
```cmd
npm install pg
```
or
```cmd
yarn add pg
```

### b. Replace Supabase Client with pg

- Remove or ignore all Supabase-specific code (e.g., `@supabase/supabase-js`).
- Create a new file for your PostgreSQL connection, e.g., `src/lib/postgres.ts`:

```ts
import { Pool } from 'pg';

const pool = new Pool({
  user: 'transbridge_user',      // your db user
  host: 'localhost',
  database: 'transbridge_dev',   // your db name
  password: 'yourpassword',      // your db password
  port: 5432,                    // default PostgreSQL port
});

export default pool;
```

### c. Rewrite Data Access Logic

- Refactor your data access code (in `hooks/`, `lib/`, etc.) to use SQL queries via the `pg` client instead of Supabase client methods.
- Example (fetching users):

```ts
import pool from '../lib/postgres';

export async function getUsers() {
  const res = await pool.query('SELECT * FROM users');
  return res.rows;
}
```

- Update all CRUD operations similarly.

---

## 5. Update Environment Variables

- Store your DB credentials in a `.env` file in your project root:
  ```env
  PGUSER=transbridge_user
  PGPASSWORD=yourpassword
  PGHOST=localhost
  PGDATABASE=transbridge_dev
  PGPORT=5432
  ```
- Install `dotenv` if not already installed:
  ```cmd
  npm install dotenv
  ```
- Load these variables in your Node.js code:
  ```ts
  import 'dotenv/config';
  // or
  require('dotenv').config();
  ```

---

## 6. Test Your Local Setup

- Make sure your PostgreSQL server is running. You can start it from the Windows Start Menu or Services panel if needed.
- Run your app:
  ```cmd
  npm run dev
  ```
  or
  ```cmd
  yarn dev
  ```
- Test all database operations.
- Use a tool like [pgAdmin](https://www.pgadmin.org/) or [DBeaver](https://dbeaver.io/) to inspect your database.

---

## 7. Remove Supabase Dependencies

- Uninstall Supabase packages:
  ```cmd
  npm uninstall @supabase/supabase-js
  ```
- Remove or refactor all code that references Supabase.

---

## 8. (Optional) Update Documentation

- Update your project’s documentation to reflect the new database setup and usage.

---

# Summary Table

| Step | Action |
|------|--------|
| 1    | Install PostgreSQL locally |
| 2    | Create a local database and user |
| 3    | Export/import schema from Supabase (if needed) |
| 4    | Install `pg` and set up PostgreSQL client in code |
| 5    | Refactor data access logic to use SQL queries |
| 6    | Update environment variables |
| 7    | Test the new setup |
| 8    | Remove Supabase dependencies and update docs |

---

**If you want example code for a specific module (e.g., authentication, user management) using PostgreSQL directly, let the team know!** 