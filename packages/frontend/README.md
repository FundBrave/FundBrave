# FundBrave Frontend

This is the frontend for FundBrave, a Next.js application.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [pnpm](https://pnpm.io/installation)

## Installation

1.  Clone the repository.
2.  Navigate to the `packages/frontend` directory.
3.  Install the dependencies using pnpm:

    ```bash
    pnpm install
    ```

## Running the Development Server

To start the development server, run the following command:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Creates a production build.
- `pnpm start`: Starts a production server.
- `pnpm lint`: Lints the codebase using ESLint.

## Project Structure

The project uses the Next.js App Router. Here is a brief overview of the directory structure:

- `app/`: Contains the application's pages, components, and layouts.
- `app/components/`: Shared and reusable React components.
- `app/lib/`: Utility functions and libraries.
- `app/theme/`: Theme-related components and configuration.
- `public/`: Static assets like images and fonts.
- `eslint.config.mjs`: ESLint configuration.
- `next.config.js`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.

## Theming

The project uses a custom theming solution located in the `app/theme` directory. You can toggle between light and dark themes using the theme toggle component.

## Linting and Code Style

This project uses ESLint for linting. To check for linting errors, run:

```bash
pnpm lint
```
