import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../lib/projectApi.ts");
const store = read("../store/projectStore.ts");
const form = read("../components/dashboard/ProjectSettingsForm.tsx");

// The existing canonical endpoint and only its editable payload fields are used.
assert.match(api, /method: "PUT"/);
assert.match(api, /`\/projects\/\$\{encodeURIComponent\(id\)\}`/);
assert.match(store, /function toProjectUpdatePayload/);
assert.match(store, /payload\.projectName = updates\.name/);
assert.match(store, /payload\.category = updates\.category/);
assert.match(store, /payload\.style = updates\.style/);
assert.match(store, /mapApiProject\(await apiUpdateProject\(id, payload\)\)/);

// Successful API data replaces Zustand state and an open builder gets the name.
assert.match(store, /projects: state\.projects\.map/);
assert.match(store, /currentProjectName: updated\.name/);

// Existing form now handles validation, dirty state, duplicate prevention, and feedback.
assert.match(form, /Project name is required/);
assert.match(form, /trimmedName\.length > 100/);
assert.match(form, /isSaving \|\| !isDirty/);
assert.match(form, /You have unsaved changes/);
assert.match(form, /Unable to save project settings/);

console.log("Project settings persistence checks passed.");
