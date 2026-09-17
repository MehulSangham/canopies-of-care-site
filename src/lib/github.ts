import { Octokit } from 'octokit';

/**
 * GitHub API client for persisting content changes.
 *
 * In development: falls back to local filesystem (fs) operations.
 * In production (Vercel): uses GitHub API to commit changes.
 *
 * Required env vars for production:
 *   GITHUB_TOKEN — a personal access token with `repo` scope
 *   GITHUB_REPO  — "owner/repo" format, e.g. "MehulSangham/canopies-of-care-site"
 *   GITHUB_BRANCH — branch to commit to (defaults to "main")
 */

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo) return null;

  const [owner, repoName] = repo.split('/');
  const branch = process.env.GITHUB_BRANCH || 'main';

  return { token, owner, repo: repoName, branch };
}

export function isGitHubMode(): boolean {
  return !!getConfig();
}

function getClient() {
  const config = getConfig();
  if (!config) throw new Error('GitHub not configured');
  return { octokit: new Octokit({ auth: config.token }), ...config };
}

/**
 * Read a file from the repo.
 * Returns { content, sha } or null if not found.
 */
export async function readFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const { octokit, owner, repo, branch } = getClient();

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    if ('content' in data && data.type === 'file') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content, sha: data.sha };
    }
    return null;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Write (create or update) a file in the repo.
 */
export async function writeFile(
  filePath: string,
  content: string,
  message: string,
): Promise<void> {
  const { octokit, owner, repo, branch } = getClient();

  // Check if file exists to get SHA for updates
  const existing = await readFile(filePath);

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(existing ? { sha: existing.sha } : {}),
  });
}

/**
 * Write a binary file (e.g., image) to the repo.
 */
export async function writeBinaryFile(
  filePath: string,
  buffer: Buffer,
  message: string,
): Promise<void> {
  const { octokit, owner, repo, branch } = getClient();

  const existing = await readFile(filePath);

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: buffer.toString('base64'),
    branch,
    ...(existing ? { sha: existing.sha } : {}),
  });
}
