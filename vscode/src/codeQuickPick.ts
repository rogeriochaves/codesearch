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
export async function codeQuickPick(state: { waitingForStartup: boolean }) {
  let throttlingTimeout: NodeJS.Timeout | null = null;
  let lastQuery = "";

  const searchResults = window.createQuickPick();
  searchResults.title = "Codesearch";
  searchResults.onDidChangeValue;

  const doSearch = (query: string) => async () => {
    if (query.length === 0) return;

    lastQuery = query;
    searchResults.title = "Searching...";
    searchResults.busy = true;

    try {
      const suggestions: [string] = await fetch(
        "http://localhost:2633/?q=" + encodeURIComponent(query)
      ).then((data) => data.json());
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
    } catch (error) {
      if (state.waitingForStartup) {
        window.showInformationMessage(
          "Codesearch server is still starting, please wait. If it's the first time you are using it, it can take a few minutes to download the machine learning model. Thanks for your patience!"
        );
      } else {
        window.showErrorMessage(
          "Error from Codesearch server, try to reload VS Code. Error: " + error
        );
        console.error(error);
      }
    }

    searchResults.busy = false;
    searchResults.title = "Codesearch";
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

      if (selectedSuggestion.label === searchResults.items[0].label) {
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
