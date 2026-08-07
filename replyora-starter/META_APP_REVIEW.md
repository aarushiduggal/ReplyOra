# Meta App Review — submission pack

App: **replyora** (Meta App ID `2299115704250577`; Instagram app ID `1075620614894093`)

## Status of "Testing your use cases"
- **Manage everything on your Page (Facebook)** → tested via Graph API Explorer
  (`me/businesses`, `me/accounts`, `PAGE_ID?fields=fan_count,followers_count`).
- **Manage messaging & content on Instagram** → tested via **normal app usage**
  (connect Instagram → open Grid → publish a post → open Reports). The Graph API
  Explorer CANNOT generate an Instagram token for this app ("Invalid platform app"),
  because Instagram Login uses the Instagram app id, not the Explorer's Meta-app
  token. This is expected — the app makes the real calls, which Meta counts.
- Testing data can take up to 24h to appear; each test is valid 30 days.

## Permissions we request + why (paste into App Review)
| Permission | Usage description |
|---|---|
| pages_show_list | Agencies connect the Facebook Pages they manage for clients; we show the list so they can pick which Page to link to a client workspace. |
| pages_read_engagement | We read the connected Page's details and metrics (name, followers, reach, impressions) to show performance in the client Reports dashboard. |
| pages_manage_posts | We publish the posts the agency creates to the connected Facebook Page at the scheduled time, on their behalf. |
| business_management | We identify the businesses the user manages so we link the correct Pages/Instagram accounts to the right client workspace. |
| instagram_business_basic | We read the connected Instagram Business account's profile and existing media to display the visual grid planner. |
| instagram_business_content_publish | We publish the posts, reels and carousels the agency creates to the connected Instagram account at the scheduled time, on their behalf. |
| instagram_business_manage_insights | We read Instagram performance metrics (reach, impressions, engagement, saves, follower growth) to build the client Reports. |

Do NOT request: instagram_manage_comments, instagram_business_manage_messages,
pages_manage_engagement, pages_read_user_content — Replyora does not manage
comments or DMs.

## Reviewer test instructions
```
1. Go to https://replyora.net and log in with the test account below.
2. Open a client → Integrations → Connect Instagram and Connect Facebook, complete login.
   (uses pages_show_list, business_management, instagram_business_basic)
3. Open the client's Grid tab — the connected posts load. (instagram_business_basic)
4. Create a post and Publish it. (instagram_business_content_publish / pages_manage_posts)
5. Open the client's Reports tab — metrics load. (instagram_business_manage_insights / pages_read_engagement)

Test login:  <create a Replyora account for the reviewer and put email + password here>
```

## Prerequisites before submitting
- App Settings → Basic:
  - Privacy Policy URL: `https://replyora.net/privacy`
  - User Data Deletion → Instructions URL: `https://replyora.net/privacy#data-deletion`
  - App icon (1024×1024) + Category.
- Business Verification (Meta Business Manager) — usually required for Advanced Access.
- Create the reviewer test login above (a normal account with a connected test IG/Page).

## Next action
Wait ~24h → confirm BOTH use cases show tested on the "Testing your use cases" page
→ App Review → Permissions and Features → request Advanced Access for the 7 permissions
above → paste the usage descriptions + reviewer instructions → submit.
