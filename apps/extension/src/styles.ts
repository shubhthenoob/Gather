export const PAGE_CSS = `
::highlight(hl-ext-active) { background-color: rgba(251, 188, 4, 0.75); color: inherit; }
`;

export const UI_CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: "Inter", system-ui, "Segoe UI", sans-serif; }
.toolbar, .composer, .toast, .picker {
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
.actions.spread { justify-content: flex-start; flex-wrap: wrap; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.08); font-size: 12px; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.composer-cats { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
.chip.removable { all: unset; display: inline-flex; align-items: center; gap: 6px; padding: 3px 6px 3px 8px; border-radius: 999px; background: rgba(255,255,255,.08); font-size: 12px; cursor: pointer; }
.chip.removable:hover { background: rgba(255,255,255,.14); }
.chip.removable .x { color: #9aa0a6; font-size: 14px; line-height: 1; }
.btn.chip-add { padding: 3px 10px; border-radius: 999px; border: 1px dashed #5f6368; font-size: 12px; color: #bdc1c6; }
.btn.chip-add:hover { border-color: #fbbc04; color: #fdd663; }
.picker { width: 260px; padding: 8px; }
.picker-input {
  width: 100%; padding: 8px 10px; margin-bottom: 6px; background: #303134; color: #e8eaed;
  border: 1px solid #5f6368; border-radius: 6px; font-size: 13px; outline: none;
}
.picker-input:focus { border-color: #fbbc04; }
.picker-input.nudge { animation: nudge .5s ease; }
@keyframes nudge { 0%,100% { transform: none; } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.picker-list { max-height: 220px; overflow-y: auto; }
.picker-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
.picker-row:hover, .picker-row.active { background: rgba(255,255,255,.08); }
.picker-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-row.create { color: #fdd663; }
.plus { width: 10px; text-align: center; font-weight: 700; }
.check {
  all: unset; width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid #9aa0a6;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #202124; cursor: pointer;
}
.check.on { background: #fbbc04; border-color: #fbbc04; }
.check:hover { border-color: #fdd663; }
.picker-empty { margin: 6px 8px; color: #9aa0a6; font-size: 12px; }
.picker-footer { display: flex; justify-content: flex-end; padding-top: 6px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,.08); }
.picker-footer[hidden] { display: none; }
.note { margin: 0; white-space: pre-wrap; max-height: 180px; overflow: auto; }
.note.muted { color: #9aa0a6; font-style: italic; }
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 8px 8px 8px 16px; display: flex; align-items: center; gap: 12px;
}
.toast-action {
  all: unset; cursor: pointer; padding: 6px 12px; border-radius: 8px;
  background: #fbbc04; color: #202124; font-weight: 600; font-size: 13px; white-space: nowrap;
}
.toast-action:hover { background: #fdd663; }
.toast-action:focus-visible { outline: 2px solid #fdd663; outline-offset: 2px; }
.fab {
  all: unset; position: fixed; right: 0; top: 50%; transform: translateY(-50%);
  width: 44px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: #fbbc04; color: #202124; border-radius: 12px 0 0 12px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,.3); transition: width .15s ease, background .15s ease;
}
.fab:hover { width: 52px; background: #fdd663; }
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
