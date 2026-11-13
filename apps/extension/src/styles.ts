export const PAGE_CSS = `
::highlight(hl-ext-a) { background-color: rgba(255, 221, 51, 0.45); color: inherit; }
::highlight(hl-ext-b) { background-color: rgba(255, 184, 77, 0.45); color: inherit; }
::highlight(hl-ext-active) { background-color: rgba(251, 188, 4, 0.75); color: inherit; }
`;

export const UI_CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: "Inter", system-ui, "Segoe UI", sans-serif; }
.toolbar, .composer, .toast {
  position: absolute;
  background: #202124; color: #e8eaed;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,.25), 0 1px 3px rgba(0,0,0,.2);
  font-size: 13px; line-height: 1.4;
  animation: pop .12s ease-out;
}
@keyframes pop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.toolbar { display: flex; align-items: center; gap: 4px; padding: 4px; white-space: nowrap; }
.label { padding: 0 8px; color: #fdd663; font-weight: 600; }
.btn {
  all: unset; cursor: pointer; padding: 6px 10px; border-radius: 6px;
  font-size: 13px; font-weight: 500; color: #e8eaed;
}
.btn:hover { background: rgba(255,255,255,.1); }
.btn.primary { background: #fbbc04; color: #202124; }
.btn.primary:hover { background: #fdd663; }
.btn.ghost { color: #9aa0a6; }
.link { all: unset; cursor: pointer; color: #fdd663; font-weight: 600; margin-left: 12px; }
.composer { width: 320px; padding: 12px; }
.preview {
  margin: 0 0 8px; padding: 6px 10px; border-left: 3px solid #fbbc04;
  color: #bdc1c6; font-size: 12px; max-height: 90px; overflow: auto; white-space: pre-wrap;
}
textarea {
  width: 100%; resize: vertical; min-height: 64px; padding: 8px;
  background: #303134; color: #e8eaed; border: 1px solid #5f6368; border-radius: 6px;
  font-size: 13px; outline: none;
}
textarea:focus { border-color: #fbbc04; }
.actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }
.note { margin: 0; white-space: pre-wrap; max-height: 180px; overflow: auto; }
.note.muted { color: #9aa0a6; font-style: italic; }
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 10px 16px; display: flex; align-items: center;
}
.fab {
  all: unset; position: fixed; right: 0; top: 50%; transform: translateY(-50%);
  width: 44px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: #7c5cff; color: #fff; border-radius: 12px 0 0 12px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,.3); transition: width .15s ease, background .15s ease;
}
.fab:hover { width: 52px; background: #6a48f5; }
.fab.peek { transform: translate(34px, -50%); opacity: .45; transition: transform .2s ease, opacity .2s ease; }
.fab.peek:hover, .fab.peek:focus-visible { transform: translateY(-50%); opacity: 1; }
.fab-badge {
  position: absolute; top: -8px; left: -8px; min-width: 20px; height: 20px; padding: 0 5px;
  border-radius: 10px; border: 2px solid #fff; background: #202124; color: #fff;
  font-size: 11px; font-weight: 700; line-height: 16px; text-align: center; box-sizing: border-box;
}
.fab-badge.alert { background: #e8174a; }
.fab-badge[hidden] { display: none; }
`;
