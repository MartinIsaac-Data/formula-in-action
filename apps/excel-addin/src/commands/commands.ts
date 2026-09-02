/* global Office */

/**
 * Ribbon command handlers. The "Explain Formula" button uses a ShowTaskpane
 * action (declared in the manifest), so this file only needs to register with
 * Office; it is a placeholder for future ExecuteFunction commands.
 */
Office.onReady(() => {
  // no-op
});

/** Example ExecuteFunction command, wired for later use. */
function refresh(event: Office.AddinCommands.Event): void {
  event.completed();
}

// Office looks up ExecuteFunction handlers on the global object.
(globalThis as unknown as { refresh?: typeof refresh }).refresh = refresh;
