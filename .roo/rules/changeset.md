# Changesets Workflow Guidelines

Use Changesets to track meaningful, user- or workflow-impacting changes. Add a changeset file if you:

- Add features, bug fixes, breaking changes, major refactors, public documentation updates, dependency or build/tooling changes.

Do not add a changeset for:
- Internal docs only
- Trivial code cleanup/comments/typos
- Test refactoring only
- Local/personal config

**Workflow:**
1. Stage your work: `git add .`
2. Run: `npm run changeset` or `npx changeset add`
3. Select affected package(s), bump type (Patch, Minor, Major), and write a changelog summary (concise, imperative, user-facing, not a commit message).
4. Stage and commit: `git add .changeset/*.md`, then `git commit -m "feat(...): ..."`
5. `.changeset/*.md` drives automatic changelogs and versioning on release.

**Best practices:**
- Provide a concise summary for users (changelog) AND a detailed Git commit message for maintainers.
- Only add a changeset for changes that concern users/contributors following public docs.

**Release:**  
On release, changesets files are processed to update `package.json` and `CHANGELOG.md`, then deleted.
