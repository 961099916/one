# Contributing to One AI

First off, thank you for considering contributing to One AI! It's people like you that make One AI such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md) (coming soon).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/zhangjiahao/one/issues) to see if the problem has already been reported.

When you are creating a bug report, please include as many details as possible:
* **Use a clear and descriptive title.**
* **Describe the exact steps which reproduce the problem.**
* **Describe the behavior you observed after following the steps.**
- **Explain which behavior you expected to see instead and why.**
* **Include screenshots or animated GIFs** if helpful.

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://github.com/zhangjiahao/one/issues).

### Pull Requests

* Fill in [the pull request template](.github/PULL_REQUEST_TEMPLATE.md).
* Ensure the test suite passes.
* Follow the project's code style (ESLint + Prettier).
* Update documentation as necessary.

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zhangjiahao/one.git
   cd one
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

4. **Lint and Format**:
   ```bash
   npm run lint
   npm run format
   ```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

## Need Help?

If you have questions, feel free to open an issue or reach out to the maintainers.
