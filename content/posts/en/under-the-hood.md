---
title: What happens behind a function call
date: '2026-11-12'
description: From everyday code down to CPU instructions. A short trip one level deeper.
category: reverse
tags: [C, assembly, research]
demo: true
art: reverse
---
## One line, several layers

A function call looks like a simple action. We pass arguments, get a result, and move on. But the CPU does not know about functions in the way a programmer thinks about them.

To see the difference, a tiny program whose source is fully under our control is enough.

```c
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main(void) {
    printf("%d\n", add(20, 22));
    return 0;
}
```

There is no complex logic here, and that is exactly why the example is handy: the details do not get lost behind the problem domain.

## Start with a question

It is more useful to start an investigation with a specific question than with a huge dump. For example: where do the arguments `a` and `b` end up, and how does the value get back to the caller?

The answer depends on the architecture, the calling convention, the compiler, and optimisations. There is no single picture that holds for every system.

With GCC on an x86-64 machine you can get an assembly listing like this:

```bash
gcc -O0 -S -masm=intel example.c -o example.s
```

The `-S` flag stops the build after generating assembly text. `-O0` makes it easier to map the simple source to the output, although it does not promise a literal translation of every line.

## What to look for in the listing

Start at the `add` label. Trace where the input values come from, which instruction performs the addition, and where the result ends up. Under System V AMD64, the first two integer arguments are usually passed in `edi` and `esi`, and an `int` result is returned in `eax`.

| Language level | Execution level |
| --- | --- |
| Function arguments | Registers or stack, per calling convention |
| Local variables | Registers, memory, or eliminated entirely |
| Return value | Location defined by the calling convention |
| Function call | Transfer of control, unless the call is eliminated |

The most important part of the exercise is the connection between these layers, not memorising mnemonics.

## Optimisation changes the picture

Now replace `-O0` with `-O2` and compare the two listings. The compiler may inline the function, compute the constant expression ahead of time, or drop intermediate values.

```bash
gcc -O2 -S -masm=intel example.c -o example.optimized.s
diff -u example.s example.optimized.s
```

So a missing instruction is not always an observation mistake. Sometimes the action you were looking for already happened at compile time.

> A good habit: change one parameter at a time and write down which observation it changed.

## What to keep after the experiment

Write down the compiler version, the architecture, the flags, and the source. Without them, a nice screenshot of a listing quickly turns into a mystery.

A small reproducible example gives you more than dozens of pages of random disassembly. It lets you test hypotheses and gradually build your own understanding.
