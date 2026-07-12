# Onboarding Routing and Type Scale Design

## Outcome

Returning users who have completed onboarding go directly to the dashboard. Practice prompts and other long speaking headings retain the existing editorial style at a more balanced, readable scale.

## Behavior

- Keep the landing page available at `/` for everyone.
- Landing calls to action send new users to `/onboarding` and returning users to `/app`.
- Opening `/onboarding` after completion redirects to `/app`.
- Opening `/app` before completion redirects to `/onboarding`.
- Preserve the existing versioned LocalStorage state and `preferences.onboarded` flag.

## Visual changes

- Reduce only long, task-focused display headings.
- Keep the existing palette, typography family, cards, spacing, and recording layout.
- Give Practice Room prompts a narrower responsive range and comfortable line height.
- Apply the same restraint to long Big 30, mission speaking, and completion headings.

## Verification

- Route tests cover new and returning users.
- Existing storage, typecheck, and build checks continue to pass.
- Desktop and mobile browser QA checks routing and prompt wrapping.
