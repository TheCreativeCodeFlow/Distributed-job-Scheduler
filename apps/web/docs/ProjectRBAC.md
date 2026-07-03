# Project RBAC

The UI mirrors the backend project authorization matrix.

| Capability         | System admin | Org owner | Org admin | Project maintainer | Developer | Read only |
| ------------------ | ------------ | --------- | --------- | ------------------ | --------- | --------- |
| View projects      | Yes          | Yes       | Yes       | Yes                | Yes       | Yes       |
| Create project     | Yes          | Yes       | Yes       | Yes                | No        | No        |
| Edit configuration | Yes          | Yes       | Yes       | Yes                | No        | No        |
| Edit metadata      | Yes          | Yes       | Yes       | Yes                | Yes       | No        |
| Archive or restore | Yes          | Yes       | Yes       | Yes                | No        | No        |

Buttons and settings sections are hidden or disabled according to the current
authenticated role. These checks improve usability but do not replace backend
authorization; every mutation remains protected by the API.
