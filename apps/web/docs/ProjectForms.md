# Project Forms

Project forms use React Hook Form with Zod resolvers and mirror backend limits:

- Name: required, maximum 100 characters.
- Slug: 3–64 lowercase alphanumeric or hyphen characters.
- Description: maximum 500 characters.
- Metadata and settings: valid JSON objects.
- Organization: required UUID on creation.

The creation slug follows the name until the user edits it manually. Metadata and
settings editors preserve nested JSON values and reject arrays, primitives, and
invalid JSON. Submission errors leave entered values intact and surface a toast.

Developers receive disabled name, description, and settings controls. Their save
payload includes metadata only, matching backend authorization.
