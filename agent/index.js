// Minimal GitHub co-pilot agent (example).
const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

const APP_ID = process.env.GITHUB_APP_ID;
let PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY || process.env.APP_PRIVATE_KEY;
const ORG = process.env.ORG || "SleepyJP";
const TARGET_GLOB = process.env.TARGET_REPO_GLOB || "*";
const PR_BRANCH_PREFIX = process.env.PR_BRANCH_PREFIX || "co-pilot/sync-";
const PR_BASE = process.env.PR_BASE || "main";

if (!APP_ID || !PRIVATE_KEY) {
  console.error("Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY. Exiting.");
  process.exit(1);
}
if (!PRIVATE_KEY.includes("BEGIN") && /^[A-Za-z0-9+/=]+$/.test(PRIVATE_KEY)) {
  try { PRIVATE_KEY = Buffer.from(PRIVATE_KEY, "base64").toString("utf8"); } catch (e) {}
}

async function authAsInstallation(installationId) {
  const auth = createAppAuth({ id: Number(APP_ID), privateKey: PRIVATE_KEY });
  const installationAuth = await auth({ type: "installation", installationId });
  return new Octokit({ auth: installationAuth.token });
}

async function main() {
  try {
    const auth = createAppAuth({ id: Number(APP_ID), privateKey: PRIVATE_KEY });
    const appAuth = await auth({ type: "app" });
    const octokitApp = new Octokit({ auth: appAuth.token });

    let installation;
    try {
      const instRes = await octokitApp.request("GET /orgs/{org}/installation", { org: ORG });
      installation = instRes.data;
    } catch (e) {
      try {
        const instRes2 = await octokitApp.request("GET /users/{username}/installation", { username: ORG });
        installation = instRes2.data;
      } catch (e2) {
        console.error("App not installed for org/user:", ORG, e.message || e2);
        process.exit(2);
      }
    }

    const installationId = installation.id;
    const octokit = await authAsInstallation(installationId);

    const repos = [];
    for await (const response of octokit.paginate.iterator(octokit.rest.apps.listRepos.endpoint.merge({}))) {
      for (const r of response.data.repositories) {
        if (TARGET_GLOB === "*" || r.name.includes(TARGET_GLOB)) repos.push(r);
      }
    }

    console.log(`Agent running for ${repos.length} repos in ${ORG}`);

    for (const repo of repos) {
      try {
        console.log(`Processing ${repo.full_name}`);
        const owner = repo.owner.login;
        const repoName = repo.name;
        const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo: repoName });
        const defaultBranch = repoInfo.default_branch || PR_BASE;
        const branchName = `${PR_BRANCH_PREFIX}${Date.now()}`;

        const { data: baseRef } = await octokit.rest.git.getRef({ owner, repo: repoName, ref: `heads/${defaultBranch}` });
        const baseSha = baseRef.object.sha;

        await octokit.rest.git.createRef({ owner, repo: repoName, ref: `refs/heads/${branchName}`, sha: baseSha });

        const path = "SYNC_NOTE.md";
        const contentText = `Automated sync note from co-pilot at ${new Date().toISOString()}\n\nRepository: ${repo.full_name}\n`;
        const contentBase64 = Buffer.from(contentText, "utf8").toString("base64");

        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path,
          message: "chore(co-pilot): stamp sync note",
          content: contentBase64,
          branch: branchName,
        });

        const prTitle = `co-pilot: automated sync for ${repoName}  ${new Date().toISOString()}`;
        const prBody = `This PR was created automatically by the co-pilot agent to keep the repository in sync. Review required from your CODEOWNERS.`;

        const { data: pr } = await octokit.rest.pulls.create({
          owner,
          repo: repoName,
          head: branchName,
          base: defaultBranch,
          title: prTitle,
          body: prBody,
          maintainer_can_modify: false,
        });

        console.log(`Opened PR ${pr.html_url} on ${repo.full_name}`);
      } catch (innerErr) {
        console.error(`Error on repo ${repo.full_name}:`, innerErr.message || innerErr);
        try {
          await octokit.rest.issues.create({
            owner: repo.owner.login,
            repo: repo.name,
            title: "co-pilot agent: error while processing repo",
            body: `co-pilot encountered an error: ${innerErr.message || JSON.stringify(innerErr)}\n\nPlease check app permissions and logs.`,
          });
        } catch (issueErr) {
          console.error("Failed to create issue:", issueErr.message || issueErr);
        }
      }
    }

    console.log("Agent run complete.");
  } catch (err) {
    console.error("Fatal agent error:", err);
    process.exit(1);
  }
}

main();
