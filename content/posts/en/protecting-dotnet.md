---
title: Protecting .NET applications
date: '2025-11-09'
description: "A deep dive into protecting .NET software: how it is protected and how it is cracked."
category: reverse
tags: [.NET, C#, obfuscation, reversing]
featured: true
wip: true
art: reverse
---
## Intro

Today we will look at how software built on .NET can be protected.

As of now (2025-11-09) the .NET ecosystem still has the same old problem: a compiled binary can be decompiled almost back to source code* (with some limitations).

Many developers who ship a .NET project publicly and sell it run into this. Most often it hits software licensing; sometimes it is about protecting intellectual property (the code) from being read or modified.

So the question is: *if .NET is "leaky", how do you deal with it?*

This is where different protection approaches come in:

1. Code obfuscators
2. Custom .NET builds (`dotnet publish` with a modified .NET runtime)
3. Code virtualizers (a VM for IL opcodes)
4. Recompiling .NET (the IL stack) to native code (x86/x64, Arm64): the AOT compiler (formerly known as Mono AOT), il2cpp

Let's go through how each of them works in theory.

## 1. Code obfuscation

This process edits the project before (or right after) compilation: it renames variables, moves code around, adds junk and meaningless code, plus special code and attributes designed to confuse disassemblers.

**Obfuscation example**

Before:

```csharp
public bool CheckLicense(string key)
{
    return key.Length == 16 && key.StartsWith("GM-");
}
```

After:

```csharp
public bool \u0002(string \u0003)
{
    int num = 1;
    while (true)
    {
        switch (num ^ 0x5A3)
        {
            case 0x5A2: if (\u0003.Length != (0x1F >> 1) + 1) return false; num = 0x5A1; break;
            case 0x5A0: return \u0003.StartsWith(\u0005.\u0002(0x3C));
            default: num = 0x5A3; break;
        }
    }
}
```

The upsides:

1. **It just works** — the changes are made at a stage after which the code still passes all compiler checks, so the resulting binary is guaranteed to run.
2. **Easy to use** — no deep knowledge required: plug it in and go.

The downsides:

1. **Weak protection** — obfuscation only makes reverse engineering harder. With a public obfuscator there is a good chance it can be deobfuscated, for example with the popular `de4dot` tool and its many community forks tailored to specific scenarios.

| Pros | Cons |
| --- | --- |
| It just works | Weak protection |
| Easy to use | |

## To be continued

Sections on custom .NET builds, virtualizers and AOT recompilation are being written.
