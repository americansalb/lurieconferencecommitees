# Working in this repo

## Git workflow

Always merge to `master` after committing. After every commit on the
designated development branch, push the dev branch and then push the
same commit to `master` (fast-forward) in the same step. Do not wait
for a separate "merge it" instruction.

Concretely, after each commit run:

```
git push -u origin <dev-branch>
git push origin <dev-branch>:master
```

If the push to `master` is not a clean fast-forward, stop and ask
before doing anything destructive, investigate the divergence first.

Do not open a pull request unless the user explicitly asks for one.

## Writing

No em dashes. Not in website copy, not in emails, not in anything a
recipient or visitor reads. Use a comma, a colon, a full stop, or
rewrite the sentence. This is a hard rule, not a preference: an em
dash is one of the loudest tells that a machine wrote the text, and
these letters only work if they read as written by a person.

Never invent something the sender did. A published fact about the
recipient is fine, because it is on a page and we can point at it if
they ask. A claim about what Kevin personally read, watched, looked
up, checked or asked around about is not, unless he actually did it.
"I looked up what it meant before writing to you" is the shape to
watch for: it manufactures a private act to buy warmth, and it falls
apart the moment someone replies asking which study, which report, or
who else was asked. Say the fact. Say what you want to ask them. Do
not narrate research that may not have happened.

## Database safety

This Postgres database is shared with other apps. Prisma must stay
isolated to the `lcc` schema. The build script must never include
`--accept-data-loss` and must never `prisma db push` against `public`.
