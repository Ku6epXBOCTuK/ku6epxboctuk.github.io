---
title:
  'Anatomy of a Ban: Why "Login with GitHub" Is the Biggest Architectural
  Mistake of Your Life'
---

Two weeks ago, I was a regular developer. I had working services, a public
portfolio, an accepted PR in open-source, and convenient "Login with GitHub" on
two dozen sites.

Today, I don't exist.

My laptop screen greets me with a dark message:

**"Your account has been suspended. TOS violation."**

No link to the violated clause. No "you did X, which violates Y". No suspension
period. No name of a person to write to. Just a dry formulation that reeks of
automation. There was no human on the other side — an algorithm sneezed, and I
ceased to exist.

GitHub flipped a switch. And didn't even look to see what went dark.

I did everything "by the book": I contributed to open-source (my PR is in
**cocogitto**), set up services, trusted the platform. But to GitHub's
algorithm, I'm not an engineer. I'm just a row with `is_active: false`.

<!--more-->

## Act 1. Anatomy of a Cascading Failure: 7 Projects and 10+ Services in 1 Second

### 1. GitHub Pages

Here's what was hosted on GitHub Pages and died in an instant:

- **CSS Matrix3D Perspective Calculator** — a tool for calculating CSS
  `matrix3d()` distortion. Designers and frontend developers used it daily.
- **Twitch Panels Creator** — a panel generator for Twitch channels. Svelte 5,
  Konva.js, dark/light theme, PNG/ZIP export.
- **Shooting Word** — an interactive Twitch chat game. Waves, bosses,
  leaderboard. OBS Browser Source.
- **Now Playing Widget** — a minimal OBS widget showing the current track from
  AIMP/Foobar2000/MusicBee. One HTML file.
- **XBOCT Page** — a browser start page with bookmark management. Svelte 5,
  TypeScript, Chrome Extension.
- **Idle Tower Defence** — a game built with Three.js + miniplex + Svelte
  (unfinished).
- A personal portfolio site with terminal-style ASCII art.

And that's not counting the Gists, POCs, and concepts that couldn't be cloned
locally — they're gone forever.

All of them ran on GitHub Pages. One account — and every single page went down.

### 2. is-a.dev

I owned a `*.is-a.dev` domain. The mechanics are tied to GitHub: you commit a
JSON file with DNS records to the registry repository, it gets reviewed, and the
domain resolves. Account frozen — I can't make a commit.

Then the surrealism kicks in.

GitHub, which has been ignoring me for two weeks, sends me an email: _"We are
unable to find a verification TXT record on your domain. Please verify your
domain within 7 days."_

You locked me out, threw away the keys, and now you're knocking on the window
demanding I tidy up the apartment? You can't answer **"why was I banned?"** in
two weeks, but I'm supposed to solve your DNS problem in 7 days — a problem I
can't access because you banned me?

I can't log in. I can't make a commit. I can't even "check in" to avoid being
pruned for inactivity. is-a.dev periodically cleans up old domains — and I have
no way to stop it.

And this isn't just "oh, my domain won't resolve." It's a security
vulnerability. My domain now points to a non-existent page — anyone could
perform a subdomain takeover and serve their own content there. And I can't even
prevent that.

### 3. GitHub OAuth — The Black Hole

Like thousands of developers, I got used to clicking **"Login with GitHub"**
everywhere I could. It's convenient, right? One click and you're in.

Now imagine losing access to your email inbox. To every social network. To every
bank notification. That's what it means to lose GitHub OAuth when it's your
single sign-on for everything:

- **Netlify** — deploys, domains, settings. GitHub-only login.
- **Vercel** — same story.
- **Railway** — production projects, databases, environments.
- **CircleCI, Travis CI** — CI/CD that's no longer yours.
- **CodeSandbox** — code sandboxes.
- **Replit** — projects.
- **Gitpod** — dev environments.
- **Zeplo** — API keys, webhooks.
- **ESLint, npms.io, bundlephobia** — minor, but they still require login.
- **pollinations.ai** — image generation, GitHub-only login.

Dozens of services. Years of code, configuration, integrations. One **"Login
with GitHub"** button — and when GitHub pulls the plug, every door slams shut at
once.

