# GitHub Co-Pilot Agent (DigitalForge)

Overview:
- This agent runs as a GitHub Action in DigitalForge and authenticates as a GitHub App.
- It iterates repos the App is installed on, creates a small SYNC_NOTE.md on a new branch, and opens a PR for review.

Required secrets (set in DigitalForge repo Settings  Secrets  Actions):
- GITHUB_APP_ID        : numeric GitHub App ID
- GITHUB_APP_PRIVATE_KEY : private key PEM for the GitHub App (string or base64-encoded)
Optional:
- GITHUB_TOKEN : fallback token if you want to call other endpoints outside the app installation

How to create the GitHub App (quick guide):
1) Go to https://github.com/settings/apps and click "New GitHub App"
2) App name: DigitalForge-CoPilot (or similar)
3) Permissions (minimal):
   - Repository: Contents: Read & write
   - Repository: Pull requests: Read & write
   - Repository: Issues: Read & write
4) Create the app, generate a private key (.pem), and install it on the repos/org.
5) Add the GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY secrets to DigitalForge.

Run:
- Merge the workflow to main and run the Action manually (workflow_dispatch) or wait for the schedule.
