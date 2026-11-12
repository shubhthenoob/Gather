import { isSupportedUrl } from "@highlight/shared";
import { send, type TabStatus, type UserInfo } from "./messages";

declare const __WEB_URL__: string;

const $ = (id: string) => document.getElementById(id)!;

function text(tag: string, content: string, cls?: string) {
  const e = document.createElement(tag);
  e.textContent = content;
  if (cls) e.className = cls;
  return e;
}

async function renderAccount() {
  const account = $("account");
  const user = await send<UserInfo | null>({ type: "session" });
  account.replaceChildren();
  $("signout").hidden = !user;
  if (!user) {
    account.append(text("p", "Sign in to save highlights and sync them with your library.", "muted"));
    const b = text("button", "Continue with Google", "primary");
    b.style.marginTop = "8px";
    b.addEventListener("click", async () => {
      b.textContent = "Opening Google…";
      const res = await send<{ ok: boolean; error?: string }>({ type: "signIn" });
      if (!res.ok) account.append(text("p", res.error ?? "Sign-in failed.", "warn"));
      await render();
    });
    account.append(b);
    return;
  }
  const row = document.createElement("div");
  row.className = "row";
  if (user.avatar) {
    const img = document.createElement("img");
    img.src = user.avatar; img.className = "avatar"; img.referrerPolicy = "no-referrer"; img.alt = "";
    row.append(img);
  } else row.append(Object.assign(document.createElement("div"), { className: "avatar" }));
  const who = document.createElement("div");
  who.append(text("div", user.name ?? "Signed in"), text("div", user.email ?? "", "muted"));
  row.append(who);
  account.append(row);
}

async function renderPage() {
  const page = $("page");
  page.replaceChildren();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!isSupportedUrl(tab?.url)) {
    page.append(text("p", "Highlight can't run on this page. Browser and Web Store pages are restricted.", "muted"));
    return;
  }
  const queued = await send<number>({ type: "queueSize" });
  try {
    const status = (await chrome.tabs.sendMessage(tab.id!, { type: "status" })) as TabStatus;
    if (status.total === 0) page.append(text("p", "Select text on this page to save a highlight.", "muted"));
    else page.append(text("p", `${status.painted} highlight${status.painted === 1 ? "" : "s"} on this page.`));
    if (status.unresolved) {
      page.append(text("p", `${status.unresolved} saved highlight${status.unresolved === 1 ? "" : "s"} could not be found. The page may have changed. They are still in your library.`, "warn"));
    }
  } catch {
    page.append(text("p", "Reload this page to start highlighting.", "muted"));
  }
  if (queued) page.append(text("p", `${queued} change${queued === 1 ? "" : "s"} waiting to sync.`, "muted"));
}

async function render() {
  await Promise.all([renderAccount(), renderPage()]);
}

($("open") as HTMLAnchorElement).href = __WEB_URL__;
$("signout").addEventListener("click", async () => {
  await send({ type: "signOut" });
  await render();
});
void render();
