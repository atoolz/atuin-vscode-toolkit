import * as vscode from "vscode";
import { getTomlContext, isAtuinConfig } from "../utils/tomlParser";
import { atuinSections, findSection, allSectionNames, topLevelOptions } from "../data/sections";

export class AtuinCompletionProvider
  implements vscode.CompletionItemProvider
{
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): vscode.CompletionItem[] | undefined {
    if (!isAtuinConfig(document)) {
      return undefined;
    }

    const ctx = getTomlContext(document, position);
    const lineText = document.lineAt(position.line).text;

    // Section header completion: user is typing [...]
    if (lineText.trim().startsWith("[")) {
      return this.completeSectionHeader(lineText, position);
    }

    // Inside a value
    if (ctx.inValue) {
      return this.completeValue(ctx, document, position);
    }

    // Key completion
    return this.completeKey(ctx);
  }

  private completeSectionHeader(
    lineText: string,
    _position: vscode.Position,
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const sectionName of allSectionNames) {
      const section = findSection(sectionName);
      if (!section) continue;

      const item = new vscode.CompletionItem(
        sectionName,
        vscode.CompletionItemKind.Module,
      );
      item.detail = "Atuin config section";
      item.documentation = new vscode.MarkdownString(
        `${section.description}\n\n[Documentation](${section.docUrl})`,
      );
      items.push(item);
    }

    return items;
  }

  private completeKey(ctx: { section: string }): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    if (ctx.section === "") {
      // Top-level options
      for (const opt of topLevelOptions) {
        const item = new vscode.CompletionItem(
          opt.name,
          vscode.CompletionItemKind.Property,
        );
        item.detail = `${opt.type} (default: ${opt.default})`;
        const docParts = [opt.description];
        if (opt.enumValues) {
          docParts.push(`\n\n**Values:** ${opt.enumValues.map((v) => `\`"${v}"\``).join(", ")}`);
        }
        item.documentation = new vscode.MarkdownString(docParts.join(""));
        item.insertText = this.keyValueSnippet(opt.name, opt.type, opt.default);
        items.push(item);
      }
    } else {
      // Section-specific options
      const section = findSection(ctx.section);
      if (section) {
        for (const opt of section.options) {
          const item = new vscode.CompletionItem(
            opt.name,
            vscode.CompletionItemKind.Property,
          );
          item.detail = `${opt.type} (default: ${opt.default})`;
          const docParts = [opt.description];
          if (opt.enumValues) {
            docParts.push(`\n\n**Values:** ${opt.enumValues.map((v) => `\`"${v}"\``).join(", ")}`);
          }
          item.documentation = new vscode.MarkdownString(docParts.join(""));
          item.insertText = this.keyValueSnippet(opt.name, opt.type, opt.default);
          items.push(item);
        }
      }
    }

    return items;
  }

  private completeValue(
    ctx: {
      section: string;
      currentKey: string;
      currentValue: string;
      inString: boolean;
    },
    _document: vscode.TextDocument,
    _position: vscode.Position,
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const key = ctx.currentKey;

    // Find the option definition
    let optionDef: { type: string; enumValues?: string[] } | undefined;

    if (ctx.section === "") {
      optionDef = topLevelOptions.find((o) => o.name === key);
    } else {
      const section = findSection(ctx.section);
      if (section) {
        optionDef = section.options.find((o) => o.name === key);
      }
    }

    // Enum value completions
    if (optionDef && "enumValues" in optionDef && optionDef.enumValues) {
      for (const val of optionDef.enumValues) {
        const item = new vscode.CompletionItem(
          val,
          vscode.CompletionItemKind.EnumMember,
        );
        item.detail = `Value for ${key}`;
        if (ctx.inString) {
          item.insertText = val;
        } else {
          item.insertText = `"${val}"`;
        }
        items.push(item);
      }
      return items;
    }

    // Boolean completions
    if (optionDef?.type === "boolean") {
      items.push(
        new vscode.CompletionItem("true", vscode.CompletionItemKind.Value),
        new vscode.CompletionItem("false", vscode.CompletionItemKind.Value),
      );
    }

    // Column value completions for [ui] columns
    if (ctx.section === "ui" && key === "columns" && ctx.inString) {
      const columnTypes = ["duration", "time", "datetime", "directory", "host", "user", "exit", "command"];
      for (const col of columnTypes) {
        const item = new vscode.CompletionItem(
          col,
          vscode.CompletionItemKind.EnumMember,
        );
        item.detail = "UI column type";
        item.insertText = col;
        items.push(item);
      }
    }

    return items;
  }

  private keyValueSnippet(
    name: string,
    type: string,
    defaultValue: string,
  ): vscode.SnippetString {
    switch (type) {
      case "string":
        return new vscode.SnippetString(
          `${name} = "\${1:${defaultValue.replace(/^"|"$/g, "")}}"`,
        );
      case "boolean":
        return new vscode.SnippetString(
          `${name} = \${1|true,false|}`,
        );
      case "number":
        return new vscode.SnippetString(
          `${name} = \${1:${defaultValue}}`,
        );
      case "array":
        return new vscode.SnippetString(`${name} = [\${1}]`);
      default:
        return new vscode.SnippetString(`${name} = \${1:${defaultValue}}`);
    }
  }
}