And it's not just the past — it's the future you can't even start. An MVP for my
new game would take 4 hours to build, but I've been waiting for unban for two
weeks. The service I need has no email login — only GitHub. Four hours of work
blocked by a ban I had nothing to do with.

## Act 2. AI-Powered Support

GitHub's tagline is _"The AI-powered developer platform"_.

Now I understand what AI-powered means. It means a dumb script handles the ban,
and an autoresponder handles support — sending you to a forum where you can't
post because you're banned. Great ecosystem, 10 out of 10.

I contacted support. Explained the situation in detail. Asked for an
explanation.

A few minutes later, the automated reply arrived:

> _"Thank you for contacting GitHub Support. … We are experiencing high volumes…
> You can also post a question in the GitHub Community."_

"Ask the community!" — but I can't log in. My account is suspended. Literally:
"we can't help, ask other users" — but to ask, you need an account you no longer
have.

Two weeks. Zero human responses.

Banning takes 5 minutes. Figuring things out takes an eternity. GitHub spends
seconds destroying years of your work and weeks to even answer the question
**"why?"**.

There's simply no human there. GitHub Support is a facade. An empty void behind
it. And all your services are already down.

## Act 3. If 30,000 Stars Aren't Enough

I'm not alone.

The same day, the developer of **zapret** (Flowseal) got caught in the same
sweep — a repository with 30,000+ stars and thousands of forks. The algorithm
sneezed, and 30k stars weren't enough to stop it.

If your anti-fraud system can wipe a 30,000-star repository and its maintainer's
account in 5 minutes — a tool used by hundreds of thousands of people — then
your system doesn't protect the platform. It's incompetent. You built an
algorithm with a rocket launcher instead of a scalpel.

Big projects with thousands of stars sometimes get reinstated — because the
author's visibility draws attention, and the ticket gets handled faster. Regular
developers don't have that leverage.

And that proves the point: GitHub has no transparent justice system. If you
don't have an army of followers, a popular repository, or a viral thread —
you're just digital dust in an endless ticket queue that nobody's in a hurry to
service.

There are dozens of similar stories scattered across the internet — people
losing accounts after a routine push, after an automated repo scan, after a
false positive from the fraud detection system. GitHub doesn't investigate —
GitHub bans.

If your account can be taken down just as easily as mine — what's there to say?
If 30k stars aren't enough to save you, your 5 stars certainly won't be.

## What to Do Before the Algorithm Sneezes in Your Direction

I don't expect GitHub to read this article and unban me. I hope for something
else.

### GitHub OAuth Isn't Your Auth System. It's a Rental.

You have no contract. No SLA. No guarantee that the login button will work
tomorrow. There's only an algorithm that, without warning, wipes out years of
your work in an instant.

One flag in a database — and you're a digital outcast.

### What to Do Right Now

1. **Export your data.** Regularly. Because one day, you might not have time.
2. **Make a list of every service you log into with GitHub.** Next to each one,
   write: "What will I do if this button stops working tomorrow?" If you don't
   have an answer — you have a problem.
3. **Boycott services that offer ONLY GitHub OAuth.** Email + password or
   another provider is the bare minimum. If a service skimps on that — they're
   skimping on you.
4. **Set up an alternative login method and save recovery codes right now.**
   Make sure every critical service (Vercel, Netlify, Railway) has an
   alternative login method — email/password or Google OAuth — while you still
   have access.

## Final Words

GitHub suspended my account. Without warning. Without explanation. Without the
right to defend myself.

My services are dead. My domain doesn't resolve. My digital passport no longer
opens any doors.

All because one flag in someone else's database flipped from 0 to 1.

Next time you click **"Login with GitHub"**, remember: you're not logging in.
You're asking for permission to enter a house whose keys belong to someone else.
And at any moment, that someone might simply not open the door.

If I get unbanned, I'll keep using GitHub. Not because I trust it, but because
it's a monopoly. But from now on, GitHub isn't a "home for code" to me — it's
unreliable infrastructure. Every Gist will be duplicated locally. Every issue
will have a backup. And the "Login with GitHub" button is dead to me forever.

GitHub teaches us architecture by example: **never build a system with a single
point of failure.** Especially when that point can cut you off by mistake and
stay silent for weeks.
