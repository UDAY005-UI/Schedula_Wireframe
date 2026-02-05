# Schedula_Wireframe

Loom video link for the er-diagram explanation: https://www.loom.com/share/8bd396fc9e83488289aaaa73b8136526

Database Setup & Prisma Usage Guide

This project uses PostgreSQL + Prisma ORM for database management.

Prerequisites

Node.js v18+

npm / pnpm / yarn

PostgreSQL (local install or Docker)

Project dependencies installed

Running database instance

.env file configured

Install dependencies:

npm install
or
pnpm install

Environment Configuration

Create a .env file in the project root:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

Example:

DATABASE_URL="postgresql://nimbus:nimbus@localhost:5432/nimbus"

Make sure:

database is running

username/password are correct

port is correct (default Postgres = 5432)

Check Database Connection

Run any one of these:

Quick connection test:
npx prisma db pull

Open database UI:
npx prisma studio

Migration test:
npx prisma migrate dev --name test

If these run without errors → DB connection is working.

Core Prisma Commands

Generate Prisma Client (run after schema changes):
npx prisma generate

Create and apply migration:
npx prisma migrate dev --name <migration-name>

Example:
npx prisma migrate dev --name init-schema

Push schema without migration history (dev only):
npx prisma db push

Reset database (⚠ deletes all data):
npx prisma migrate reset

Pull database schema into Prisma:
npx prisma db pull

Open Prisma Studio:
npx prisma studio