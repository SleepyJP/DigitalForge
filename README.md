# Legit

Utilities and scripts to simplify Git and GitHub authentication on Windows.
Legit is a small PowerShell-based CLI toolkit to help Windows users manage Git and GitHub credentials, perform common auth flows (browser and token), store tokens securely in the Windows Credential Manager, and provide convenient helper commands for repository setup.

Table of contents
- About
- Features
- Requirements
- Installation
- Quick start
- Commands
- Examples
- Security & best practices
- Testing & CI
- Contributing
- License

About
-----
Legit aims to reduce friction when working with Git and GitHub on Windows machines by providing:
- Simple helpers for authenticating with `gh` (browser flow or pasted token).
- Secure storage and retrieval of tokens in Windows Credential Manager.
- Convenience commands for repository creation and status checks.
- Small, documented PowerShell functions with unit tests (Pester) and a basic GitHub Actions workflow.

Features
--------
- login: Guide user through `gh` browser auth or read a token.
- login-with-token: Read token from stdin or prompt and save to Credential Manager.
- store-token: Save a token into Windows Credential Manager.
- status: Show current `gh` authentication status.
- create-repo: Create a GitHub repo from the current folder and push initial commit.
- help: Show usage.

Requirements
------------
- Windows 10 or later
- PowerShell 7+ (recommended) or Windows PowerShell 5.1
- Git (tested with git version 2.x)
- GitHub CLI (`gh`) version 2.0+ (the project uses `gh` for many operations)
- Optional: Pester for tests

Installation
------------
Clone or initialize the project and run from PowerShell:

1) From your Projects directory:
```powershell
cd C:\Users\<you>\Projects
git clone https://github.com/SleepyJP/Legit.git
cd Legit
# run functions directly or dot-source the module
Import-Module .\legit.psm1     # (if provided)
```

2) (Optional) You can install as a module or place scripts in a folder on your PATH.

Quick start
-----------
- Browser login (recommended):
  1. Run: .\legit.ps1 login
  2. Choose "Login with a web browser" and follow the gh prompts.

- Token login (when you need a fine-grained PAT or CI token):
  1. Create a Personal Access Token on GitHub (https://github.com/settings/tokens) with the minimum scopes you need.
  2. Run: .\legit.ps1 login-with-token
  3. Paste the token when prompted or pipe it in:
     ```powershell
     Write-Output "PASTE_YOUR_TOKEN" | .\legit.ps1 login-with-token --with-token
     ```

Commands
--------
All commands are implemented as PowerShell functions in legit.ps1 / legit.psm1.

- help
  - Show available commands and usage examples.

- login
  - Interactive: calls `gh auth login` and offers browser flow by default.

- login-with-token [--with-token]
  - Read a token from stdin or prompt and optionally store in Credential Manager.
  - Example (interactive):
    ```powershell
    .\legit.ps1 login-with-token
    ```
  - Example (non-interactive):
    ```powershell
    Get-Content token.txt | .\legit.ps1 login-with-token --with-token
    ```

- store-token --name <credential-name>
  - Store a token value into Windows Credential Manager under a friendly name.

- status
  - Run `gh auth status` and show which account and scopes are available.

- create-repo --private|--public --description "<text>"
  - Create a GitHub repo (via `gh repo create`) for the current folder and push the initial commit.

Examples
--------
Initialize a new local repo and create on GitHub (private):
```powershell
cd C:\Users\SleepyJP\Projects\Legit
git init
git add .
git commit -m "Initial commit"
.\legit.ps1 create-repo --private --description "Utilities to simplify Git and GitHub authentication on Windows"
```

Login with browser flow:
```powershell
.\legit.ps1 login
# follow the gh browser prompts
```

Save a token securely:
```powershell
Write-Output "ghp_XXXXXXXXXXXXXXXXXXXX" | .\legit.ps1 login-with-token --with-token
.\legit.ps1 store-token --name "legit-gh-pat"
```

Security & best practices
-------------------------
- Treat tokens like passwords: never commit them to source control.
- Prefer the browser login flow where possible — it avoids storing long-lived tokens locally.
- When creating a Personal Access Token (PAT), use the minimum scopes required and set a short expiration.
- If your organization uses SSO, remember to authorize your token for that organization.
- Store tokens in Windows Credential Manager, the Git credential helper, or a secrets manager (e.g., GitHub Secrets for Actions, Azure Key Vault) — avoid plaintext files.
- If a secret is accidentally exposed, revoke it immediately via GitHub.

Testing & CI
-----------
- Unit tests are written with Pester (PowerShell).
- A minimal GitHub Actions workflow should run Pester tests on push and PRs.
- Example: .github/workflows/ci.yml runs PowerShell and Pester on Windows-latest.

Contributing
------------
Contributions are welcome. Please:
1. Open an issue describing the feature or bug.
2. Create a branch for your work and open a pull request.
3. Include tests for new functionality and keep changes small and focused.
4. Follow PowerShell best practices and document new functions in the README.

License
-------
MIT — see LICENSE file for details.

Acknowledgements
----------------
Built with the help of GitHub CLI (`gh`) and PowerShell community patterns.

Contact
-------
Open an issue on this repository or contact SleepyJP via your preferred GitHub handle.
