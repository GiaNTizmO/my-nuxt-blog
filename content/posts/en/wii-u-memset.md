---
title: "Wii U Internals: How I came to use dcbz in memset"
date: '2026-11-22'
description: "Measurements on a real Wii U showed when dcbz speeds up writes. Here’s how I used it in memset and checked that every fill stayed within bounds."
category: code
tags: [Wii U, Espresso, PowerPC, C++]
art: cache
---

On November 4 I ran RAGE HW Bench on a real Wii U. An ordinary loop wrote 8 MiB at about 165 MB/s. In the second loop I did an extra bit of work before writing each group of eight words: I zeroed the space they were about to occupy. Write speed jumped to about 1,017 MB/s. The game wasn't using that trick yet. That measurement was where my Espresso version of memset began.

**What RAGE HW Bench measured.** I pinned the benchmark thread to Espresso core 2 and ran two loops. The first wrote consecutive 32-bit words. The second issued the PowerPC instruction `dcbz` before writing each new cache line, then wrote the same eight words. Both loops computed the data they wrote as they went. The log directly compares those two write loops. It doesn't give separate timings for calls to `memset(p, 0, n)` and `memset(p, 0xA5, n)`.

I repeated the measurement on hardware on November 12. Both pairs of bars use the same scale. Longer bars mean faster writes. Buffer sizes are in binary units, and throughput is in millions of bytes per second.

~~~text
                     Wii U write speed, MB/s
  8 MiB   plain      ██                       164.4
          with dcbz  ██████████             1,016.8

128 KiB   plain      ██████████████████     1,807.9
          with dcbz  █████████████          1,275.5
~~~

At 8 MiB I got a **6.18×** speedup. At 128 KiB the plain loop won, running **1.42×** as fast as the `dcbz` version. Looking at the top pair alone, I'd have been tempted to use the instruction in every fill. I'm glad the second pair was in the log.

Why those sizes? This core has 512 KiB of L2 cache. The small buffer fits entirely in L2, and the large one doesn't. The benchmark addresses are 64-byte aligned. Each loop makes one warm-up pass over the buffer before timing starts. The timed section then makes four passes over the large buffer or 256 over the small one, for the same 32 MiB of writes in either case. I didn't flush the cache between passes. When I say “cold” here, I mean a long sweep over more data than L2 can hold. Individual accesses can still hit the cache.

**Where the extra reads come from.** Espresso has 32-byte cache lines. When an ordinary store touches a line that isn't in the cache, the processor usually fetches it from memory first. That makes sense for a single-byte store because the other 31 bytes need to survive. If I'm about to overwrite all 32, though, the processor has just fetched data it's going to throw away.

`dcbz` (*data cache block zero*) gives me a zero-filled line without reading its old contents. For `memset(p, 0, n)`, that takes care of a whole line. For a fill with `0xA5`, I follow it with eight stores of the word `0xA5A5A5A5`. Why write zeroes when I want something else? To skip the wait for the old bytes. With a small, warmed-up buffer, that wait is often gone already, and the extra instruction is still there. One more detail: those zeroes are in the CPU cache. If GX2 reads the buffer next, making the data visible to the GPU is still a separate step.

**What made it into the port.** The original newlib-style implementation already wrote whole words. It handled a few leading bytes to reach alignment, wrote four 32-bit words per iteration, then took care of the remainder. In build 327 I kept that path for requests **under 128 bytes**. For requests of 128 bytes or more, the code uses ordinary stores to reach a 32-byte boundary before filling whole cache lines. It also uses ordinary stores for any partial line at the end. The port's threshold is 128 **bytes**. The smaller benchmark buffer was 128 **KiB**. Two buffer sizes aren't enough to pin down an ideal cutoff.

Here's the code from my platform file, `cafe_memops.cpp`. The eight assignments in the loop show exactly where a fill with an arbitrary byte differs from a zero fill.

~~~cpp
inline void Dcbz(void* p) { __asm__ volatile("dcbz 0,%0" : : "r"(p) : "memory"); }

CAFE_MEMOPS_NOPATTERN void* FastMemset(void* dst, int c, size_t n)
{
    if (n < 128) return SlowMemset(dst, c, n);
    unsigned char* p = static_cast<unsigned char*>(dst);
    const unsigned char v = static_cast<unsigned char>(c);
    while (uintptr_t(p) & 31) { *p++ = v; --n; }
    const uint32_t w = v * 0x01010101u;
    while (n >= 32) {
        Dcbz(p);
        if (w) {
            u32a* q = reinterpret_cast<u32a*>(p);
            q[0] = w; q[1] = w; q[2] = w; q[3] = w; q[4] = w; q[5] = w; q[6] = w; q[7] = w;
        }
        p += 32; n -= 32;
    }
    while (n--) *p++ = v;
    return dst;
}
~~~

The u32a type lets GCC store 32-bit words while respecting its aliasing rules. The macro before the function keeps the compiler from turning a recognizable fill loop into a library call: I'm implementing memset itself here. For a zero fill, the condition inside the loop is false. Dcbz has already done all the writing that line needs. For any other fill byte, multiplying by 0x01010101 copies it into all four byte positions of the word.

I take an aligned array and fill 130 bytes starting at offset 5. I leave a marker on either side:

~~~cpp
alignas(32) unsigned char buf[160]{};
buf[4] = 0x11;
buf[135] = 0x22;
FastMemset(buf + 5, 0xA5, 130);

assert(buf[4] == 0x11 && buf[135] == 0x22);    // neighboring bytes are intact
assert(buf[5] == 0xA5 && buf[134] == 0xA5);    // first and last bytes of the fill
~~~

| Byte range | What FastMemset does |
|---|---|
| 5–31: first 27 bytes | Writes one byte at a time until the address is a multiple of 32. |
| 32–127: three whole lines | Issues dcbz for each line, then writes eight words of 0xA5A5A5A5. A zero fill would take just one dcbz per line. |
| 128–134: last 7 bytes | Writes the remaining bytes one at a time. |

Calling Dcbz(buf + 5) straight away would zero the line **containing** that address: bytes 0–31. The 0x11 marker would disappear. The plain loop has no such constraint. It writes exactly the bytes or words I tell it to. With dcbz, the opportunity for a speedup comes when I can overwrite the entire line and save a read from memory. Even then, the state of the cache matters, as the lower pair of bars shows.

There's another limit. This path assumes ordinary cacheable memory with a write-back policy. It's unsuitable for device registers. If GX2 reads the buffer after the CPU has written it, the code that hands the buffer over is still responsible for making those writes visible to the GPU.

**How I checked for stray writes.** At game startup, the test prepared two arrays with the same pattern. It ran the fast fill on one and filled the same range byte by byte in the other. Then it compared the **entire arrays**, including the bytes before and after the requested range. It tried offsets from 0 through 31, lengths on either side of the boundaries (31/32/33 and 127/128/129), and a zero-length request. The fill values were zero and `0xA5`. That second value also catches an implementation that somehow turns every fill into a zero fill. In two runs of build 327 in Cemu, the combined `memset` and `memcpy` test reported **13,377 checks and zero mismatches**. I kept a switch to go back to the ordinary loops for debugging.

That's why both paths stayed in the port. A large zero fill takes one instruction per full line. For a short request, the plain loop can get straight to work without lining up the boundaries. As for which loop is faster on data that's already warm, take another look at the 128 KiB result.
