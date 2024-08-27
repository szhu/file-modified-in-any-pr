import * as vscode from "vscode";

export default function disposeOnDeactivate<T extends vscode.Disposable>(
  context: vscode.ExtensionContext,
  disposable: T
): T {
  context.subscriptions.push(disposable);
  return disposable;
}
