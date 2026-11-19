---
title: The line between "convenient" and "too clever"
date: '2026-10-15'
description: When an abstraction helps the team, and when it forces everyone to learn yet another tiny framework.
category: code
tags: [API design, abstractions, teams]
demo: true
art: code
---
## Abstractions promise savings

A shared helper appears naturally: several similar snippets beg to be merged. But similar lines do not mean similar meaning.

Two operations can look identical today and change for completely different reasons tomorrow. Couple them too early and every change will need new parameters and conditions.

## A good interface limits choice

A convenient interface makes the typical case simple and the wrong state visible. It does not have to support every imaginable option from day one.

```javascript
function formatArticleDate(date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
```

This function solves one clear problem. It does not need a plugin system, a format registry, or its own configuration language yet.

## The explanation test

Try describing the new abstraction to a colleague without showing the implementation. If the explanation starts with a long list of exceptions, the interface has probably not settled yet.

That does not mean complex systems are always bad. Sometimes the complexity matches the problem. The question is how much of it the users of your code actually need to see.

## Leave room to observe

A bit of duplication can be a temporary price for understanding. Once real change scenarios show up, it becomes easier to draw the boundary and pick a shared name.

The key is to come back to the decision deliberately, rather than treating every repetition as the final shape of the project.
