// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { codeQuickPick } from "./codeQuickPick";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";

let state: {
  server?: ChildProcess;
  waitingForStartup: boolean;
} = { waitingForStartup: true };
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("python-server", "server.py")
  );
  state.server = spawn("python3", [serverModule]);
  state.server.stdout?.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  state.server.on("error", (error) => {
    console.error(`error: ${error}`);
    vscode.window.showErrorMessage(
      "Error starting Codesearch server:\n" + error
    );
    state.waitingForStartup = false;
  });
  state.server.stderr?.on("data", (data) => {
    if (data.toString().includes("INFO")) {
      console.log(data.toString());
    } else {
      console.error(`stderr: ${data}`);
    }
    if (data.toString().includes("Running on http")) {
      state.waitingForStartup = false;
    }
  });
  state.server.on("exit", (code) => {
    console.log("Child process exited with exit code " + code);
    state.waitingForStartup = false;
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "codesearch.openSearchBox",
    () => {
      codeQuickPick(state);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  state.server?.kill("SIGINT");
}
