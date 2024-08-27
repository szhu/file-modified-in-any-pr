import * as vscode from "vscode";
import disposeOnDeactivate from "../utils/vscode/disposeOnDeactivate";
import ExtensionIds from "../ExtensionIds";

export default function createStatusBarItem(context: vscode.ExtensionContext) {
  const statusBarItem = disposeOnDeactivate(
    context,
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  );

  statusBarItem.command = ExtensionIds.command.showMenu;

  function update(text: string) {
    statusBarItem.text = text;
    statusBarItem.show();
  }

  return {
    update,
  };
}
