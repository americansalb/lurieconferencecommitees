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
before doing anything destructive — investigate the divergence first.

Do not open a pull request unless the user explicitly asks for one.

## Database safety

This Postgres database is shared with other apps. Prisma must stay
isolated to the `lcc` schema. The build script must never include
`--accept-data-loss` and must never `prisma db push` against `public`.
