/**
 * @file service-worker.js
 * @description Background service worker for extension
 * @module background/service-worker
 * @requires background/state-manager
 * @requires background/message-handler
 */

import { stateManager } from "./state-manager.js";
import { handleMessage } from "./msg-handler.js";

// Initialize state manager on startup
stateManager
  .init()
  .then(() => {
    console.log("[ServiceWorker] State manager initialized (v2.0)");
  })
  .catch((error) => {
    console.error("[ServiceWorker] Failed to initialize state manager", error);
  });

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("[ServiceWorker] Extension installed");

  // Create context menu item
  chrome.contextMenus.create({
    id: "searchAnswer",
    title: "Search Answer",
    contexts: ["selection"],
  });

  console.log("[ServiceWorker] Context menu created");
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchAnswer") {
    const selectedText = info.selectionText;

    console.log("[ServiceWorker] Context menu clicked", { selectedText });

    // Send message to content script to show overlay
    chrome.tabs
      .sendMessage(tab.id, {
        type: "SHOW_ANSWER_OVERLAY",
        payload: { query: selectedText },
      })
      .catch(async (error) => {
        console.log(
          "[ServiceWorker] Content script not ready. Attempting to inject...",
          error.message,
        );

        try {
          // programmatic injection
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content/content-script-bundled.js"],
          });

          console.log(
            "[ServiceWorker] Injection successful. Retrying message...",
          );

          // Retry message after small delay to allow script to initialize
          setTimeout(() => {
            chrome.tabs
              .sendMessage(tab.id, {
                type: "SHOW_ANSWER_OVERLAY",
                payload: { query: selectedText },
              })
              .catch((err) =>
                console.error("[ServiceWorker] Retry failed:", err),
              );
          }, 100);
        } catch (injectionError) {
          console.error(
            "[ServiceWorker] Failed to inject content script:",
            injectionError,
          );
        }
      });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return handleMessage(message, sender, sendResponse);
});

// Handle extension icon click (open popup)
chrome.action.onClicked.addListener(() => {
  console.log("[ServiceWorker] Extension icon clicked");
});

console.log("[ServiceWorker] Service worker loaded");
