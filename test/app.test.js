const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, calculateTotal, tasks } = require("../src/app");

// ---------- calculateTotal ----------

test("calculates the total for several items", () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];

  assert.equal(calculateTotal(items), 35);
});

test("returns zero for an empty basket", () => {
  assert.equal(calculateTotal([]), 0);
});

test("does not mutate the input items", () => {
  const items = [{ price: 4, quantity: 2 }];
  const copy = JSON.parse(JSON.stringify(items));

  calculateTotal(items);

  assert.deepEqual(items, copy);
});

// ---------- DELETE /tasks/:id ----------

const initialTasks = tasks.map((t) => ({ ...t }));
let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve); // port 0 = random free port
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

// Restore the seed data so tests don't depend on each other
beforeEach(() => {
  tasks.splice(0, tasks.length, ...initialTasks.map((t) => ({ ...t })));
});

const del = (id) => fetch(`${baseUrl}/tasks/${id}`, { method: "DELETE" });

test("DELETE /tasks/:id deletes an existing task and returns 204", async () => {
  const res = await del(1);
  assert.equal(res.status, 204);
  assert.equal(await res.text(), "");
});

test("DELETE /tasks/:id actually removes the task from the list", async () => {
  await del(1);
  const list = await (await fetch(`${baseUrl}/tasks`)).json();
  assert.equal(list.length, initialTasks.length - 1);
  assert.ok(!list.some((t) => t.id === 1));
});

test("DELETE /tasks/:id does not affect other tasks", async () => {
  await del(1);
  const list = await (await fetch(`${baseUrl}/tasks`)).json();
  assert.deepEqual(list, [initialTasks[1]]);
});

test("DELETE /tasks/:id returns 404 for an unknown id", async () => {
  const res = await del(999);
  assert.equal(res.status, 404);
});

test("DELETE /tasks/:id returns 404 for a non-numeric id", async () => {
  const res = await del("abc");
  assert.equal(res.status, 404);
});

test("DELETE /tasks/:id returns 404 when deleting the same task twice", async () => {
  assert.equal((await del(1)).status, 204);
  assert.equal((await del(1)).status, 404);
});