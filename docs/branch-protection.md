# Branch Protection Guidance

To keep `main` stable, configure branch protection in GitHub with these minimum rules:

1. **Require a pull request before merging**.
2. **Require status checks to pass before merging** and select:
   - `Lint and Docs Checks`
   - `Build and Test`
3. **Require branches to be up to date before merging**.
4. **Require at least 1 approving review**.
5. **Dismiss stale pull request approvals when new commits are pushed**.
6. **Restrict who can push to matching branches** (optional but recommended for small teams).

These protections ensure CI is enforced for every change while the project is early-stage and evolving.
