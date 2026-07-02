# Definition of Done

A task is not considered completed until it satisfies all requirements in this Definition of Done.

## 1. Code Quality

- [ ] Code compiles cleanly without errors.
- [ ] Strictly typed; `any` is not used.
- [ ] Code runs formatted cleanly by Prettier.
- [ ] ESLint Flat configuration returns zero warnings or errors.

## 2. Testing

- [ ] New functionality is covered by unit tests.
- [ ] Integration flows verified locally.
- [ ] Coverage rates meet or exceed project targets (minimum 80% coverage).

## 3. Environment & Security

- [ ] No secrets or keys committed.
- [ ] Environment variables documented in `.env.example`.

## 4. Documentation

- [ ] System architecture doc updated if boundaries change.
- [ ] Public API methods and files commented.

## 5. Integration

- [ ] Branch is rebased onto latest `main`.
- [ ] Commit history is squash-merged cleanly.
