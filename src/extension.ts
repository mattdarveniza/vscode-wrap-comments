import * as vscode from "vscode";
import { parse } from "@babel/parser";
import { CommentBlock, CommentLine } from "@babel/types";

const extensions = ["ts", "tsx", "js", "jsx"];

function isCommentLine(
  comment: CommentLine | CommentBlock | undefined
): comment is CommentLine {
  return comment?.type === "CommentLine";
}

function isCommentBlock(
  comment: CommentLine | CommentBlock | undefined
): comment is CommentBlock {
  return comment?.type === "CommentBlock";
}

function isFollowingLine(a: CommentLine, b: CommentLine): boolean {
  return a.loc.end.line + 1 === b.loc.start.line;
}

export function wrapText(text: string, lineLength: number): string[] {
  if (text.length <= lineLength) {
    return [text];
  }

  // Find breakpoint nearest to end of line
  let breakIndex = text.slice(0, lineLength).lastIndexOf(" ");

  // Look for nearest break past line limit if none found within limits
  if (breakIndex === -1) {
    breakIndex = text.indexOf(" ");
  }

  // Do not break if breakpoint can't be found
  if (breakIndex === -1) {
    return [text];
  }

  return [
    text.slice(0, breakIndex),
    ...wrapText(text.slice(breakIndex + 1), lineLength),
  ];
}

export function formatComments(document: vscode.TextDocument) {
  const lineLength: number =
    vscode.workspace
      .getConfiguration("vscode-wrap-comments")
      .get("lineLength") ?? 80;
  const ast = parse(document.getText());
  const lineCommentGroups: CommentLine[][] = [];
  const blockComments: CommentBlock[] = [];

  if (!ast.comments) {
    return null;
  }

  let group: CommentLine[] = [];
  let prev: CommentLine | CommentBlock | undefined;
  // TODO: this logic is a real mess. Clean up or at least extract it into
  // a function where I don't have to look at it >_<
  for (const comment of ast.comments) {
    if (isCommentLine(comment)) {
      if (isCommentLine(prev) && isFollowingLine(prev, comment)) {
        group.push(comment);
      } else {
        if (group.length) {
          lineCommentGroups.push(group);
        }
        group = [comment];
      }
    }

    if (isCommentBlock(comment)) {
      blockComments.push(comment);
    }

    prev = comment;
  }

  // Add final group if leftover after iterations
  if (group.length) {
    lineCommentGroups.push(group);
  }

  const lineEdits = lineCommentGroups.map((group) => {
    const lineCommentToken = "// ";
    const indent = group[0].loc.start.column;
    const lineBreakLimit = lineLength - indent - lineCommentToken.length;

    const fullComment = group.map((line) => line.value.trim()).join(" ");
    const lines = wrapText(fullComment, lineBreakLimit);
    const newComment = lines
      .map((line) => `${" ".repeat(indent)}${lineCommentToken}${line}`)
      .join("\n");

    // minus 1 because vscode lines start at zero and AST lines start at one.
    const startLine = group[0].loc.start.line - 1;
    const endLine = group[group.length - 1].loc.end.line - 1;

    return vscode.TextEdit.replace(
      new vscode.Range(
        document.lineAt(startLine).range.start,
        document.lineAt(endLine).range.end
      ),
      newComment
    );
  });

  return lineEdits;
}

export function activate(context: vscode.ExtensionContext) {
  const selector = [{ pattern: `*.{${extensions.join(",")}}`, scheme: "file" }];

  vscode.languages.registerDocumentFormattingEditProvider(selector, {
    provideDocumentFormattingEdits: formatComments,
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
