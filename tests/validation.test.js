import assert from "node:assert/strict";
import test from "node:test";

import { validate } from "../public/validation.js";

const FIELD_NAMES = ["name", "password", "mobile", "username", "email"];

function assertInvalid(fieldName, values) {
  for (const value of values) {
    assert.ok(validate(fieldName, value), `Expected "${value}" to be invalid`);
  }
}

test("all fields are required", () => {
  for (const fieldName of FIELD_NAMES) {
    assertInvalid(fieldName, ["", "   "]);
  }
});

test("name accepts letters separated by single spaces", () => {
  assert.equal(validate("name", "Amul Kumar"), "");
  assertInvalid("name", ["Amul7", "Amul_", " Amul", "Amul  Kumar"]);
});

test("password requires at least one letter and one number", () => {
  assert.equal(validate("password", "Hello123!"), "");
  assertInvalid("password", ["abcdef", "123456", "!!!!"]);
});

test("mobile number requires exactly ten digits", () => {
  assert.equal(validate("mobile", "9876543210"), "");
  assertInvalid("mobile", [
    "123",
    "12345678901",
    "+919876543210",
    "98765a3210",
    "98765 3210",
  ]);
});

test("username requires letters, numbers, and one special character", () => {
  for (const value of ["amul7_", "_amul7", "amul_7"]) {
    assert.equal(validate("username", value), "");
  }
  assertInvalid("username", [
    "amul7",
    "amul_",
    "123_",
    "amul7__",
    "amul 7_",
  ]);
});

test("email accepts a basic valid address", () => {
  assert.equal(validate("email", "amul+test@example.com"), "");
  assertInvalid("email", ["a", "a@b", "a@@b.com", "a b@example.com"]);
});
