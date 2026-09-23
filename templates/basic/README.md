# Mercur Basic Template

This template comes configured with the bare minimum to get started building your marketplace with Mercur.

## Quick Start

This fork includes a Docker Compose file for PostgreSQL and Redis. The API and dashboards run from the VS Code terminal, so you can edit the code and see changes without building application containers.

### Requirements

- Docker Desktop (or Docker Engine with the Compose plugin)
- Node.js 20 or newer
- Bun 1.3.11 or newer
- Git

### Run the Didar preview

Clone the Persian preview branch, then open the repository in VS Code:

```bash
git clone --branch didar/persian-preview https://github.com/alirezasefidpour747/mercur.git
cd mercur
code .
```

In the VS Code terminal, go to the runnable starter template:

```bash
cd templates/basic
docker compose up -d
```

Copy the environment template. On macOS/Linux use `cp`; in PowerShell use `Copy-Item`:

```bash
cp packages/api/.env.template packages/api/.env
```

Then install dependencies, migrate and seed the demo database, and start the development apps:

```bash
bun install
cd packages/api
bunx medusa db:migrate
bun run seed
cd ../..
bun dev
```

Open the panels:

- API: `http://localhost:9000`
- Admin: `http://localhost:7000`
- Vendor: `http://localhost:7001`

Follow the Admin panel's first-run instructions to create an admin user. The seeded demo login for the Vendor panel is `seller@mercur.dev` / `supersecret`.

The seeded catalog is Mercur's generic footwear demo data; it is not Didar's gold catalog or business workflow. This setup is for inspecting the starter's screens and marketplace foundation.

To stop the database containers while keeping their data, run `docker compose down`. To start them again, run `docker compose up -d`.

## What's Inside

This monorepo includes the following packages and apps:

### Apps and Packages

- `packages/api` - The Medusa backend with all marketplace functionality
- `apps/admin` - Admin dashboard customizations
- `apps/vendor` - Vendor portal customizations

### Project Structure

```
├── apps/
│   ├── admin/          # Admin dashboard extensions
│   └── vendor/         # Vendor portal extensions
├── packages/
│   └── api/            # Medusa backend
│       ├── src/
│       │   ├── api/         # Custom API routes
│       │   ├── jobs/        # Background jobs
│       │   ├── links/       # Module links
│       │   ├── modules/     # Custom modules
│       │   ├── scripts/     # CLI scripts
│       │   ├── subscribers/ # Event subscribers
│       │   └── workflows/   # Business workflows
│       └── medusa-config.ts
├── blocks.json         # Mercur blocks configuration
├── package.json
└── turbo.json
```

### Utilities

This project has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Turborepo](https://turborepo.dev/) for monorepo management
- [Prettier](https://prettier.io) for code formatting

## How It Works

The Mercur basic template is built on top of [Medusa](https://medusajs.com) and is pre-configured for marketplace functionality.

### Modules

Custom modules allow you to extend the core functionality. See the [Modules](https://docs.medusajs.com/learn/fundamentals/modules) docs for details.

### Workflows

Workflows define multi-step business processes. See the [Workflows](https://docs.medusajs.com/learn/fundamentals/workflows) docs for details.

### API Routes

Custom API routes expose HTTP endpoints. See the [API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes) docs for details.

### Links

Links define relationships between modules. See the [Links](https://docs.medusajs.com/learn/fundamentals/links) docs for details.

## Adding Blocks

You can extend your project with pre-built blocks using the Mercur CLI:

```bash
bunx @mercurjs/cli add block-name
```

Configure your block sources in `blocks.json`:

```json
{
  "aliases": {
    "workflows": "packages/api/src/workflows",
    "links": "packages/api/src/links",
    "api": "packages/api/src/api",
    "modules": "packages/api/src/modules"
  },
  "registries": {}
}
```

## Build

To build all apps and packages:

```bash
bun run build
```

## AI agents

This project bundles its documentation as a dependency (`@mercurjs/docs`), so AI agents can read it offline and version-matched to your installed packages. Point your agent at:

- `node_modules/@mercurjs/docs/llms.txt` — an index of every page
- `node_modules/@mercurjs/docs/content/**/*.mdx` — the full pages

`CLAUDE.md` and `AGENTS.md` instruct agents to read these before making changes. The same docs are online at [docs.mercurjs.com](https://docs.mercurjs.com).

## Questions

If you have any issues or questions start a [GitHub discussion](https://github.com/mercurjs/mercur/discussions).
