const test = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

test.after(() => {
  server.close();
});

test("GET /tasks returns HTTP 200 with JSON", async () => {
  const response = await fetch(`${baseUrl}/tasks`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
});

test("GET /tasks returns an array", async () => {
  const response = await fetch(`${baseUrl}/tasks`);
  const body = await response.json();

  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);
});

test("GET /tasks returns tasks with id, title and completed", async () => {
  const response = await fetch(`${baseUrl}/tasks`);
  const body = await response.json();

  for (const task of body) {
    assert.equal(typeof task.id, "number");
    assert.equal(typeof task.title, "string");
    assert.equal(typeof task.completed, "boolean");
  }
});
