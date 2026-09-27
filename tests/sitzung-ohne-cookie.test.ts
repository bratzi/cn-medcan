import { test } from "node:test";
import assert from "node:assert/strict";

import { hatSitzungsCookie } from "@/lib/sitzungs-cookie";

test("hatSitzungsCookie: ohne Cookie false", () => {
  assert.equal(hatSitzungsCookie(new Headers()), false);
  assert.equal(hatSitzungsCookie(new Headers({ cookie: "cn_gate=abc" })), false);
});

test("hatSitzungsCookie: erkennt das Better-Auth-Cookie mit und ohne __Secure-", () => {
  assert.equal(hatSitzungsCookie(new Headers({ cookie: "better-auth.session_token=x" })), true);
  assert.equal(hatSitzungsCookie(new Headers({ cookie: "cn_gate=a; __Secure-better-auth.session_token=x" })), true);
});
