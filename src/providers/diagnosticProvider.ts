import * as vscode from "vscode";
import {
  isAtuinConfig,
  parseSections,
  parseSectionOptions,
  extractStringValue,
} from "../utils/tomlParser";
import { findSection, allSectionNames, topLevelOptions } from "../data/sections";

const DIAGNOSTIC_SOURCE = "Atuin Toolkit";

export class AtuinDiagnosticProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("atuin");

    // Validate on open and change
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => this.validate(doc)),
      vscode.workspace.onDidChangeTextDocument((e) =>
        this.validate(e.document),
      ),
      vscode.workspace.onDidCloseTextDocument((doc) =>
        this.diagnosticCollection.delete(doc.uri),
      ),
    );

    // Validate all open documents
    for (const doc of vscode.workspace.textDocuments) {
      this.validate(doc);
    }
  }

  validate(document: vscode.TextDocument): void {
    if (!isAtuinConfig(document)) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const sections = parseSections(document);

    // Validate top-level options (lines before the first section)
    const firstSectionLine =
      sections.length > 0 ? sections[0].line : document.lineCount;
    this.validateTopLevel(document, 0, firstSectionLine, diagnostics);

    // Validate each section
    for (const section of sections) {
      this.validateSection(document, section, diagnostics);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private validateTopLevel(
    document: vscode.TextDocument,
    startLine: number,
    endLine: number,
    diagnostics: vscode.Diagnostic[],
  ): void {
    const knownKeys = topLevelOptions.map((o) => o.name);

    for (let i = startLine; i < endLine && i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();
      if (line === "" || line.startsWith("#")) continue;

      const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (!knownKeys.includes(key)) {
          const range = new vscode.Range(
            i,
            0,
            i,
            keyMatch[0].length - 1,
          );
          diagnostics.push(
            this.createDiagnostic(
              range,
              `Unknown top-level option: "${key}"`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        } else {
          // Type check the value
          const opt = topLevelOptions.find((o) => o.name === key);
          if (opt) {
            const valueStr = line.substring(line.indexOf("=") + 1).trim();
            this.validateValueType(
              document,
              i,
              key,
              valueStr,
              opt.type,
              diagnostics,
            );

            // Validate enum values
            if (opt.enumValues) {
              this.validateEnumValue(
                document,
                i,
                key,
                valueStr,
                opt.enumValues,
                diagnostics,
              );
            }
          }
        }
      }
    }
  }

  private validateSection(
    document: vscode.TextDocument,
    section: { name: string; line: number; endLine: number },
    diagnostics: vscode.Diagnostic[],
  ): void {
    const sectionName = section.name;

    // Check if section is known
    if (!allSectionNames.includes(sectionName)) {
      const headerLine = document.lineAt(section.line).text;
      const bracketStart = headerLine.indexOf("[");
      const bracketEnd = headerLine.indexOf("]");
      const range = new vscode.Range(
        section.line,
        bracketStart,
        section.line,
        bracketEnd + 1,
      );
      diagnostics.push(
        this.createDiagnostic(
          range,
          `Unknown Atuin config section: "${sectionName}"`,
          vscode.DiagnosticSeverity.Warning,
        ),
      );
      return;
    }

    const sec = findSection(sectionName);
    if (!sec) return;

    const options = parseSectionOptions(document, section.line, section.endLine);

    for (const opt of options) {
      const knownOption = sec.options.find((o) => o.name === opt.key);
      if (!knownOption) {
        const line = document.lineAt(opt.line).text;
        const keyStart = line.indexOf(opt.key);
        const range = new vscode.Range(
          opt.line,
          keyStart,
          opt.line,
          keyStart + opt.key.length,
        );
        diagnostics.push(
          this.createDiagnostic(
            range,
            `Unknown option "${opt.key}" in [${sectionName}]`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
        continue;
      }

      // Type checking
      this.validateValueType(
        document,
        opt.line,
        opt.key,
        opt.value,
        knownOption.type,
        diagnostics,
      );

      // Enum validation
      if (knownOption.enumValues) {
        this.validateEnumValue(
          document,
          opt.line,
          opt.key,
          opt.value,
          knownOption.enumValues,
          diagnostics,
        );
      }
    }
  }

  private validateValueType(
    document: vscode.TextDocument,
    line: number,
    key: string,
    value: string,
    expectedType: string,
    diagnostics: vscode.Diagnostic[],
  ): void {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;

    let actualType: string | null = null;

    if (trimmed === "true" || trimmed === "false") {
      actualType = "boolean";
    } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      actualType = "number";
    } else if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"""') || trimmed.startsWith("'''"))
    ) {
      actualType = "string";
    } else if (trimmed.startsWith("[")) {
      actualType = "array";
    }

    if (actualType === null) return;

    // Check type mismatch
    const isCompatible = actualType === expectedType;

    if (!isCompatible) {
      const lineText = document.lineAt(line).text;
      const valStart = lineText.indexOf(value);
      if (valStart < 0) return;
      const range = new vscode.Range(
        line,
        valStart,
        line,
        valStart + value.length,
      );
      diagnostics.push(
        this.createDiagnostic(
          range,
          `Type mismatch for "${key}": expected ${expectedType}, got ${actualType}`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }
  }

  private validateEnumValue(
    document: vscode.TextDocument,
    line: number,
    key: string,
    value: string,
    allowedValues: string[],
    diagnostics: vscode.Diagnostic[],
  ): void {
    const strVal = extractStringValue(value);
    if (strVal === null) return;

    if (!allowedValues.includes(strVal)) {
      const lineText = document.lineAt(line).text;
      const valStart = lineText.indexOf(value);
      if (valStart < 0) return;
      const range = new vscode.Range(
        line,
        valStart,
        line,
        valStart + value.length,
      );
      diagnostics.push(
        this.createDiagnostic(
          range,
          `Invalid value "${strVal}" for "${key}". Expected one of: ${allowedValues.join(", ")}`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }
  }

  private createDiagnostic(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity,
  ): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = DIAGNOSTIC_SOURCE;
    return diagnostic;
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
