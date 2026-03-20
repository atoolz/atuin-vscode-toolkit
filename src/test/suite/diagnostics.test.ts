import * as assert from "assert";
import * as vscode from "vscode";
import { openAtuinDoc, sleep } from "./helpers";

suite("Diagnostics Provider", () => {
  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sleep(500);
  });

  test("should warn about unknown top-level options", async () => {
    const content = "unknown_top_option = true\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const unknownTop = diagnostics.find(
        (d) =>
          d.message.includes("Unknown top-level option") &&
          d.message.includes("unknown_top_option"),
      );
      assert.ok(
        unknownTop,
        `Should warn about unknown top-level option, got: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
      assert.strictEqual(
        unknownTop.severity,
        vscode.DiagnosticSeverity.Warning,
      );
    } finally {
      cleanup();
    }
  });

  test("should warn about unknown sections", async () => {
    const content = "[nonexistent_section]\ndisabled = false\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const unknownSection = diagnostics.find(
        (d) =>
          d.message.includes("Unknown Atuin config section") &&
          d.message.includes("nonexistent_section"),
      );
      assert.ok(
        unknownSection,
        `Should warn about unknown section, got: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
      assert.strictEqual(
        unknownSection.severity,
        vscode.DiagnosticSeverity.Warning,
      );
    } finally {
      cleanup();
    }
  });

  test("should warn about unknown options within known sections", async () => {
    const content = "[daemon]\nunknown_option = true\n";
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const unknownOpt = diagnostics.find(
        (d) =>
          d.message.includes("Unknown option") &&
          d.message.includes("unknown_option"),
      );
      assert.ok(
        unknownOpt,
        `Should warn about unknown option, got: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
      assert.strictEqual(
        unknownOpt.severity,
        vscode.DiagnosticSeverity.Warning,
      );
    } finally {
      cleanup();
    }
  });

  test("valid config should produce zero diagnostics", async () => {
    const content = [
      'db_path = "~/.local/share/atuin/history.db"',
      "auto_sync = true",
      'search_mode = "fuzzy"',
      'filter_mode = "global"',
      "network_timeout = 30",
      "",
      "[daemon]",
      "enabled = true",
      "autostart = true",
      "sync_frequency = 300",
      "tcp_port = 8889",
      "",
      "[sync]",
      "records = true",
    ].join("\n");
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      assert.strictEqual(
        diagnostics.length,
        0,
        `Valid config should have 0 diagnostics, got ${diagnostics.length}: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
    } finally {
      cleanup();
    }
  });

  test("should report multiple errors in one file", async () => {
    const content = [
      "unknown_top_option = true",
      "",
      "[nonexistent_section]",
      "disabled = false",
      "",
      "[daemon]",
      "unknown_option = true",
    ].join("\n");
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      assert.ok(
        diagnostics.length >= 3,
        `Should report at least 3 diagnostics, got ${diagnostics.length}: ${diagnostics.map((d) => d.message).join("; ")}`,
      );

      const hasUnknownTop = diagnostics.some((d) =>
        d.message.includes("Unknown top-level option"),
      );
      const hasUnknownSection = diagnostics.some((d) =>
        d.message.includes("Unknown Atuin config section"),
      );
      const hasUnknownOpt = diagnostics.some((d) =>
        d.message.includes("Unknown option"),
      );

      assert.ok(hasUnknownTop, "Should have unknown top-level option warning");
      assert.ok(hasUnknownSection, "Should have unknown section warning");
      assert.ok(hasUnknownOpt, "Should have unknown option warning");
    } finally {
      cleanup();
    }
  });

  test("should report type mismatches", async () => {
    const content = 'network_timeout = "not a number"\n';
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const typeMismatch = diagnostics.find((d) =>
        d.message.includes("Type mismatch"),
      );
      assert.ok(
        typeMismatch,
        `Should report type mismatch, got: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
      assert.strictEqual(
        typeMismatch.severity,
        vscode.DiagnosticSeverity.Error,
      );
    } finally {
      cleanup();
    }
  });

  test("should report invalid enum values", async () => {
    const content = 'search_mode = "nonexistent"\n';
    const { uri, cleanup } = await openAtuinDoc(content);
    try {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const invalidValue = diagnostics.find((d) =>
        d.message.includes("Invalid value"),
      );
      assert.ok(
        invalidValue,
        `Should report invalid enum value, got: ${diagnostics.map((d) => d.message).join("; ")}`,
      );
    } finally {
      cleanup();
    }
  });
});
