# CloudVault Teams — Feature Overview

> **Product:** CloudVault  
> **Feature:** Teams (Real-time Collaboration)  
> **Status:** Design Finalized — All Edge Cases Covered  
> **Access:** Paid subscribers only (Standard & Premium plans)

---

## Table of Contents

1. [What is CloudVault Teams?](#1-what-is-cloudvault-teams)
2. [Who Can Use It?](#2-who-can-use-it)
3. [Plans & Limits](#3-plans--limits)
4. [Team Structure](#4-team-structure)
5. [Roles Inside a Team](#5-roles-inside-a-team)
6. [Joining a Team](#6-joining-a-team)
7. [Team Chat](#7-team-chat)
8. [File Sharing in Chat](#8-file-sharing-in-chat)
9. [Notifications](#9-notifications)
10. [Presence & Online Status](#10-presence--online-status)
11. [Subscription Expiry Behavior](#11-subscription-expiry-behavior)
12. [Plan Downgrade Behavior](#12-plan-downgrade-behavior)
13. [Team Owner Election](#13-team-owner-election)
14. [Leaving & Kicking Members](#14-leaving--kicking-members)
15. [Deleting a Team](#15-deleting-a-team)
16. [Platform Owner View](#16-platform-owner-view)
17. [Where It Lives in the App](#17-where-it-lives-in-the-app)
18. [What Teams is NOT](#18-what-teams-is-not)
19. [Summary of Key Numbers](#19-summary-of-key-numbers)

---

## 1. What is CloudVault Teams?

CloudVault Teams is a paid real-time collaboration feature built on top of the existing CloudVault platform. Think of it like a WhatsApp Group but purpose-built for CloudVault users — a private space where subscribed users can come together, chat in real-time, and share files with each other, all within the CloudVault ecosystem.

It is built as a completely separate backend service that runs alongside the existing CloudVault infrastructure without touching or modifying any existing functionality. The frontend lives inside the existing CloudVault application at `app.cloudvault.cloud`, while the new backend runs independently at `teams.cloudvault.cloud`.

---

## 2. Who Can Use It?

CloudVault Teams is exclusively available to paid subscribers. Free plan users have zero access to this feature — they cannot create teams, join teams, receive team invitations, or even see the Teams section in the application. If a free user receives an invite link and clicks it, they are shown a prompt to subscribe to CloudVault before they can proceed.

Only users on the **Standard Plan** or **Premium Plan** can participate in Teams.

---

## 3. Plans & Limits

### Standard Plan

- Can create up to **2 teams**
- Can join up to **3 teams** as a non-owner member
- Maximum **5 teams** in total (created and joined combined)
- Each team the user creates gets a **100GB shared storage pool**
- Each team can have a **maximum of 10 members**
- Every member in a Standard team gets an individual storage allocation of **10GB** within that pool
- File upload limit inside team chat: **1GB per file**

### Premium Plan

- Can create up to **4 teams**
- Can join up to **6 teams** as a non-owner member
- Maximum **10 teams** in total (created and joined combined)
- Each team the user creates gets a **250GB shared storage pool**
- Each team can have a **maximum of 10 members**
- Every member in a Premium team gets an individual storage allocation of **25GB** within that pool
- File upload limit inside team chat: **2GB per file**

### How Team Limits Are Enforced

The system tracks how many teams a user has created and how many they have joined as a non-owner separately. The create limit and join limit are enforced independently — a user on the Standard Plan cannot create a third team even if their combined total is still below 5.

If someone tries to send a direct invitation to a user who has already hit their join limit, the sender receives an error message indicating that the target user has reached their maximum team capacity. The target user is never notified about the invitation attempt — they receive no notification, no email, and no indication that anyone tried to invite them.

---

## 4. Team Structure

Every team has a profile consisting of a **name** (required), an optional **description**, and an optional **avatar or icon**. These details can be updated at any time by the Team Owner or an Admin.

When a user creates a team, they automatically become the **Team Owner**. The team exists as its own isolated space, entirely independent of any personal files or folders the user may have in their personal CloudVault drive.

Each team has its own dedicated storage pool that is completely separate from every member's personal CloudVault storage quota. Files uploaded inside a team do not affect anyone's personal storage in any way.

---

## 5. Roles Inside a Team

There are three roles within a team: **Team Owner**, **Admin**, and **Member**. Every team has exactly one Team Owner at any point in time.

### Team Owner

The Team Owner has full and exclusive control over the team. They are the only person who can:

- Delete the team entirely
- Kick or remove members from the team
- Approve or reject join requests that come in via the invite link
- Revoke or regenerate the invite link
- Promote members to Admin or demote Admins back to Member

The Team Owner can also do everything that an Admin and Member can do.

### Admin

Admins are trusted members elevated by the Team Owner. They have meaningful elevated privileges but are explicitly limited from the most sensitive or destructive actions. Admins can:

- Invite new members via direct invitation
- Generate a new invite link — but importantly, **cannot revoke it** (only the Team Owner can revoke)
- Send messages and upload files
- Delete any member's message, not just their own
- Pin and unpin messages
- Update the team's name, description, and avatar
- React to messages and reply to messages

Admins **cannot** kick members, see or manage join requests from the invite link, revoke the invite link, promote or demote other members, or delete the team.

### Member

Regular members have access to the full core chat experience. They can:

- Send text messages
- Upload files to the chat
- Reply to and quote messages
- React to messages with emojis
- Delete their own messages only
- View pinned messages
- View the member list and presence statuses

Members cannot invite others, pin messages, delete anyone else's messages, or change any team settings.

---

## 6. Joining a Team

There are two ways to join a team: via a direct invitation or via an invite link.

### Direct Invitation

The Team Owner or an Admin searches for a CloudVault user by their username or email and sends them a direct invitation. Before the invitation is sent, the system validates:

- The target user exists and has an active paid subscription
- The target user has not already reached their team join limit
- The target user is not already a member of this team
- The team has not already reached its 10-member cap

If any of these checks fail, the invitation is not sent and the sender receives an appropriate error. The target user is never notified about failed invitation attempts.

If all checks pass, the invited user receives a notification inside the CloudVault app via the notification bell and also receives an email. When they open the notification, they see the team name, the name of who invited them, and buttons to **Accept** or **Reject**.

If they accept, they join the team **immediately** with no additional approval step. Direct invitations bypass the approval queue entirely.

If they reject, the invitation is dismissed. The same user can be re-invited in the future by the same or any other Admin or Owner. The re-invitation goes through the exact same flow — a fresh notification and email as if it were a first-time invite.

### Invite Link

The Team Owner or Admin can generate a shareable invite link from within the team settings. This link can be shared anywhere outside the CloudVault application — via messaging apps, email, social media, or any other external channel.

**Critical asymmetry on the invite link:** Both the Team Owner and Admins can **generate** the invite link, but only the **Team Owner** can **revoke** or **regenerate** it. An Admin who generates a link cannot disable it. That control belongs solely to the Team Owner.

The link expires automatically after **one week** from the time it was generated. Once expired, any user clicking the link sees a "Link Expired" message.

When someone clicks a valid, active invite link, they land on a team preview page showing the team's name, description, avatar, and current member count. The outcome depends on who is clicking:

- **Not logged in** → Redirected to the CloudVault login page
- **Logged in, no paid subscription** → Shown a message: "Subscribe to CloudVault to join this team"
- **Logged in, paid subscription, already at join limit** → Cannot proceed, shown a limit reached message
- **Logged in, valid paid subscription, within limits** → Shown a "Request to Join" button

When a valid user clicks "Request to Join," a pending join request is created and only the **Team Owner** receives a notification. Admins do not see or manage join requests — this is the Team Owner's exclusive responsibility.

The Team Owner can approve or reject each pending request individually. On approval, the requesting user joins immediately and receives a notification confirming acceptance. On rejection, the requester is notified that their request was declined.

---

## 7. Team Chat

The core of the Teams feature is the real-time chat. Every team has its own dedicated chat space where all communication and file sharing happens.

### Text Messages

Members can send text messages up to 4,000 characters in length. Messages appear instantly for all online members. Offline members see the messages when they next open the app.

Members can reply to or quote any specific message, similar to WhatsApp. The original quoted message appears as a preview above the reply, giving context to the conversation.

### Deleting Messages

Any member can delete their own messages at any time. When deleted, the message is replaced with a "this message was deleted" placeholder that remains visible to everyone in the chat.

The Team Owner and Admins can delete any member's message. The same deleted placeholder is shown regardless of who performed the deletion.

### Emoji Reactions

Any member can react to any message with an emoji. Each reaction is tracked per user, so the team can see exactly who reacted with what emoji. Members can add multiple different reactions to the same message and can remove their own reactions at any time.

### Pinned Messages

The Team Owner and Admins can pin important messages to make them easy to find. Pinned messages are accessible from a dedicated pinned messages panel within the team view. Both the Team Owner and Admins can unpin messages as well.

### Read Receipts

Every message shows read receipt information — which members have seen the message and when. This is visible to all members of the team, giving senders confidence that their messages have been received.

### Typing Indicators

When one or more members are actively composing a message, a typing indicator appears at the bottom of the chat. The client uses debouncing to avoid flooding the server with typing events. If more than two people are typing simultaneously, the indicator shows "3 people are typing..." rather than listing all names. The indicator disappears automatically a few seconds after a user stops typing.

### Message History for New Members

When a new member joins a team — whether via direct invite or invite link — they can only see messages sent from their join date onwards. All conversation history from before their join date is not accessible to them. There is no message search functionality within the Teams feature.

---

## 8. File Sharing in Chat

Members can upload files directly within the team chat. These files exist exclusively within the team's space and are entirely separate from any member's personal CloudVault drive.

### Permission Dialog Before Upload

Before a file upload begins, the uploader is shown a permissions dialog where they must choose what other team members are allowed to do with that file. At least one option must be selected:

- **View / Preview only** — other members can see a preview of the file inline in the chat but cannot download it
- **Download only** — other members can download the file but cannot preview it inline
- **View and Download** — other members can both preview and download the file

The uploader can change these permissions at any time after the upload is complete. No one else in the team — not the Team Owner, not Admins — can override the permissions set by the original uploader. Permission control belongs entirely to the person who uploaded the file.

### Storage Accounting

Every file upload counts against two things simultaneously:

**1. The uploader's individual storage allocation within that team**
- Standard Plan members: 10GB per team
- Premium Plan members: 25GB per team

**2. The team's overall shared storage pool**
- Standard teams: 100GB total
- Premium teams: 250GB total

Both limits are checked before an upload is allowed to proceed. If either limit would be exceeded by the upload, the upload is rejected with a clear error message explaining which limit was hit.

### When Team Storage is Full

If the **team's overall storage pool is full**, file uploads are blocked for **all members** of that team — regardless of whether individual members still have personal allocation remaining. Team-level storage takes precedence. Text messaging continues to work normally even when the team storage pool is completely full.

If a **specific member has used their individual allocation**, that member alone cannot upload more files to that team even if the team's overall pool still has space.

### Storage Freed When a Member Leaves or is Kicked

When a member leaves a team voluntarily or is kicked out by the Team Owner, the storage they consumed with their uploads is **freed back to the team's shared pool**. The released storage becomes immediately available for other members to use.

Their previously uploaded files **remain in the team chat** and are still visible and accessible to remaining active members according to the original permissions the departing member set. Files are not deleted when a member leaves or is kicked — only the storage accounting is adjusted.

### Files from Members Whose Subscriptions Expired

If a member's subscription expires, their previously uploaded files remain fully accessible to active members in the team according to the original permissions. The expired member themselves cannot view or download any files — their own or anyone else's — but their files are not hidden or removed for others.

---

## 9. Notifications

Users receive notifications through two channels: the notification bell inside the CloudVault app and email.

### Notification Bell

The notification bell is a new icon added to the navigation bar of `app.cloudvault.cloud`. It shows an unread count badge that updates in real-time as new notifications arrive. Clicking it opens a notifications panel where users can view and act on all pending items.

### What Triggers Both In-App and Email Notifications

- Receiving a direct team invitation (with Accept and Reject options in-app)
- A join request via invite link being approved by the Team Owner
- A join request via invite link being rejected by the Team Owner
- Being elected as the new Team Owner after the previous owner left
- Being kicked from a team

### What Triggers In-App Notification Only

- A new join request arriving in the team (visible to the Team Owner only)

---

## 10. Presence & Online Status

When a member opens the team chat view, the member list panel shows the presence status of all team members.

A **green indicator** means the member was actively using the Teams section within the last two minutes and is considered online. An **offline indicator** shows approximately when that member was last active.

Presence is scoped specifically to Teams activity. It does not reflect whether a user is actively using other parts of the CloudVault application — only whether they are actively in the Teams section.

---

## 11. Subscription Expiry Behavior

If a member's CloudVault subscription expires while they are part of one or more teams, they are **not automatically removed** from any team. Their membership is preserved, but their ability to participate is immediately and significantly restricted.

### What an Expired Member CAN Do

- See the team in their teams list
- Open the team chat and see real-time text messages as they arrive (read-only)

### What an Expired Member CANNOT Do

- Send any text messages (the chat input is disabled in the UI)
- Upload any files to the team chat
- View or preview any files shared in the chat
- Download any files
- React to messages with emojis
- Perform any write operation of any kind

### Impact on Other Members

An expired member's previously uploaded files remain fully accessible to active members according to the permissions the expired member originally set. The files are not hidden or removed because of the membership holder's subscription status.

### Restoring Access

If the expired member renews their CloudVault subscription, full access is restored immediately. No manual intervention is required — the system detects the renewed subscription and re-enables all capabilities automatically.

---

## 12. Plan Downgrade Behavior

If a user voluntarily downgrades from the Premium Plan to the Standard Plan, the consequences are **immediate and irreversible**.

Before the downgrade is confirmed, the user is shown a **serious warning** that explains exactly what they stand to lose. The warning makes clear that all teams exceeding the Standard Plan's limits will be permanently deleted, along with all their messages, files, and member records. The user must explicitly confirm they understand and accept this outcome before the downgrade proceeds. The intent is to strongly encourage them to stay on their current plan if they value their teams.

If the user confirms the downgrade:

- Their creation limit drops from 4 to 2 and their join limit drops from 6 to 3
- Any teams they own beyond the 2 they can keep are **immediately and permanently deleted** — all messages, all files, and all member records in those teams are destroyed
- Any team memberships beyond their new 3-join limit are **immediately terminated** — they are dropped from those teams without warning to those teams' other members
- There is **no grace period** — the changes take effect the moment the downgrade is confirmed

---

## 13. Team Owner Election

The Team Owner election process is triggered when the current Team Owner voluntarily leaves the team or when their subscription expires.

### Election Process

The system identifies all current team members who have an **active paid subscription**. From this eligible pool, it selects the member who has been in the team the **longest** based on their join date. Seniority in the team is used as the selection criterion to give the role to the most established member.

The newly elected Team Owner receives both an in-app notification and an email informing them that they have been elected as the new Team Owner.

### When No Eligible Members Exist

If the outgoing Team Owner's departure leaves no remaining members with an active subscription, the team enters a **dormant state**:

- All members retain their read-only view of past text messages in the chat
- No one can send messages, upload files, or access any files
- The team is not deleted — it remains in this suspended state indefinitely

When any existing member of the dormant team renews their subscription, the election runs automatically. That member becomes the new Team Owner and the team returns to full operation immediately.

### When the Team Has Zero Members

If a team reaches zero members — meaning every person has left and no one remains — the team is **automatically and permanently deleted**. All messages, files, and data associated with the team are destroyed. This cannot be undone.

---

## 14. Leaving & Kicking Members

### A Member Leaving Voluntarily

Any member can leave a team at any time. When a member leaves:

- Their membership record is removed from the team
- Their individual storage allocation is **freed and returned to the team's shared pool** immediately
- All files they uploaded to the team remain in the chat and are accessible to remaining members according to the original permissions
- If the departing member is a regular Member or Admin, no other changes occur and the team continues normally
- If the departing member is the Team Owner, the election process is triggered immediately

### Kicking a Member

Only the Team Owner can kick or remove a member. Admins do not have this capability under any circumstances. When a member is kicked:

- Their membership is terminated immediately
- They receive an in-app notification informing them they have been removed from the team
- Their individual storage allocation is freed and returned to the team's shared pool
- All files they uploaded to the team remain in the chat, visible and accessible to remaining active members
- The kicked member loses all access to the team and its contents immediately

A kicked member can be re-invited to the same team in the future if the Team Owner or an Admin chooses to do so. The re-invitation would go through the normal direct invite flow — the user receives a fresh notification and email as if they had never been in the team before.

---

## 15. Deleting a Team

Only the Team Owner can delete a team. Admins and Members have no ability to initiate team deletion.

When the Team Owner initiates deletion, they are shown a **serious and explicit warning** before anything happens. The warning clearly states that all messages, all files, and all team data will be permanently and irreversibly destroyed. There is no recovery mechanism. The Team Owner must explicitly confirm they accept this consequence before deletion proceeds.

Upon confirmed deletion:

- All team messages are permanently deleted
- All files uploaded to the team are permanently deleted from storage
- All member records for the team are removed
- All pending invitations and join requests are cancelled
- All team-related notifications are cleared
- The team itself is permanently removed from the platform

There is no soft delete, no recovery window, and no backup for deleted teams.

---

## 16. Platform Owner View

The CloudVault Platform Owner — the top-level administrator of the CloudVault application — has a read-only observational view of all Teams activity across the platform.

### What the Platform Owner Can See

- A list of all teams on the platform with names, member counts, storage usage, and creation dates
- The full message history of any team
- All files shared within any team
- The member list of any team, including roles and join dates
- Storage statistics across all teams

### What the Platform Owner Cannot Do

The Platform Owner has zero ability to interfere with any team's operation. They cannot modify team settings, kick members, delete messages, change file permissions, approve join requests, or take any action within any team. Their access is purely observational for platform oversight and support purposes.

---

## 17. Where It Lives in the App

Teams is a new section within the existing `app.cloudvault.cloud` frontend. Users access everything from the same CloudVault app they already use — no separate application or subdomain is required on the user-facing side.

Two new items are added to the main navigation bar:

1. **Teams icon** — Opens the Teams section where users can see all their teams, create new teams, and open each team's chat
2. **Notification bell icon** — Shows real-time alerts for incoming invitations, join request outcomes, election notifications, and other team-related events, with an unread count badge

### Pages Within the Teams Section

- **Teams list** — All teams the user belongs to, with unread message indicators per team
- **Team chat view** — The main chat interface for a specific team, showing the message feed, member list panel with presence indicators, and file access
- **Team settings** — Available to Team Owners and Admins for managing team profile, invite link, and member roles
- **Pending requests** — Visible to the Team Owner only, showing all outstanding join requests from the invite link
- **Notifications panel** — Accessible from the bell icon, listing all pending invitations and other alerts

---

## 18. What Teams is NOT

**Teams is not a replacement for personal file sharing.** The existing personal sharing system in CloudVault — where users share individual files with specific people — continues to work exactly as before and is completely independent of Teams.

**Team files are not personal files.** Files uploaded inside a team chat do not appear in any member's personal CloudVault drive, do not consume personal storage quota, and cannot be accessed from outside the team context.

**Personal files cannot be shared directly into team chat.** There is no "share from my drive to team chat" feature. If a user wants to share an existing personal file in a team, they must download it and re-upload it as a fresh team file.

**Free users have no presence in Teams.** Free plan users cannot see Teams in their navigation, cannot receive invitations, cannot be added to any team, and have zero interaction with the Teams feature in any way.

**Teams does not affect existing subscriptions or billing.** Teams is a feature of paid plans. The subscription plans, pricing, billing cycles, webhook handling, and all existing subscription behavior remain exactly as they are.

---

## 19. Summary of Key Numbers

| Detail | Standard Plan | Premium Plan |
|---|---|---|
| Teams a user can create | 2 | 4 |
| Teams a user can join (non-owner) | 3 | 6 |
| Total teams (created + joined) | 5 | 10 |
| Maximum members per team | 10 | 10 |
| Team storage pool per team created | 100 GB | 250 GB |
| Per-member storage allocation | 10 GB | 25 GB |
| Maximum file size per upload | 1 GB | 2 GB |
| Invite link expiry | 7 days | 7 days |
| Message history for new members | From join date only | From join date only |
| Storage freed when member leaves or is kicked | Yes — returned to team pool | Yes — returned to team pool |
| Files deleted when member leaves or is kicked | No — files stay in chat | No — files stay in chat |
| Files hidden when member subscription expires | No — visible to active members | No — visible to active members |
| Plan downgrade grace period | None — immediate effect | None — immediate effect |
| Re-invite after rejection allowed | Yes — normal flow again | Yes — normal flow again |
| Admin can revoke invite link | No — Team Owner only | No — Team Owner only |
| Admin can approve join requests | No — Team Owner only | No — Team Owner only |
