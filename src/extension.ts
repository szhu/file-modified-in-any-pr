import * as vscode from "vscode";
import ExtensionIds from "./ExtensionIds";
import { ChangedFileDb, Pr, PrDb, prUrl } from "./fileModifiedInAnyPr";
import createStatusBarItem from "./ui/createStatusBarItem";
import showStatusMenu from "./ui/showStatusMenu";
import updateForEditor from "./ui/updateForEditor";
import disposeOnDeactivate from "./utils/vscode/disposeOnDeactivate";

export interface ExtContext {
  context: vscode.ExtensionContext;
  statusBarItem: ReturnType<typeof createStatusBarItem>;
  results?: {
    prs: PrDb;
    changedFiles: ChangedFileDb;
    currentBranch: string | undefined;
    currentFile: string;
    prsForCurrentFile: Pr[];
  };
}

export function activate(context: vscode.ExtensionContext) {
  const Ext: ExtContext = {
    context,
    statusBarItem: createStatusBarItem(context),
  };

  disposeOnDeactivate(
    context,
    vscode.commands.registerCommand(ExtensionIds.command.showMenu, async () => {
      if (!Ext.results) {
        return;
      }

      if (Ext.results.prsForCurrentFile.length > 0) {
        const selected = await showStatusMenu(
          Ext,
          Ext.results.prsForCurrentFile,
        );
        if (selected) {
          const url = prUrl(selected, Ext.results.currentFile);
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
      }
    }),
  );

  disposeOnDeactivate(
    context,
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (!editor) {
        return;
      }

      updateForEditor(Ext, editor);
    }),
  );

  if (vscode.window.activeTextEditor) {
    updateForEditor(Ext, vscode.window.activeTextEditor);
  }
}
