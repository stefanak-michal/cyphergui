# Contributing to cypherGUI

We appreciate your interest in contributing to cypherGUI! This document outlines the guidelines for contributing code and documentation to the project.

**Prerequisites:**

- Node.js and npm installed on your system.
- Basic understanding of Git version control.
- Familiarity with React.js and TypeScript.

**Development Setup:**

1. Fork the cypherGUI repository on GitHub.
2. Clone your forked repository to your local machine or use Codespace.
3. Navigate to the project directory:

    ```bash
    cd cypherGUI
    ```

4. Install dependencies:

    ```bash
    npm install
    ```

5. Start the development server:

    ```bash
    npm start
    ```

This will start the development server and open the application in your default browser.

**Code Style:**

- We follow standard React code style conventions.
- We use TypeScript for type checking and code clarity. (non-strict)
- Bulma CSS framework is used for styling.
- Prettier is used. `npm run format`

**Contributing Code:**

1. Create a new branch for your feature or bug fix.
2. Make your changes.
3. Test your code.
4. Check your code with prettier and linter.
5. Commit them with descriptive messages.
6. Push your changes to your forked repository.
7. Create a pull request from your forked repository to the upstream cypherGUI repository.

**Pull Request Review:**

- We will review your pull request and provide feedback.
- Address any comments or suggestions before merging your changes.

**Testing:**

- Make sure to check project functionality in your browser.
- Playwright is used. `npx playwright test`
- Verify your change towards different ecosystems (Neo4j, Memgraph, etc.).

**Licensing:**

- All contributions to cypherGUI are assumed to be licensed under the Apache-2.0 License (see LICENSE file).

**Thank You!**

We appreciate your contributions to cypherGUI! By following these guidelines, you can help us improve the project for everyone.
