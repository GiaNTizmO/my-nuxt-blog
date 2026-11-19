---
title: A Git history worth reading
date: '2026-10-21'
description: "Commits as an explanation of decisions: what changed, why, and how to verify it."
category: tools
tags: [Git, teams, documentation]
demo: true
art: system
---
## Every change has a reason

A diff shows which lines changed. A commit message can explain why. When the message only repeats what is obvious from the code, the history loses part of its value.

A useful commit answers a specific question a future reader will have: what problem did this change solve?

## One complete step

Try to group changes that can be explained by a single idea. That is not always one file, and not necessarily a small diff. What matters is that the reason is coherent.

If variable renames are mixed with a behaviour fix, the reader has to untangle one from the other on their own.

## Check before you commit

```bash
git status --short
git diff
git diff --staged
```

The last command shows exactly what will go into the commit. It is a good moment to catch a stray log line, a local setting, or a file that has nothing to do with the task.

## A message without filler

Instead of "fixes", name the observable problem. If needed, add a short explanation in the body:

```text
Keep the filter when returning to the list

Opening an article used to reset the selected category.
The list now restores it for the current session.
```

This way the history becomes an extra layer of documentation. It does not replace the code, but it helps you understand the conditions under which a decision was made.
