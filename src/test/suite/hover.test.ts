import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { openAtuinDoc, sleep, hoverToString } from "./helpers";

suite("Hover Provider", () => {
  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("should show hover for top-level options", async () => {
    const content = "search_mode = \"fuzzy\"\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(0, 5);
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        uri,
        position,
      );
      assert.ok(hovers && hovers.length > 0, "Should return hover info");
      const text = hoverToString(hovers);
      assert.ok(
        text.includes("search_mode"),
        `Hover should mention "search_mode", got: ${text}`,
      );
    } finally {
      cleanup();
    }
  });

  test("should show hover for section headers", async () => {
    const content = "[daemon]\nenabled = true\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(0, 3);
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        uri,
        position,
      );
      assert.ok(hovers && hovers.length > 0, "Should return hover for section");
      const text = hoverToString(hovers);
      assert.ok(
        text.includes("daemon"),
        `Hover should mention "daemon", got: ${text}`,
      );
    } finally {
      cleanup();
    }
  });

  test("should show hover for section options with type and default", async () => {
    const content = "[daemon]\ntcp_port = 8889\nsync_frequency = 300\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(1, 3);
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        uri,
        position,
      );
      assert.ok(
        hovers && hovers.length > 0,
        "Should return hover for section option",
      );
      const text = hoverToString(hovers);
      assert.ok(
        text.includes("tcp_port"),
        `Hover should mention "tcp_port", got: ${text}`,
      );
    } finally {
      cleanup();
    }
  });

  test("should NOT show hover for non-atuin content", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atuin-test-"));
    const filePath = path.join(tmpDir, "other.toml");
    fs.writeFileSync(filePath, "key = 42\n", "utf8");
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    await sleep(2000);
    try {
      const position = new vscode.Position(0, 1);
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        uri,
        position,
      );
      const hasAtuinHover =
        hovers &&
        hovers.some((h) => {
          const text = hoverToString([h]);
          return text.includes("Atuin") || text.includes("atuin");
        });
      assert.ok(
        !hasAtuinHover,
        "Non-atuin files should not get atuin hover",
      );
    } finally {
      try {
        fs.unlinkSync(filePath);
        fs.rmdirSync(tmpDir);
      } catch {
        // ignore
      }
    }
  });
});
