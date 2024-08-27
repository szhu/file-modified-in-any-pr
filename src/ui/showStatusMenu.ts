import * as vscode from "vscode";
import { ExtContext } from "../extension";
import { Pr } from "../fileModifiedInAnyPr";
import disposeOnDeactivate from "../utils/vscode/disposeOnDeactivate";

class Item implements vscode.QuickPickItem {
  pr: Pr;
  label: string;
  description: string;

  constructor(pr: Pr) {
    this.pr = pr;
    this.label = `PR #${pr.number}`;
    this.description = pr.title;
  }
}

export default async function showStatusMenu(Ext: ExtContext, prs: Pr[]) {
  const CancellationTokenSource = new vscode.CancellationTokenSource();
  disposeOnDeactivate(Ext.context, {
    dispose: () => CancellationTokenSource.cancel(),
  });

  const selected = await vscode.window.showQuickPick(
    prs.map((pr) => new Item(pr)),
    {
      placeHolder:
        "This file was modified in these PRs and may have merge conflicts.",
    },
    CancellationTokenSource.token,
  );

  return selected?.pr;
}
