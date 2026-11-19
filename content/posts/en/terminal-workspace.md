---
title: A terminal you actually want to work in
date: '2026-11-03'
description: Less visual noise, more context. A few principles for setting up your workspace.
category: tools
tags: [terminal, tools, workflow]
demo: true
art: terminal
---
## Your environment should help you notice things

A good terminal setup shows what you need at the right moment: the current directory, the exit status of the last command, the repository branch. Everything else is useful only until it starts competing for attention.

You can start without a big collection of plugins. A readable font, a calm palette, and a short prompt are enough.

## Colour should mean something

If everything is highlighted, colour stops helping. Keep a bright accent for errors or changed state. For the rest, two or three levels of contrast are enough.

Test your theme on long output and in daylight. A pretty screenshot does not always mean a comfortable workspace.

## Short commands without riddles

Aliases help when their meaning is easy to recall:

```bash
alias gs='git status --short'
alias gl='git log --oneline --decorate -12'
```

Dangerous or rarely used operations are better left explicit. A few saved keystrokes are not worth losing track of what is about to happen.

## Your config is a project too

Keep non-secret config files under version control. Separate shared settings from machine-specific ones. Never commit keys, tokens, or shell history to a public repository.

A minimal README explaining the setup is often more useful than another plugin. A year from now it will save you time rebuilding your own system.
