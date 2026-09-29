# Passman — Password Strength & Breach-Pattern Checker

A browser extension (Chrome/Edge/Brave, Manifest V3) that scores password
strength from real entropy math instead of regex rules, and checks passwords
against a small local list of commonly leaked/breached passwords — entirely
on-device, with zero permissions and zero network calls.

## Install (load unpacked)

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this `passman/` folder.
4. Pin the Passman icon to your toolbar if you want the popup handy.

That's it — no build step, no dependencies.

## What it does

- **Popup tester**: click the toolbar icon, paste any password, and see its
  entropy in bits, character-pool size, breach-list status, and any
  predictable pattern it contains.
- **Live page checker**: a content script watches every
  `<input type="password">` on any page you visit. While you type, a small
  badge appears under the field showing the same strength/breach verdict —
  useful for judging a password *while signing up*, not after.

Both surfaces call the exact same scoring function (`common.js`), so they
never disagree.

## Why entropy, and not regex rules

A composition rule like "at least one uppercase letter, one digit, one
symbol" only checks whether a character class is *present*. It scores
`Passw0rd!` the same as a truly random 9-character string with the same
classes — but `Passw0rd!` is one of the first few thousand guesses in any
real cracking dictionary, because humans overwhelmingly build passwords the
same predictable way (capitalize the first letter, append a couple of
digits, tack on `!`).

Entropy instead asks a different, more useful question: **given the
character classes a password draws from, how large is the space of equally
likely passwords an attacker has to search?**

```
pool  = size of the character set in play (lowercase=26, +uppercase=26, +digits=10, +symbols=33, ...)
bits  = length × log2(pool)
```

That number of bits is what actually predicts brute-force cost — doubling
it roughly squares the search space. It naturally rewards length (which
regex rules under-value) and doesn't over-reward "has a symbol somewhere"
on an otherwise short password.

Pure keyspace entropy still has a blind spot, though: it assumes every
character was chosen independently at random, which over-scores patterned
passwords like `Password123!` or `qwertyuiop`. Passman corrects for that in
two ways before producing a final verdict:

1. **Pattern penalties** — sequential runs (`1234`, `abcd`), repeated
   characters (`aaaa`), keyboard walks (`qwerty`, `asdf`), and the generic
   "Word + digits (+ symbol)" shape each subtract bits from the raw entropy
   score, because they shrink the *real* search space a cracker needs to try.
2. **Local breach-list matching** — checked against a bundled list of
   passwords that dominate public breach-corpus frequency studies (plus
   leet-speak variants and "known-word + trailing digits" shapes like
   `dragon99`). A match effectively caps the score regardless of raw
   entropy, since these are guessed near-instantly in practice.

## Local breach list, not a live lookup

The brief specifically calls for a **small public/local password list**
rather than an online breach-checking API — `breach-data.js` bundles a few
hundred of the most consistently common passwords from public breach
frequency studies, as a flat array. This keeps the extension:

- **Private** — no password is ever sent anywhere, including to a "have I
  been pwned"-style API; everything happens in the content script /
  popup's own JS.
- **Permission-free** — the manifest requests zero permissions and makes
  zero network requests, so nothing to review or trust beyond "does this
  code do what it says."
- **Offline-capable** — works with no connectivity.

It is deliberately *not* a substitute for a full breach corpus — it's a
fast local check against the passwords attackers try first, matching the
spirit of the assignment rather than shipping a multi-gigabyte dataset.

## File layout

```
passman/
├── manifest.json     # MV3 manifest — popup + content script, no permissions
├── common.js          # entropy math, pattern detection, breach matching (shared)
├── breach-data.js      # local common-password / breach-pattern list
├── popup.html/css/js   # toolbar popup — paste-a-password tester
├── content.js/css      # live badge on any page's password field(s)
└── README.md
```

## Limitations

- The breach list is small and illustrative, not exhaustive — a password
  not on the list isn't guaranteed safe, just not in this particular set.
- Keyspace entropy assumes worst-case randomness within the detected
  character classes; the pattern penalties catch the most common
  predictable shapes but aren't an exhaustive cracking model.
- The live badge only inspects `<input type="password">` elements; it
  won't catch custom JS-only password widgets that don't use that input type.
