# Deploying Awning

**Important:** Awning is a Next.js (Node.js) app with a MySQL database. It
**cannot** run on Hostinger *shared / web hosting* (PHP only). You need a
Node-capable host. Two good options:

---

## Option A — Vercel (fastest, free to start) + hosted MySQL

Best if you don't want to manage a server. ~10 minutes.

1. **Database:** create a free/cheap MySQL at **Railway** (railway.app),
   **PlanetScale**, or **Aiven**. Copy its connection string → this is your
   `DATABASE_URL`.
2. **Push the code to GitHub:**
   ```bash
   git init && git add -A && git commit -m "Awning"
   # create a repo on github.com, then:
   git remote add origin https://github.com/<you>/awning.git
   git push -u origin main
   ```
3. **Deploy:** go to vercel.com → "New Project" → import the GitHub repo.
4. **Environment variables:** in Vercel's project settings, add everything
   from `.env.production.example` (DATABASE_URL, AUTH_SECRET, SMTP_*, etc.).
5. **Database tables:** once deployed, run the migration + seed against the
   production DB from your laptop:
   ```bash
   DATABASE_URL="<prod url>" npx prisma migrate deploy
   DATABASE_URL="<prod url>" npx tsx prisma/seed.ts
   ```
6. **Domain:** add your domain in Vercel → Settings → Domains, and point your
   DNS (you can keep the domain at Hostinger and just change the DNS records).

Done — your site is live on HTTPS.

---

## Option B — Hostinger VPS (stay with Hostinger)

Requires upgrading from shared hosting to a **VPS** plan (Node is supported
there; shared is not). On the VPS (Ubuntu):

1. Install Node 22 + MySQL:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs mysql-server
   ```
2. Create the database:
   ```bash
   sudo mysql -e "CREATE DATABASE awning CHARACTER SET utf8mb4;"
   ```
3. Upload the project (git clone or scp), then:
   ```bash
   npm ci
   cp .env.production.example .env   # fill in real values
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   npm run build
   ```
4. Keep it running with pm2:
   ```bash
   sudo npm i -g pm2
   pm2 start "npm run start" --name awning
   pm2 save && pm2 startup
   ```
5. Put Nginx in front (reverse proxy :80/:443 → :3000) and add HTTPS with
   certbot. Point your domain's DNS at the VPS IP.

---

## Notes
- Generate `AUTH_SECRET` with `openssl rand -base64 32`.
- Email campaigns send only once `SMTP_*` + `EMAIL_FROM` are set.
- Change the superadmin password after first login.
