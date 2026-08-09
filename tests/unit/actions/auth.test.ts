import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// login/logout call redirect(), which only works inside a real Next.js request context —
// mock it, and mock the iron-session-backed getSession() with a plain object so session
// mutations (isLoggedIn, save(), destroy()) can be asserted directly.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const mockSession = vi.hoisted(() => ({
  isLoggedIn: false,
  save: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => mockSession),
}));

const { redirect } = await import("next/navigation");
const { login, logout } = await import("@/actions/auth");

const PASSWORD = "correct horse battery staple";
// Low cost factor keeps this fast — hash strength isn't what's under test here.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

function buildFormData(password?: string) {
  const formData = new FormData();
  if (password !== undefined) formData.set("password", password);
  return formData;
}

describe("login", () => {
  beforeEach(() => {
    mockSession.isLoggedIn = false;
    mockSession.save.mockClear();
    mockSession.destroy.mockClear();
    vi.mocked(redirect).mockClear();
    delete process.env.AUTH_PASSWORD_HASH;
  });

  afterEach(() => {
    delete process.env.AUTH_PASSWORD_HASH;
  });

  it("rejects a missing password without touching the session", async () => {
    const result = await login(undefined, buildFormData());
    expect(result).toEqual({ error: "Password is required." });
    expect(mockSession.save).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects an empty password", async () => {
    const result = await login(undefined, buildFormData(""));
    expect(result).toEqual({ error: "Password is required." });
  });

  it("reports a config error when AUTH_PASSWORD_HASH is unset", async () => {
    const result = await login(undefined, buildFormData(PASSWORD));
    expect(result).toEqual({
      error: "Auth is not configured (missing AUTH_PASSWORD_HASH).",
    });
    expect(mockSession.save).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password without logging in", async () => {
    process.env.AUTH_PASSWORD_HASH = PASSWORD_HASH;
    const result = await login(undefined, buildFormData("wrong password"));
    expect(result).toEqual({ error: "Incorrect password." });
    expect(mockSession.isLoggedIn).toBe(false);
    expect(mockSession.save).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("logs in and redirects home on a correct password", async () => {
    process.env.AUTH_PASSWORD_HASH = PASSWORD_HASH;
    await login(undefined, buildFormData(PASSWORD));
    expect(mockSession.isLoggedIn).toBe(true);
    expect(mockSession.save).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("logout", () => {
  beforeEach(() => {
    mockSession.destroy.mockClear();
    vi.mocked(redirect).mockClear();
  });

  it("destroys the session and redirects to login", async () => {
    await logout();
    expect(mockSession.destroy).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
