# Contributing to RoboSystems TypeScript Client

Thank you for your interest in contributing to the RoboSystems TypeScript Client! This is the official TypeScript/JavaScript SDK for interacting with the RoboSystems API.

## Community

- **[Discussions](https://github.com/orgs/RoboFinSystems/discussions)** - Questions, ideas, and general conversation
- **[Project Board](https://github.com/orgs/RoboFinSystems/projects/3)** - Track work across all RoboSystems repositories
- **[Wiki](https://github.com/RoboFinSystems/robosystems/wiki)** - Architecture docs and guides

## Table of Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Publishing](#publishing)
- [Security](#security)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/robosystems-typescript-client.git
   cd robosystems-typescript-client
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/RoboFinSystems/robosystems-typescript-client.git
   ```
4. **Set up your development environment** (see [Development Setup](#development-setup))

## Development Process

We use GitHub flow for our development process:

1. Create a feature branch from `main`
2. Make your changes in small, atomic commits
3. Write or update tests for your changes
4. Update documentation as needed
5. Create a PR to the `main` branch

### Branch Naming

Use descriptive branch names:

- `feature/add-new-method` - New features
- `bugfix/fix-auth-error` - Bug fixes
- `chore/update-deps` - Maintenance tasks

**Note:** All PRs must target the `main` branch only.

## How to Contribute

### Issue Types

We use issue templates to organize work:

| Type | When to Use |
|------|-------------|
| **Bug** | Defects or unexpected behavior |
| **Task** | Specific, bounded work that fits in one PR |
| **Feature** | Request a new capability (no design required) |
| **RFC** | Propose a design for discussion before implementation |
| **Spec** | Approved implementation plan ready for execution |

### Reporting Bugs

Before creating a bug report, check existing issues to avoid duplicates. Include:

- Steps to reproduce the issue
- Expected vs actual behavior
- SDK version
- Node.js/browser version
- Relevant error messages and stack traces

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted`. These are great starting points for new contributors.

## Development Setup

### Prerequisites

- Node.js 22.x+ (check `.nvmrc`)
- npm 10.x+
- Git configured with your GitHub account

### Local Development Environment

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the project**:

   ```bash
   npm run build
   ```

3. **Run tests**:

   ```bash
   npm test
   ```

### Code Generation

Parts of this SDK are auto-generated from the OpenAPI spec. To regenerate:

```bash
npm run generate
```

**Important:** Don't manually edit generated files (`*.gen.ts`). Instead, modify the generation templates or the source OpenAPI spec.

## Coding Standards

### TypeScript Code Style

- **Formatter**: Prettier with configuration
- **Linter**: ESLint
- **Type checking**: TypeScript strict mode

Run code quality checks:

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier
npm run typecheck     # TypeScript type checking
```

### Commit Messages

Follow the Conventional Commits specification:

```
type(scope): subject
```

Types:

- `feat`: New feature (new method, type, etc.)
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

Examples:

```
feat(graphs): add createGraph method
fix(auth): resolve token refresh issue
docs(readme): update usage examples
```

### SDK Design Guidelines

When adding new methods:

- Follow existing naming conventions
- Provide comprehensive TypeScript types
- Include JSDoc comments with examples
- Handle errors consistently
- Support both Promise and async/await patterns

## Testing

### Test Requirements

- All new methods must include tests
- Bug fixes should include regression tests
- Tests must pass locally before submitting PR

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Pull Request Process

### Before Creating a PR

1. **Commit all changes**:

   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

2. **Update from upstream**:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Run all checks locally**:

   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Push your branch**:
   ```bash
   git push origin your-branch-name
   ```

### PR Requirements

- All tests must pass
- Code must pass linting and formatting checks
- Must include appropriate documentation updates
- Must be reviewed by at least one maintainer

### Manual PR Creation

```bash
gh pr create --base main --title "Your PR title" --body "Your PR description"
```

## Publishing

This package is published to npm as `@robosystems/client`. Releases are managed by maintainers:

```bash
# Version bump (patch/minor/major)
npm version patch

# Publish to npm
npm publish
```

**Note:** Only maintainers can publish new versions.

## Security

### Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security@robosystems.ai with details
2. Include steps to reproduce if possible
3. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

- Never commit API keys or secrets
- Never log sensitive data
- Validate inputs before sending to API
- Keep dependencies up to date

## Questions and Support

- **[GitHub Discussions](https://github.com/orgs/RoboFinSystems/discussions)** - Best place for questions and community conversation
- **[GitHub Issues](https://github.com/RoboFinSystems/robosystems-typescript-client/issues)** - Bug reports and feature requests for this repo
- **[API Reference](https://api.robosystems.ai/docs)** - Backend API documentation
- **Email**: security@robosystems.ai for security issues only

## Recognition

Contributors will be recognized in our [Contributors](https://github.com/RoboFinSystems/robosystems-typescript-client/graphs/contributors) page.

Thank you for contributing to RoboSystems TypeScript Client!
