export default function Home() {
  const features = [
    {
      title: "Live Typing Signals",
      description:
        "See who is typing in the room in real time so conversations feel natural.",
    },
    {
      title: "Public + Private Rooms",
      description:
        "Broadcast to the community or keep things private with invite-only access.",
    },
    {
      title: "Join Requests",
      description:
        "Room owners manage access with simple approve or reject workflows.",
    },
    {
      title: "Custom Room Atmospheres",
      description:
        "Pick curated background themes to set the mood for each room.",
    },
    {
      title: "Persistent History",
      description: "Every message is saved so you can keep up with the story.",
    },
    {
      title: "Smart Notifications",
      description: "Stay in control with a focused feed of invites and requests.",
    },
  ];

  const steps = [
    {
      title: "Create your identity",
      detail: "Add full name, username, and email to start.",
    },
    {
      title: "Upload an avatar",
      detail: "Pick a profile image from your device.",
    },
    {
      title: "Join your first room",
      detail: "Explore public rooms or request access to private ones.",
    },
  ];

  const backgrounds = [
    { label: "Sunrise", className: "bg-sunrise" },
    { label: "Ocean", className: "bg-ocean" },
    { label: "Forest", className: "bg-forest" },
    { label: "Midnight", className: "bg-midnight" },
    { label: "Sand", className: "bg-sand" },
    { label: "Cloud", className: "bg-cloud" },
  ];

  return (
    <div className="app-bg">
      <div className="relative overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-72 w-72 rounded-full bg-[#ffcfb5]/70 blur-3xl" />
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-[#bfe0ff]/70 blur-3xl" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
              PC
            </div>
            <div>
              <p className="text-sm font-semibold">PulseChat</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                Real-time rooms
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
            <a className="text-[color:var(--color-muted)]" href="#features">
              Features
            </a>
            <a className="text-[color:var(--color-muted)]" href="#rooms">
              Rooms
            </a>
            <a className="text-[color:var(--color-muted)]" href="#signup">
              How it works
            </a>
            <a className="btn btn-ghost" href="/auth">
              Start
            </a>
          </nav>
        </header>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
              Built for public and private rooms
            </div>
            <h1 className="font-display text-4xl leading-tight md:text-5xl lg:text-6xl">
              A modern chat experience that feels alive.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[color:var(--color-muted)] md:text-lg">
              PulseChat blends rich room design, real-time presence, and reliable
              history so every conversation feels effortless. Create rooms,
              manage access, and keep the energy flowing.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a className="btn btn-primary" href="/auth">
                Start chatting
              </a>
              <a className="btn btn-ghost" href="#features">
                Explore features
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--color-muted)]">
              <span>Typing indicators</span>
              <span>Saved history</span>
              <span>Invite-only rooms</span>
            </div>
          </div>

          <div className="glass relative rounded-[32px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  Live room
                </p>
                <p className="text-lg font-semibold">Aurora Lounge</p>
              </div>
              <div className="chip rounded-full px-3 py-1 text-xs font-semibold">
                42 online
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[#1d6ff2] text-center text-xs font-semibold text-white leading-9">
                  AJ
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                  Anyone up for a late-night brainstorm?
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[#ff7a59] text-center text-xs font-semibold text-white leading-9">
                  LM
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                  Yes! Dropping my moodboard now.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[#101418] text-center text-xs font-semibold text-white leading-9">
                  You
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                  I am typing
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1d6ff2]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1d6ff2] delay-150" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1d6ff2] delay-300" />
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-muted)]">
              Typing: Layla M.
            </div>
          </div>
        </section>
      </div>

      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-6 py-16"
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <p className="label">Features</p>
            <h2 className="font-display text-3xl md:text-4xl">
              Everything your community needs.
            </h2>
            <p className="text-[color:var(--color-muted)]">
              Build momentum with fast rooms, thoughtful moderation, and
              purposeful design.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="chip rounded-full px-4 py-2 text-xs font-semibold">
              MongoDB history
            </div>
            <div className="chip rounded-full px-4 py-2 text-xs font-semibold">
              Socket.IO realtime
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="soft-card rounded-3xl p-6"
            >
              <div className="mb-4 h-10 w-10 rounded-2xl bg-black text-center text-xs font-semibold text-white leading-10">
                +
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="rooms"
        className="mx-auto w-full max-w-6xl px-6 pb-16"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-[32px] p-8">
            <p className="label">Room styles</p>
            <h2 className="font-display mt-3 text-3xl">
              Pick a mood with curated backgrounds.
            </h2>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">
              Each room gets a visual identity, from calm daytime palettes to
              deep night gradients.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {backgrounds.map((bg) => (
                <div
                  key={bg.label}
                  className={`h-20 rounded-2xl ${bg.className} p-2 text-xs font-semibold text-white shadow-sm`}
                >
                  {bg.label}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="soft-card rounded-3xl p-6">
              <p className="label">Public rooms</p>
              <h3 className="mt-3 text-xl font-semibold">
                Open the doors to everyone.
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                Anyone can join and start chatting instantly.
              </p>
            </div>
            <div className="soft-card rounded-3xl p-6">
              <p className="label">Private rooms</p>
              <h3 className="mt-3 text-xl font-semibold">
                Keep sensitive conversations safe.
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                Requests and invites give you full control of membership.
              </p>
            </div>
            <div className="soft-card rounded-3xl p-6">
              <p className="label">Owner tools</p>
              <h3 className="mt-3 text-xl font-semibold">
                Review join requests in seconds.
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                Approve, reject, or invite without leaving the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="signup"
        className="mx-auto w-full max-w-6xl px-6 pb-24"
      >
        <div className="glass rounded-[32px] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="label">How it works</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">
                Simple onboarding. Fast room access.
              </h2>
              <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                Create an account in two steps, add your avatar, and jump into
                rooms immediately.
              </p>
              <a className="btn btn-primary mt-6" href="/auth">
                Create an account
              </a>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="soft-card flex items-start gap-4 rounded-3xl p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-[color:var(--color-muted)]">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-10 text-sm text-[color:var(--color-muted)]">
        <p>PulseChat, built for focused conversations.</p>
        <a className="btn btn-ghost" href="/auth">
          Start now
        </a>
      </footer>
    </div>
  );
}
