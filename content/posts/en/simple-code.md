---
title: Simple code is work, not luck
date: '2026-11-08'
description: Why the clear solution often shows up only after the complicated one is already written.
category: code
tags: [architecture, refactoring, readability]
demo: true
art: code
---
## Complexity creeps in

First we solve one problem. Then comes an exception, an extra parameter, and a special case for one particular client. A few iterations later the function tells the story of every change instead of explaining what it is for.

Simplicity rarely appears in the first draft. More often it is the result of a second pass, when a working solution already exists and you can look at it through the eyes of a future reader.

## Names are part of the interface

Compare two calls:

```javascript
process(items, true, false);

publishArticles(items, {
  includeDrafts: false,
  notifySubscribers: true,
});
```

The second one is longer, but it leaves less to guess. The reader does not need to open the function definition to understand what the boolean arguments mean.

This is not a blanket ban on short names. Context matters: `i` in a three-line loop and `data` in a two-hundred-line function demand very different amounts of attention.

## One reason to change

A useful question: why might this function change? If the answer mixes date formatting, a business rule, and a network request, the boundaries of responsibility probably have not emerged yet.

But splitting has a cost too. Five tiny functions with vague names can be harder to read than one sequential block.

> A good abstraction removes the need to remember details, rather than just moving them to another file.

## A short checklist for the second pass

- Can a variable be named so that the comment becomes unnecessary?
- Which branches handle the same idea?
- Which states does the interface allow even though they make no sense?
- Is it clear enough what happens on error?

Stop when the next step makes the explanation harder more than it makes the task easier.
