import * as vscode from "vscode";
import { AtuinCompletionProvider } from "./providers/completionProvider";
import { AtuinHoverProvider } from "./providers/hoverProvider";
import { AtuinDiagnosticProvider } from "./providers/diagnosticProvider";

const TOML_SELECTOR: vscode.DocumentSelector = {
  language: "toml",
  pattern: "**/atuin/config.toml",
};

export function activate(context: vscode.ExtensionContext): void {
  // Register completion provider
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      TOML_SELECTOR,
      new AtuinCompletionProvider(),
      "[", // trigger on section header
      '"', // trigger inside strings
      "'", // trigger inside strings
      " ", // trigger for value tokens
    ),
  );

  // Register hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      TOML_SELECTOR,
      new AtuinHoverProvider(),
    ),
  );

  // Register diagnostics
  const diagnosticProvider = new AtuinDiagnosticProvider();
  context.subscriptions.push(diagnosticProvider);

  // Log activation
  const outputChannel = vscode.window.createOutputChannel("Atuin Toolkit");
  outputChannel.appendLine("Atuin Toolkit activated");
  context.subscriptions.push(outputChannel);
}

export function deactivate(): void {
  // cleanup handled by disposables
}
