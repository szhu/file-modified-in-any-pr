import * as vscode from "vscode";
import { ExtContext } from "../extension";
import fileModifiedInAnyPr from "../fileModifiedInAnyPr";

export default async function updateForEditor(
  Ext: ExtContext,
  editor: vscode.TextEditor,
) {
  const document = editor.document;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return;
  }

  Ext.statusBarItem.update("Checking...");
  try {
    Ext.results = await fileModifiedInAnyPr(workspaceFolder.uri, document.uri);
  } catch (error) {
    vscode.window.showErrorMessage(`Error: ${error}`);
    Ext.statusBarItem.update("Error");
    return;
  }

  if (Ext.results.prsForCurrentFile.length > 0) {
    const text = `Modified in: ${Ext.results.prsForCurrentFile.map((pr) => `#${pr.number}`).join(" ")}`;
    Ext.statusBarItem.update(text);
  } else {
    Ext.statusBarItem.update("No conflicts.");
  }
}
