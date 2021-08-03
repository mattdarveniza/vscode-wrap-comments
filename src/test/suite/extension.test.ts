import * as assert from "assert";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { wrapText, formatComments } from "../../extension";

suite("Extension Test Suite", () => {
  suite("wrapText", () => {
    test("returns a single item when text is less than line length", () => {
      const text = "abcd";
      const result = wrapText(text, 80);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0], text);
    });

    test("wraps lines at sensible breakpoints", () => {
      const text = "I'm expecting to get broken right here";
      const result = wrapText(text, text.length - 2);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0], "I'm expecting to get broken right");
      assert.strictEqual(result[1], "here");
    });

    test("wraps at the nearest space when that space exceeds the line limit", () => {
      const text = "I'malongstringiwithnospaceshahacan'tbreakme boop";
      const result = wrapText(text, 20);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(
        result[0],
        "I'malongstringiwithnospaceshahacan'tbreakme"
      );
      assert.strictEqual(result[1], "boop");
    });

    test("doesn't wrap when there are no spaces", () => {
      const text = "Iambeautifulnotmatterwhattheysayspacescan'tbreakmedown";
      const result = wrapText(text, 20);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0], text);
    });
  });

  suite("formatComments", () => {
    test("test-document", async () => {
      const uri = vscode.Uri.file(
        path.join(__dirname, "../../../src/test/suite/test-document.ts")
      );
      const document = await vscode.workspace.openTextDocument(uri);
      const result = formatComments(document);

      // TODO: Actually assert something here
      console.log(result);
    });
  });
});
