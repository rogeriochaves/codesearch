/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, ExtensionContext, commands, env, Uri } from "vscode";
import * as clipboardy from "clipboardy";
import fetch from "node-fetch";

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function codeQuickPick(_context: ExtensionContext) {
  let throttlingTimeout: NodeJS.Timeout | null = null;
  let lastQuery = "";

  const searchResults = window.createQuickPick();
  searchResults.title = "Codesearch";
  searchResults.onDidChangeValue;

  const doSearch = (query: string) => async () => {
    lastQuery = query;
    searchResults.title = "Searching...";
    searchResults.busy = true;

    const suggestions: [string] = await fetch(
      "http://localhost:2633/?q=" + encodeURIComponent(query)
    ).then((data) => data.json());

    searchResults.busy = false;
    searchResults.title = "Codesearch";
    const suggestionItems = suggestions.map((label) => ({
      label,
      alwaysShow: true,
    }));

    searchResults.items = [
      {
        label: `$(search-view-icon) Search DuckDuckGo for '${query}'`,
        alwaysShow: true,
      },
    ].concat(suggestionItems);
  };

  searchResults.onDidChangeValue(async (query) => {
    if (throttlingTimeout) clearTimeout(throttlingTimeout);
    throttlingTimeout = setTimeout(doSearch(query), 500);
  });

  searchResults.onDidAccept(async () => {
    const query = searchResults.value;
    if (query === lastQuery) {
      const selectedSuggestion = searchResults.selectedItems[0];
      if (!selectedSuggestion) return;

      if (selectedSuggestion.label == searchResults.items[0].label) {
        env.openExternal(
          Uri.parse("https://duckduckgo.com/?q=" + encodeURIComponent(query))
        );
      } else {
        clipboardy.writeSync(selectedSuggestion.label);
        commands.executeCommand("editor.action.clipboardPasteAction");
        searchResults.hide();
      }
    } else {
      if (throttlingTimeout) clearTimeout(throttlingTimeout);
      doSearch(query)();
    }
  });

  searchResults.show();
}
