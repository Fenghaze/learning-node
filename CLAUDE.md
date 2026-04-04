# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning repository for Node.js server-side development, containing demo projects.

### account-book

An Express + EJS-based accounting/bookkeeping application.

**Stack:**
- Express 4.16.1 - Web framework
- EJS - Template engine
- Multer - File upload
- Formidable - Form data parsing
- Morgan - HTTP logging middleware
- Cookie-Parser - Cookie parsing

**Start the server:**
```bash
cd account-book
npm install  # if not already installed
npm start
```
Server runs on port 3000 by default.

## Architecture

**Entry point:** [bin/www](account-book/bin/www) - Creates HTTP server and listens on port

**App setup:** [app.js](account-book/app.js) - Express app configuration (middleware, view engine, routes)

**Data layer:** [data/accounts.js](account-book/data/accounts.js) - In-memory data store backed by JSON file at `data/accounts.json`
- CRUD operations: `getAll`, `getById`, `add`, `update`, `remove`
- Statistics: `getStats` (income/expense/balance), `getCategoryStats`

**Routes:** [routes/index.js](account-book/routes/index.js) - All route handlers
- `GET /` - List all accounts with stats
- `POST /add` - Add new account
- `GET /edit/:id` - Edit page
- `POST /edit/:id` - Submit edit
- `GET /delete/:id` - Delete account

**Views:** EJS templates in [views/](account-book/views/)
- `index.ejs` - Main list page
- `edit.ejs` - Edit form
- `error.ejs` - Error page

**Static files:** Served from [public/](account-book/public/)
