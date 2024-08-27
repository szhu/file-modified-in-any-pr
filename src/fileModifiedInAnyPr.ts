import crypto from "crypto";
import * as vscode from "vscode";
import { ExtContext } from "./extension";
import { $lines } from "./utils/execa/shell";

export interface Pr {
  owner: string;
  repo: string;
  number: number;
  title: string;
  commit: string;
  branch: string;
}

export interface PrDb {
  [branch: string]: Pr;
}

interface ChangedFile {
  branch: string;
  path: string;
}

export interface ChangedFileDb {
  [path: string]: string[] | undefined;
}

async function getPrsByBranches(cwd: string) {
  const responseText = (
    await $lines(
      [
        "gh",
        "pr",
        "list",
        "--json",
        "title,headRepositoryOwner,headRepository,number,headRefName,headRefOid",
      ],
      { cwd },
    )
  ).join();
  const responseJson = JSON.parse(responseText);
  return Object.fromEntries<Pr>(
    responseJson.map((prJson: any) => {
      const branchRef = prJson.headRefName;
      const pr: Pr = {
        branch: branchRef,
        owner: prJson.headRepositoryOwner.login,
        repo: prJson.headRepository.name,
        number: prJson.number,
        title: prJson.title,
        commit: prJson.headRefOid,
      };
      return [branchRef, pr];
    }),
  );
}

async function getChangedFiles(cwd: string, branch: string) {
  return await $lines(
    ["git", "diff", "--name-only", branch, "refs/remotes/origin/main"],
    { cwd },
  );
}

async function* getAllChangedFiles(cwd: string, branches: string[]) {
  for (const branch of branches) {
    for (const path of await getChangedFiles(
      cwd,
      "refs/remotes/origin/" + branch,
    )) {
      yield { branch, path } as ChangedFile;
    }
  }
}

function insertChangedFile(db: ChangedFileDb, file: ChangedFile) {
  if (db[file.path] == null) {
    db[file.path] = [];
  }

  db[file.path]!.push(file.branch);
}

async function makeChangedFilesDb(cwd: string, branches: string[]) {
  const db: ChangedFileDb = {};
  for await (const changedFile of getAllChangedFiles(cwd, branches)) {
    insertChangedFile(db, changedFile);
  }
  return db;
}

async function currentBranchRef(cwd: string) {
  const [branch] = await $lines(["git", "symbolic-ref", "--short", "HEAD"], {
    cwd,
  });
  return branch;
}

export default async function fileModifiedInAnyPr(
  cwdUri: vscode.Uri,
  uri: vscode.Uri,
): Promise<NonNullable<ExtContext["results"]>> {
  const relativePath = vscode.workspace.asRelativePath(uri);

  const prs = await getPrsByBranches(cwdUri.fsPath);
  const branches = Object.keys(prs);
  await $lines(["git", "fetch", "origin"], { cwd: cwdUri.fsPath });
  const changedFiles = await makeChangedFilesDb(cwdUri.fsPath, branches);

  const prsModified =
    changedFiles[relativePath]?.flatMap((branch) => {
      const pr = prs[branch];
      return pr ? [pr] : [];
    }) ?? [];

  return {
    prs,
    changedFiles,
    currentBranch: await currentBranchRef(cwdUri.fsPath),
    currentFile: relativePath,
    prsForCurrentFile: prsModified,
  };
}

export function prUrl(pr: Pr, path: string) {
  const hash = crypto.createHash("sha256").update(path).digest("hex");

  return `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}/files#diff-${hash}`;
}

function fileHistoryAtUrl(pr: Pr, path: string) {
  return `https://github.com/${pr.owner}/${pr.repo}/commits/${pr.commit.slice(
    0,
    7,
  )}/${path}`;
}
