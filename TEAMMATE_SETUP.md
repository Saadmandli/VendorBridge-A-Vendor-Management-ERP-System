# Running VendorBridge on your PC (teammate setup)

The app uses a **shared Neon cloud database** that's already filled with demo data —
so once you run it, every page is populated and matches everyone else.

## You need (one time)
- **Node.js** — download the LTS version from https://nodejs.org and install it.
- **Git** — from https://git-scm.com/download/win (Windows).

## Steps

1. **Get the code.** Open a terminal (on Windows: open any folder, type `cmd` in the
   address bar, Enter) and run:
   ```
   git clone https://github.com/Saadmandli/odoo-hackathon-2026.git
   cd odoo-hackathon-2026
   ```
   (If the project is in a subfolder like `vendorbridge`, `cd` into that.)

2. **Create your .env** (this connects you to the database and AI Copilot):
   ```
   copy .env.example .env
   ```
   (Mac/Linux: `cp .env.example .env`)

   > **Note for AI Copilot**: Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set in your `.env` or `.env.local` to enable the Gemini AI Copilot assistant.

3. **Install and run:**
   ```
   npm install --legacy-peer-deps
   npm run dev:local
   ```
   *(Or on Windows, simply double-click `run.bat`)*

4. Open **http://localhost:3000** and log in:

   | Email | Password | Role |
   |-------|----------|------|
   | admin@vendorbridge.com | password123 | Enterprise Admin |
   | buyer@vendorbridge.com | password123 | Procurement Buyer |
   | buyer2@vendorbridge.com | password123 | Operations Buyer |
   | vendor@techno.com | password123 | Technology Supplier |
   | vendor@prime.com | password123 | Prime Industrial Supplier |

## Important
- **`npm run dev:local`** (or double-clicking **`run.bat`**) automatically boots the local database, ensures all demo data is populated, and starts the website on port 3000.
- Keep the terminal window open while using the app; stop it with **Ctrl + C**.
