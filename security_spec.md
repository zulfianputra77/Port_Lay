# Security Specification & Dirty Dozen Payloads

## Data Invariants
1. Public website configuration (`/portal/main`), visible service cards (`/services/{serviceId}` where `visible == true`, `limit <= 200`), and hero background slides (`/heroSlides/{slideId}` where `portalId == 'main'`, `limit <= 50`) are readable by visitors, while **only** verified Admins (`email_verified == true` and either the bootstrapped admin email `zulfianputra77@admin.smp.belajar.id` or an entry in `/admins/{uid}`) may create, update, or delete them.
2. All document IDs (`docId`, `serviceId`, `slideId`, `uid`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
3. `/portal/{docId}` strictly restricts writes and reads to the singleton document ID `main` and forbids deletion.
4. Every string field and array field enforces strict `.size()` upper bounds, preventing oversized payload / Denial of Wallet attacks.
5. All `createdAt` and `updatedAt` fields must equal `request.time` on creation, `createdAt` is immutable on update, and `updatedAt` must equal `request.time` on update.
6. `/admins/{uid}` is strictly isolated from public reads and lists, and only the bootstrapped primary admin (`zulfianputra77@admin.smp.belajar.id` with `email_verified == true`) can create, update, or remove admin records.

## Dirty Dozen Payloads (Must All Return PERMISSION_DENIED)
1. Unauthenticated write to `/portal/main` (`request.auth == null`).
2. Signed-in non-admin user updating `/portal/main` or `/services/svc-silat`.
3. Signed-in admin email with `email_verified == false` attempting to create/update `/portal/main`.
4. Creating `/portal/rogueDoc` instead of `/portal/main`.
5. Deleting `/portal/main` even as an admin.
6. Shadow/ghost field injection on `/portal/main` (`isVerified: true` in root or nested map).
7. Oversized `serviceId` (> 128 chars) or invalid ID characters (`../admin`) in `/services/{serviceId}`.
8. Invalid `badgeColor` (`"red"` instead of `^#[0-9a-fA-F]{6}$`) or invalid `linkTarget` in `/services/{serviceId}`.
9. Spoofing client timestamp (`updatedAt: "2026-01-01T00:00:00Z"` instead of server `request.time`).
10. Mutating immutable `createdAt` during an update on `/services/{serviceId}`.
11. Unauthenticated or non-primary-admin user attempting to list or write `/admins/{uid}` for self-privilege escalation.
12. Exceeding list boundary (`missionItems` > 20 items or `extraItems` > 20 items) on `/portal/main`.
