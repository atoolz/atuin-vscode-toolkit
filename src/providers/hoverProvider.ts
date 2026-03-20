import * as vscode from "vscode";
import { isAtuinConfig, getTomlContext } from "../utils/tomlParser";
import { findSection, topLevelOptions } from "../data/sections";

export class AtuinHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.Hover | undefined {
    if (!isAtuinConfig(document)) {
      return undefined;
    }

    const lineText = document.lineAt(position.line).text;

    // Hover over section headers
    const sectionMatch = lineText.match(/^\[([^\]]+)\]/);
    if (sectionMatch) {
      return this.hoverSection(sectionMatch[1], position);
    }

    // Hover over keys
    const ctx = getTomlContext(document, position);
    if (!ctx.inValue) {
      return this.hoverKey(lineText, position, ctx.section);
    }

    return undefined;
  }

  private hoverSection(
    sectionName: string,
    _position: vscode.Position,
  ): vscode.Hover | undefined {
    const section = findSection(sectionName);
    if (!section) {
      return undefined;
    }

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`### Atuin Section: \`[${section.name}]\`\n\n`);
    md.appendMarkdown(`${section.description}\n\n`);
    md.appendMarkdown(
      `**Options:** ${section.options.map((o) => `\`${o.name}\``).join(", ")}\n\n`,
    );
    md.appendMarkdown(`[Documentation](${section.docUrl})`);

    return new vscode.Hover(md);
  }

  private hoverKey(
    lineText: string,
    position: vscode.Position,
    section: string,
  ): vscode.Hover | undefined {
    const keyMatch = lineText.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    if (!keyMatch) return undefined;

    const key = keyMatch[1];

    // Check that the cursor is actually over the key
    const keyStart = lineText.indexOf(key);
    const keyEnd = keyStart + key.length;
    if (position.character < keyStart || position.character > keyEnd) {
      return undefined;
    }

    const docUrl = "https://docs.atuin.sh/cli/configuration/config/";

    // Look up the option in the appropriate section or top-level
    if (section === "") {
      const opt = topLevelOptions.find((o) => o.name === key);
      if (opt) {
        return this.buildOptionHover(key, opt.type, opt.default, opt.description, docUrl, opt.enumValues);
      }
    } else {
      const sec = findSection(section);
      if (sec) {
        const opt = sec.options.find((o) => o.name === key);
        if (opt) {
          return this.buildOptionHover(
            key,
            opt.type,
            opt.default,
            opt.description,
            sec.docUrl,
            opt.enumValues,
          );
        }
      }
    }

    return undefined;
  }

  private buildOptionHover(
    name: string,
    type: string,
    defaultValue: string,
    description: string,
    docUrl: string,
    enumValues?: string[],
  ): vscode.Hover {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**\`${name}\`** : \`${type}\`\n\n`);
    md.appendMarkdown(`${description}\n\n`);
    md.appendMarkdown(`**Default:** \`${defaultValue}\`\n\n`);
    if (enumValues && enumValues.length > 0) {
      md.appendMarkdown(`**Values:** ${enumValues.map((v) => `\`"${v}"\``).join(", ")}\n\n`);
    }
    md.appendMarkdown(`[Documentation](${docUrl})`);
    return new vscode.Hover(md);
  }
}
