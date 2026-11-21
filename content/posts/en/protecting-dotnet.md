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

As of now (2025-11-09) the .NET ecosystem still has the same old problem. An assembly containing IL can be decompiled into readable C#, with some limitations.

Many developers who ship a .NET project publicly and sell it run into this. Most often it hits software licensing; sometimes it is about protecting intellectual property (the code) from being read or modified.

So the question is: *if .NET is "leaky", how do you deal with it?*

This is where different protection approaches come in:

1. Code obfuscators
2. Custom .NET builds (`dotnet publish` with a modified .NET runtime)
3. Code virtualizers (a VM for IL opcodes)
4. Compiling IL to native code ahead of time with .NET Native AOT or Unity IL2CPP

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

After (a simplified example of renaming and control-flow obfuscation):

```csharp
public bool m0(string s0)
{
    int state = 0x5A2;
    while (true)
    {
        switch (state ^ 0x5A3)
        {
            case 1:
                if (s0.Length != (0x1F >> 1) + 1)
                    return false;
                state = 0x5A1;
                break;
            case 2:
                return s0.StartsWith("GM-");
            default:
                throw new System.InvalidOperationException();
        }
    }
}
```

The upsides:

1. **You can adopt it gradually** — start by renaming internal types and methods, then enable other transformations as you verify the resulting build.
2. **Easy to use** — no deep knowledge required: plug it in and go.

The downsides:

1. **Weak protection** — obfuscation only makes reverse engineering harder. With a public obfuscator there is a good chance it can be deobfuscated, for example with the popular `de4dot` tool and its many community forks tailored to specific scenarios.
2. **The release build needs testing** — renaming can break code that looks up types and properties by name through reflection. Check serialization and plugin loading as well.

| Pros | Cons |
| --- | --- |
| You can adopt it gradually | Weak protection |
| Easy to use | The release build needs testing |

## 2. Custom .NET builds

When you publish an app as `self-contained`, the version of .NET it needs ships with it. The user can run it without installing the runtime separately. This mode uses the standard runtime and can ship application assemblies containing ordinary IL. [Publishing .NET apps](https://learn.microsoft.com/dotnet/core/deploying/)

A custom build starts when you change the runtime itself. For example, you could change the format in which a custom loader receives some of the code. The app then depends on a particular runtime, which you have to ship alongside it. To execute the code, the runtime still needs to obtain it in a form it understands.

The main cost is maintenance. Each .NET update means carrying your changes forward, rebuilding the runtime for every supported platform, and testing the finished package. A security update to the system's .NET installation won't patch the copy that ships with the app. [Building CoreCLR from source](https://github.com/dotnet/runtime/blob/main/docs/workflow/building/coreclr/README.md)

## 3. Code virtualization

Take one method, translate its logic into instructions for a custom interpreter, and ship that interpreter with the app. The method's IL now mostly calls the interpreter, while the logic lives in the sequence of instructions the interpreter executes.

Consider a method that does `return x + 1`. A simple stack VM can do it in four instructions. Push `x`, push `1`, add the top two values, and return the result. A real method can also have branches, calls, and exceptions. For each of those constructs, you have to define the behavior and verify that it matches the original method.

To analyze a virtualized method, you first have to understand what the interpreter's instructions mean. The extra layer also comes at a cost to the developer. The interpreter's overhead is especially noticeable in hot loops, and transformed methods are harder to debug. Start with a few small methods, then measure performance and test edge cases on the build you actually ship.

## 4. Compiling to native code

**Native AOT** compiles IL to machine code at publish time. The result targets a specific platform, such as Windows x64 or Linux Arm64, and runs without a JIT compiler. **ReadyToRun** adds precompiled code to assemblies that still contain IL. [Native AOT](https://learn.microsoft.com/dotnet/core/deploying/native-aot/) · [ReadyToRun](https://learn.microsoft.com/dotnet/core/deploying/ready-to-run)

What does that buy you? A method compiled with Native AOT has to be examined as machine code. Its algorithm still runs on the user's machine. AOT also affects how you write the application. The publish-time analyzer has to determine which code and metadata will be needed at runtime. Test reflection on the published build and replace any runtime code generation that relies on `Reflection.Emit`.

Unity has its own route with **IL2CPP**. It translates IL to C++, and a platform compiler turns that C++ into machine code. This is part of Unity's build pipeline. For a regular .NET project, Native AOT is the corresponding publish option. [Unity's IL2CPP documentation](https://docs.unity3d.com/6000.0/Documentation/Manual/il2cpp-introduction.html)

## What this means for licensing

Back to `CheckLicense` from the beginning. Checking the length and prefix shows how obfuscation changes the shape of a method. A real license check also needs to verify who issued the license. For offline use, the publisher signs the license data with a private key, and the app verifies the signature with a public key. Include every field that affects what the user is entitled to, such as the expiry date and enabled features. [.NET digital signature verification](https://learn.microsoft.com/dotnet/api/system.security.cryptography.ecdsa.verifydata)

The signature protects the license data against forgery as long as the client performs verification as intended. If a paid feature calls your server, have the server check whether the user is entitled to the operation. For an entirely offline app, weigh obfuscation, virtualization, or AOT by how much work they add to analysis and how much they cost to ship and maintain.
