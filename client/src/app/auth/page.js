"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, uploadAvatar } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function switchMode(nextMode) {
    setMode(nextMode);
    setStep(1);
    setError("");
    setLoading(false);
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await loginUser(loginForm);
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleContinueRegister() {
    setError("");
    const { fullName, username, email, password } = registerForm;
    if (!fullName || !username || !email || !password) {
      setError("Please complete all fields before continuing.");
      return;
    }
    setStep(2);
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setError("");

    if (!avatarFile) {
      setError("Please upload an avatar to finish registration.");
      return;
    }

    setLoading(true);
    try {
      const { token } = await registerUser(registerForm);
      localStorage.setItem("token", token);
      await uploadAvatar(token, avatarFile);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <a className="flex items-center gap-3" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            PC
          </div>
          <div>
            <p className="text-sm font-semibold">PulseChat</p>
            <p className="text-xs text-[color:var(--color-muted)]">
              Welcome back
            </p>
          </div>
        </a>
        <a className="btn btn-ghost" href="/">
          Back to landing
        </a>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-[1fr_1.05fr]">
        <section className="glass flex flex-col justify-between rounded-[32px] p-8">
          <div className="space-y-5">
            <p className="label">Get started</p>
            <h1 className="font-display text-3xl md:text-4xl">
              Step into vibrant rooms with real-time presence.
            </h1>
            <p className="text-sm text-[color:var(--color-muted)]">
              Log in to continue your conversations or create a new account in
              two simple steps.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <div className="soft-card rounded-3xl p-4">
              <p className="text-sm font-semibold">Step 1</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                Share your name, username, and email.
              </p>
            </div>
            <div className="soft-card rounded-3xl p-4">
              <p className="text-sm font-semibold">Step 2</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                Upload an avatar to personalize your profile.
              </p>
            </div>
          </div>
        </section>

        <section className="glass rounded-[32px] p-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`btn flex-1 ${
                mode === "login" ? "btn-primary" : "btn-ghost"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`btn flex-1 ${
                isRegister ? "btn-primary" : "btn-ghost"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!isRegister && (
            <form
              className="mt-8 space-y-5"
              onSubmit={handleLoginSubmit}
            >
              <div>
                <label className="label">Email or username</label>
                <input
                  className="input mt-2"
                  placeholder="yourname or you@mail.com"
                  type="text"
                  name="identifier"
                  value={loginForm.identifier}
                  onChange={handleLoginChange}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  className="input mt-2"
                  placeholder="Enter your password"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[color:var(--color-muted)]">
                  <input type="checkbox" className="h-4 w-4" />
                  Remember me
                </label>
                <a className="text-[color:var(--color-brand)]" href="#">
                  Forgot password
                </a>
              </div>
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
              <p className="text-center text-xs text-[color:var(--color-muted)]">
                No account yet?{" "}
                <button
                  type="button"
                  className="text-[color:var(--color-brand)]"
                  onClick={() => switchMode("register")}
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {isRegister && (
            <form
              className="mt-8 space-y-6"
              onSubmit={handleRegisterSubmit}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step >= 1 ? "bg-black" : "bg-black/10"
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step >= 2 ? "bg-black" : "bg-black/10"
                  }`}
                />
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Full name</label>
                    <input
                      className="input mt-2"
                      placeholder="Layla Moore"
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div>
                    <label className="label">Username</label>
                    <input
                      className="input mt-2"
                      placeholder="layla.m"
                      name="username"
                      value={registerForm.username}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input mt-2"
                      placeholder="layla@mail.com"
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      className="input mt-2"
                      placeholder="Create a password"
                      type="password"
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    type="button"
                    onClick={handleContinueRegister}
                  >
                    Continue to avatar
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="soft-card rounded-3xl p-5">
                    <p className="text-sm font-semibold">Upload avatar</p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      PNG, JPG, or WEBP up to 2MB.
                    </p>
                    <div className="mt-4 rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
                        +
                      </div>
                      <p className="mt-3 text-xs text-[color:var(--color-muted)]">
                        Drag and drop or browse
                      </p>
                      <input
                        className="mt-4 text-xs"
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setAvatarFile(event.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="btn btn-ghost flex-1"
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      className="btn btn-primary flex-1"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Finishing..." : "Finish registration"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
