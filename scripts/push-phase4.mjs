import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const OWNER = "crosscurrentdigital";
const REPO = "scriptloop";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN not set");

const API = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "scriptloop-agent",
};

async function gh(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const REPO_ROOT = resolve(process.cwd());
const FILES = [
  "artifacts/scriptloop/src/App.tsx",
  "artifacts/scriptloop/src/components/AudioPlayer.tsx",
  "artifacts/scriptloop/src/pages/NotFoundPage.tsx",
  "artifacts/scriptloop/src/pages/ScriptDetailPage.tsx",
  "artifacts/scriptloop/src/pages/ScriptEditorPage.tsx",
];

const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const baseSha = ref.object.sha;
const baseCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
const baseTree = baseCommit.tree.sha;

const treeEntries = [];
for (const path of FILES) {
  const content = await readFile(resolve(REPO_ROOT, path), "utf8");
  const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content, encoding: "utf-8" }),
  });
  treeEntries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
}

const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: "POST",
  body: JSON.stringify({ base_tree: baseTree, tree: treeEntries }),
});

const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: "POST",
  body: JSON.stringify({
    message:
      "Phase 4: Dedicated script detail/playback page\n\n- Extract AudioPlayer component from inline LoopPlayer\n- New ScriptDetailPage at /scripts/:id (read-only playback)\n- Move editor to /scripts/:id/edit\n- After saving a new script, redirect to /scripts/:id/edit\n- Add 404 NotFoundPage for unknown routes",
    tree: tree.sha,
    parents: [baseSha],
  }),
});

await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  method: "PATCH",
  body: JSON.stringify({ sha: commit.sha, force: false }),
});

console.log(`Pushed commit ${commit.sha}`);
