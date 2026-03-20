import * as assert from "assert";
import * as vscode from "vscode";
import { openAtuinDoc } from "./helpers";

suite("Completion Provider", () => {
  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("should provide top-level option completions", async () => {
    const content = "# atuin config\n\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(1, 0);
      const completions =
        await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          uri,
          position,
        );
      assert.ok(completions, "Completions should be returned");
      const labels = completions.items.map((item) =>
        typeof item.label === "string" ? item.label : item.label.label,
      );
      assert.ok(
        labels.includes("db_path"),
        `Should include "db_path", got: ${labels.join(", ")}`,
      );
      assert.ok(
        labels.includes("search_mode"),
        `Should include "search_mode"`,
      );
      assert.ok(
        labels.includes("auto_sync"),
        `Should include "auto_sync"`,
      );
      assert.ok(
        labels.includes("filter_mode"),
        `Should include "filter_mode"`,
      );
    } finally {
      cleanup();
    }
  });

  test("should provide section name completions", async () => {
    const content = "[\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(0, 1);
      const completions =
        await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          uri,
          position,
        );
      assert.ok(completions, "Completions should be returned");
      const labels = completions.items.map((item) =>
        typeof item.label === "string" ? item.label : item.label.label,
      );
      const expected = ["daemon", "sync", "search", "stats", "keys", "preview"];
      for (const section of expected) {
        assert.ok(
          labels.includes(section),
          `Should include section "${section}", got: ${labels.join(", ")}`,
        );
      }
    } finally {
      cleanup();
    }
  });

  test("should provide options inside [daemon] section", async () => {
    const content = "[daemon]\n\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(1, 0);
      const completions =
        await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          uri,
          position,
        );
      assert.ok(completions, "Completions should be returned");
      const labels = completions.items.map((item) =>
        typeof item.label === "string" ? item.label : item.label.label,
      );
      const expected = ["enabled", "autostart", "sync_frequency", "tcp_port", "systemd_socket"];
      for (const opt of expected) {
        assert.ok(
          labels.includes(opt),
          `Should include option "${opt}" in [daemon], got: ${labels.join(", ")}`,
        );
      }
    } finally {
      cleanup();
    }
  });

  test("should provide enum value completions for search_mode", async () => {
    const content = 'search_mode = "';
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(0, 15);
      const completions =
        await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          uri,
          position,
        );
      assert.ok(completions, "Completions should be returned");
      const labels = completions.items.map((item) =>
        typeof item.label === "string" ? item.label : item.label.label,
      );
      const expected = ["prefix", "fulltext", "fuzzy", "skim"];
      for (const val of expected) {
        assert.ok(
          labels.includes(val),
          `Should include search_mode value "${val}", got: ${labels.join(", ")}`,
        );
      }
    } finally {
      cleanup();
    }
  });

  test("completions should have documentation", async () => {
    const content = "# config\n\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const position = new vscode.Position(1, 0);
      const completions =
        await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          uri,
          position,
          undefined,
          10,
        );
      assert.ok(completions, "Completions should be returned");
      const searchModeItem = completions.items.find((item) => {
        const label =
          typeof item.label === "string" ? item.label : item.label.label;
        return label === "search_mode";
      });
      assert.ok(searchModeItem, 'Should find "search_mode" completion item');
      assert.ok(
        searchModeItem.documentation || searchModeItem.detail,
        '"search_mode" completion should have documentation or detail',
      );
    } finally {
      cleanup();
    }
  });
});
