// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { codeQuickPick } from "./codeQuickPick";
import * as path from "path";
import { ChildProcess, spawn, exec } from "child_process";
import * as tcpPortUsed from "tcp-port-used";
import * as fs from "fs";

let state: {
  server?: ChildProcess;
  waitingForStartup: boolean;
} = { waitingForStartup: true };

let serverStatusBar: vscode.StatusBarItem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  serverStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  serverStatusBar.text = "$(sync~spin) Starting Codesearch Server...";
  serverStatusBar.show();

  const isPortBusy = await tcpPortUsed.check(2633);
  if (isPortBusy) {
    finishServerStart();
  } else {
    await startServer(context);
  }

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

function finishServerStart() {
  state.waitingForStartup = false;
  serverStatusBar.hide();
}

function fileExists(context: vscode.ExtensionContext, path: string) {
  return new Promise((resolve, reject) => {
    fs.stat(context.asAbsolutePath(path), (err, stat) => {
      if (err == null) {
        resolve(true);
      } else if (err.code === "ENOENT") {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

function asyncExec(command: string) {
  return new Promise<void>((resolve, reject) => {
    exec(command, (err) => {
      if (err == null) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

async function startServer(context: vscode.ExtensionContext) {
  let firstUse = false;
  try {
    firstUse = !(await fileExists(
      context,
      path.join("python-server", "transformers")
    ));
    if (firstUse) {
      vscode.window.showInformationMessage(
        "Installing Codesearch model and dependencies, this will take a few minutes"
      );

      const requirements = context.asAbsolutePath(
        path.join("python-server", "requirements.txt")
      );
      const requirementsTarget = context.asAbsolutePath("python-server");
      await asyncExec(
        `pip3 install -r ${requirements} --target=${requirementsTarget}`
      );

      const nlp = context.asAbsolutePath(path.join("python-server", "nlp.py"));
      await asyncExec(`python3 ${nlp}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage("Error installing Codesearch:\n" + error);
    finishServerStart();
    return;
  }
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
    finishServerStart();
  });
  state.server.stderr?.on("data", (data) => {
    if (data.toString().includes("INFO")) {
      console.log(data.toString());
    } else {
      console.error(`stderr: ${data}`);
    }
    if (data.toString().includes("Running on http")) {
      if (firstUse) {
        vscode.window.showInformationMessage("Codesearch is ready to use!");
      }
      finishServerStart();
    }
  });
  state.server.on("exit", (code) => {
    console.log("Child process exited with exit code " + code);
    finishServerStart();
  });
}
