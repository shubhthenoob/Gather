// Chrome only opens the side panel after a user click, so the welcome page offers a button.
const button = document.getElementById("open") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLElement;
button.addEventListener("click", async () => {
  try {
    const win = await chrome.windows.getCurrent();
    await chrome.sidePanel.open({ windowId: win.id! });
    statusEl.textContent = "The panel is open on the right. Now select text on any page.";
  } catch {
    statusEl.textContent = "Click the Gather icon in Chrome's toolbar to open the panel.";
  }
});

export {};
