# Product Requirements Document

## Product Name

**Working title:** Called It

## Tagline

**Make the call. Earn the points. Prove you knew it.**

---

# 1. Product Overview

Called It is a social football prediction website where users predict match outcomes, earn points based on accuracy, compete on leaderboards, and compare their performance with friends.

Unlike traditional fantasy football platforms, users do not create teams or manage players. Their ranking is based entirely on how accurately they predict real match events.

The product will initially focus on World Cup matches but should be designed so that other football tournaments and leagues can be supported later.

The website must work smoothly on both desktop and mobile browsers.

---

# 2. Problem Statement

Football fans regularly make predictions about matches, but these predictions are usually:

- Shared informally in group chats.
- Forgotten after the match.
- Difficult to verify.
- Not scored consistently.
- Difficult to compare across an entire tournament.

Existing fantasy football platforms often require detailed player knowledge, squad management, transfers, budgets, and repeated maintenance.

Called It provides a simpler alternative where users compete based on football judgment rather than fantasy team management.

---

# 3. Product Goal

Create a social prediction platform that makes every football match more engaging by allowing users to:

- Submit predictions before kickoff.
- Earn points based on prediction accuracy.
- Build a long-term prediction record.
- Add other users as friends.
- Compare rankings against friends or the entire platform.
- Earn rare Called It cards for completely accurate predictions.

---

# 4. Target Users

## Primary Users

Football fans who:

- Watch major tournaments.
- Enjoy predicting match results.
- Compete with friends over football knowledge.
- Find traditional fantasy football too complicated.
- Want proof of their successful predictions.

## Secondary Users

- Casual football viewers.
- Online football communities.
- Sports content creators.
- University and school friend groups.
- Workplace football groups.

---

# 5. Core Product Principles

## Simple

Making a prediction should take only a few seconds.

## Social

Users should naturally compare results with people they know.

## Fair

The scoring system and prediction deadlines must be clear and consistent.

## Competitive

Leaderboards, streaks, rankings, and statistics should encourage repeated use.

## Rewarding

Accurate predictions should feel meaningful and shareable.

## Mobile-first

The website must be easy to use on a phone while still providing a polished desktop experience.

---

# 6. Core User Journey

1. User creates an account.
2. User selects their favourite national team.
3. User searches for and adds friends.
4. User views upcoming matches.
5. User submits predictions before kickoff.
6. Predictions lock when the match begins.
7. Match results are processed.
8. Points are awarded.
9. The user’s leaderboard position updates.
10. The user compares their position globally or against friends.
11. A Called It card is awarded when the entire prediction is exactly correct.
12. The user returns to predict the next matches.

---

# 7. Functional Requirements

## 7.1 User Accounts

Users must be able to:

- Create an account.
- Sign in and sign out.
- Reset their password.
- Choose a unique username.
- Upload a profile picture.
- Select a favourite team.
- View and edit their profile.
- View their prediction history.
- View their ranking and statistics.

### Required Profile Information

- Username
- Display name
- Email address
- Password or supported authentication method
- Favourite team

### Optional Profile Information

- Profile image
- Country
- Short bio

---

## 7.2 Friend System

The platform will use a friend system instead of private leagues.

Users must be able to:

- Search for users by username or display name.
- Send friend requests.
- Accept or reject friend requests.
- Cancel outgoing friend requests.
- Remove existing friends.
- View their friends list.
- View another user’s public profile.
- Block another user.

Friend relationships should require approval from both users.

### Friend Request States

- None
- Pending outgoing
- Pending incoming
- Friends
- Blocked

---

## 7.3 Match List

Users must be able to view:

- Upcoming matches.
- Live matches.
- Completed matches.
- Match date and time.
- Teams playing.
- Team flags or badges.
- Tournament stage.
- Prediction deadline.
- Prediction status.
- Final result when available.

### Match Filters

Users should be able to filter matches by:

- Date
- Tournament stage
- Team
- Upcoming
- Live
- Completed
- Predicted
- Not predicted

Match times must automatically display in the user’s local timezone.

---

## 7.4 Match Predictions

Users must be able to predict a match before kickoff.

### Initial Prediction Fields

For the MVP, each prediction will include:

- Home team score
- Away team score
- First goalscorer

The first goalscorer field may include:

- A player from either team
- No goalscorer

### Prediction Rules

- Predictions may be submitted until kickoff.
- Predictions may be edited until kickoff.
- Predictions become permanently locked at kickoff.
- Users cannot submit or edit predictions after kickoff.
- Users cannot predict negative scores.
- Score inputs must be whole numbers.
- Users may skip the first goalscorer prediction.
- Users must predict the score to submit a valid prediction.

### Prediction Visibility

Before kickoff:

- A user can view their own prediction.
- Other users cannot view the prediction.

After kickoff:

- Friends can view each other’s predictions.
- Predictions may also appear on public profiles depending on privacy settings.

This prevents users from copying predictions before they lock.

---

## 7.5 Confidence Multipliers

Users may optionally assign a confidence multiplier to a prediction.

### Initial Multipliers

- Normal: 1×
- Confident: 2×
- Maximum confidence: 3×

### Rules

- Multipliers increase both the reward and strategic importance of a prediction.
- Users receive a limited number of 2× and 3× multipliers per tournament round.
- A multiplier cannot be changed after kickoff.
- Unused multipliers expire at the end of the round.
- The user interface must clearly show how many multipliers remain.

### Suggested MVP Allocation

Per tournament round:

- Unlimited 1× predictions
- Three 2× predictions
- One 3× prediction

This allocation may be adjusted after testing.

---

# 8. Scoring System

The scoring system must reward increasing levels of accuracy.

## Base Scoring

| Prediction Result | Base Points |
|---|---:|
| Correct match outcome | 3 |
| Correct goal difference | +2 |
| Exact score | +3 |
| Correct first goalscorer | +4 |

### Match Outcome

The match outcome is one of:

- Home team wins
- Draw
- Away team wins

### Goal Difference

The goal difference is the difference between the two predicted scores.

Example:

Predicted result:

```text
Team A 2–1 Team B
```

Actual result:

```text
Team A 1–0 Team B
```

The user correctly predicted:

- The winning team
- The goal difference

The user did not predict the exact score.

### Exact Score

An exact-score bonus is awarded only when both team scores exactly match the official result.

### First Goalscorer

The first-goalscorer bonus is awarded when the predicted player scores the first official goal of the match.

An own goal should not count as a first-goalscorer prediction unless own goals are explicitly available as a selection.

If a match ends 0–0, users who selected “No goalscorer” receive the first-goalscorer points.

---

## 8.1 Confidence Calculation

The confidence multiplier is applied to the total points earned from the match.

```text
Final match points = Base points earned × Confidence multiplier
```

Example:

A user earns eight base points and selected 2× confidence:

```text
8 × 2 = 16 points
```

---

## 8.2 Knockout Match Scoring

For knockout matches, the score prediction should refer to the score at the end of regulation time unless the product explicitly states otherwise.

The user may also predict:

- Team to advance

This avoids ambiguity when matches go to extra time or penalties.

### Recommended Knockout Fields

- Score after 90 minutes
- Team to advance
- First goalscorer

Points for the score and match outcome should be based on the result after 90 minutes.

---

# 9. Called It Cards

Called It cards are rare rewards for completely accurate match predictions.

A user receives a Called It card only when their entire submitted prediction is 100% correct.

## MVP Called It Requirements

The user must correctly predict:

- Exact home team score
- Exact away team score
- First goalscorer

If the user does not submit a first-goalscorer prediction, they are not eligible for a Called It card for that match.

For a 0–0 match, the user must predict:

- 0–0
- No goalscorer

## Confidence Multiplier

The confidence multiplier does not affect eligibility for a Called It card.

However, the card may visually display the multiplier used.

## Called It Card Contents

Each card should include:

- User display name
- Match
- Predicted result
- Actual result
- First goalscorer
- Match date
- Tournament stage
- Confidence multiplier
- Percentage of users who made the same exact prediction
- Unique card identifier

## Card Features

Users must be able to:

- View earned cards on their profile.
- Open an individual card.
- Download or share the card as an image.
- Copy a public card link.
- View how rare the prediction was.

## Card Rules

- Cards cannot be manually created.
- Cards are generated only after official match data is confirmed.
- Cards cannot be edited.
- A corrected match result may cause a card to be issued or removed.
- Each user can earn only one Called It card per match.

---

# 10. Leaderboards

The platform must include a global leaderboard.

## Global Leaderboard

Ranks all eligible users based on total points.

The leaderboard should show:

- Rank
- User
- Favourite team
- Total points
- Exact scores
- Called It cards
- Current streak

---

## Friends Leaderboard Filter

Instead of separate private leagues, users can filter the global leaderboard to show only:

- The current user
- Accepted friends

This creates an automatic social leaderboard without requiring users to create or manage leagues.

### Leaderboard Views

- Global
- Friends
- Country
- Current matchday
- Current tournament round
- Full tournament

### Ranking Tie-Breakers

If users have the same total points, rank them using:

1. Most Called It cards
2. Most exact-score predictions
3. Most correct first-goalscorer predictions
4. Highest overall prediction accuracy
5. Shared rank

---

# 11. User Statistics

Each user should have a statistics page.

## Core Statistics

- Total points
- Global rank
- Friends rank
- Predictions made
- Correct match outcomes
- Correct goal differences
- Exact scores
- Correct first goalscorers
- Called It cards
- Current correct-outcome streak
- Longest correct-outcome streak
- Average points per match
- Confidence multiplier success rate

## Advanced Statistics

Future versions may include:

- Best-performing team predictions
- Worst-performing team predictions
- Group-stage accuracy
- Knockout-stage accuracy
- Favourite score prediction
- Most successful confidence level
- Underdog prediction success
- Accuracy trend over time

---

# 12. Social Features

## Friend Activity Feed

Users should see activity from friends, including:

- New Called It cards
- Rank changes
- New streak records
- Major prediction achievements
- Friend requests accepted

Predictions must not be shown before kickoff.

## Reactions

After kickoff, friends may react to predictions with predefined reactions such as:

- Good call
- Brave
- Delusional
- Biased
- Lucky

Reactions should be lightweight and optional.

## Comments

Comments are not required for the MVP.

They may be added later if moderation systems are available.

---

# 13. Notifications

Users should receive in-app notifications for:

- Incoming friend requests
- Accepted friend requests
- Prediction deadlines
- Missing predictions
- Points awarded
- Rank changes
- Called It cards earned
- Friend achievements

## Future Notification Channels

- Email
- Browser push notifications
- Mobile push notifications if native apps are later created

Users must be able to control notification preferences.

---

# 14. Google AI Integration

Google AI should be used only where it adds clear user value.

## Personal Performance Summary

The platform may generate a short personalised summary based on the user’s prediction history.

Example:

> You are strong at predicting match winners but often underestimate the number of goals. Your most accurate predictions have involved Spain, while your 3× confidence picks have performed below your normal predictions.

## Friends Leaderboard Recap

After each matchday, Google AI may generate a short recap such as:

> Ayaan moved into first place after correctly predicting two match winners and one exact score. Hamza had the strongest confidence pick, while Sara earned the only Called It card of the day.

## Requirements

AI-generated summaries must:

- Be grounded in real platform data.
- Avoid inventing statistics.
- Clearly distinguish facts from commentary.
- Avoid giving gambling advice.
- Avoid generating offensive content.
- Be short and easy to understand.

AI summaries are a secondary feature and must not be required for the core prediction or scoring system.

---

# 15. Snowflake Integration

Snowflake will act as the main analytics and data-processing platform.

## Snowflake Responsibilities

- Store or process prediction data.
- Calculate leaderboard statistics.
- Aggregate user performance.
- Analyse prediction accuracy.
- Calculate friend ranking data.
- Track Called It card rarity.
- Generate matchday analytics.
- Provide data to AI-generated summaries.

## Example Analytics Queries

- Most predicted match outcome
- Percentage of users predicting each score
- Rarest correct prediction
- Average points by confidence level
- Most accurate users
- Most accurately predicted teams
- Friend-group ranking changes
- Number of Called It cards per match

The application may use a separate operational database for authentication or low-latency application data while synchronising analytical data into Snowflake.

---

# 16. Responsive Website Requirements

The product will initially be a responsive website.

It must support:

- Desktop browsers
- Laptop browsers
- Tablets
- Mobile browsers

## Mobile Requirements

- Mobile-first page layouts
- Large tap targets
- Bottom navigation for primary pages
- Simple score input controls
- No horizontal scrolling
- Fast loading on mobile networks
- Forms usable with one hand
- Responsive leaderboard cards or tables
- Shareable Called It cards sized for social media

## Desktop Requirements

- Wider leaderboard tables
- Side navigation or top navigation
- Multi-column match layouts
- Expanded statistics displays
- Side-by-side global and friends comparisons
- Hover states where appropriate

## Recommended Breakpoints

- Mobile: below 640px
- Tablet: 640px–1023px
- Desktop: 1024px and above

---

# 17. Main Pages

## 17.1 Landing Page

Purpose:

- Explain the product.
- Encourage account creation.
- Show how prediction scoring works.
- Display sample Called It cards.
- Show upcoming matches.

## 17.2 Authentication Pages

- Sign up
- Sign in
- Password reset

## 17.3 Home Dashboard

Displays:

- Upcoming matches
- Missing predictions
- User rank
- Friends rank
- Current points
- Recent friend activity
- Recent achievements

## 17.4 Matches Page

Displays:

- All matches
- Match filters
- Prediction status
- Match results

## 17.5 Prediction Page

Displays:

- Match information
- Score prediction inputs
- First-goalscorer selection
- Confidence selection
- Submission deadline
- Scoring explanation
- Save or update prediction button

## 17.6 Leaderboard Page

Displays:

- Global leaderboard
- Friends filter
- Country filter
- Matchday filter
- Tournament-round filter
- User search

## 17.7 Friends Page

Displays:

- Friends list
- Incoming requests
- Outgoing requests
- User search
- Suggested friends

## 17.8 Profile Page

Displays:

- User information
- Ranking
- Statistics
- Prediction history
- Called It cards
- Friends
- Favourite team

## 17.9 Called It Card Page

Displays:

- Full card
- Match details
- Prediction rarity
- Share button
- Public card link

## 17.10 Settings Page

Displays:

- Profile settings
- Privacy settings
- Notification settings
- Password settings
- Account deletion

---

# 18. Navigation

## Mobile Navigation

Recommended bottom navigation:

- Home
- Matches
- Leaderboard
- Friends
- Profile

## Desktop Navigation

Recommended top or side navigation:

- Home
- Matches
- Leaderboard
- Friends
- Profile

Notifications and settings may appear in the top-right area.

---

# 19. Privacy Requirements

Users should be able to control:

- Whether their profile is public.
- Whether non-friends can view their prediction history.
- Whether non-friends can view their Called It cards.
- Whether their country is displayed.
- Whether they appear in user search.

Leaderboard participation may require limited public information:

- Username
- Profile picture
- Points
- Rank
- Favourite team

Predictions must remain hidden from other users until kickoff.

---

# 20. Moderation and Safety

Because users can create usernames, profile images, and bios, the platform requires basic moderation.

## MVP Moderation Requirements

- Report user
- Block user
- Remove offensive profile information
- Prevent duplicate usernames
- Limit friend-request spam
- Rate-limit user search and requests
- Basic profanity filtering for usernames and bios

If comments are added later, stronger moderation will be required.

---

# 21. Data Model

## User

- User ID
- Email
- Username
- Display name
- Password hash or authentication provider ID
- Profile image URL
- Favourite team ID
- Country
- Bio
- Privacy settings
- Created timestamp

## Friendship

- Friendship ID
- Requesting user ID
- Receiving user ID
- Status
- Created timestamp
- Updated timestamp

## Tournament

- Tournament ID
- Name
- Season
- Start date
- End date
- Status

## Team

- Team ID
- Name
- Short name
- Badge or flag URL
- Country code

## Player

- Player ID
- Team ID
- Name
- Position
- Active status

## Match

- Match ID
- Tournament ID
- Stage
- Home team ID
- Away team ID
- Kickoff timestamp
- Status
- Home score
- Away score
- First goalscorer ID
- Team advanced ID
- Result confirmation status

## Prediction

- Prediction ID
- User ID
- Match ID
- Predicted home score
- Predicted away score
- Predicted first goalscorer ID
- Predicted team to advance ID
- Confidence multiplier
- Submitted timestamp
- Updated timestamp
- Locked timestamp
- Base points
- Final points
- Is exact score
- Is complete prediction
- Is Called It eligible

## Called It Card

- Card ID
- User ID
- Match ID
- Prediction ID
- Rarity percentage
- Generated timestamp
- Public slug

## Reaction

- Reaction ID
- User ID
- Prediction ID
- Reaction type
- Created timestamp

## Notification

- Notification ID
- User ID
- Notification type
- Related entity ID
- Read status
- Created timestamp

---

# 22. Match Data Requirements

The platform requires reliable match data for:

- Fixtures
- Kickoff times
- Teams
- Players
- Match status
- Scores
- First goalscorer
- Knockout progression

Match results must be confirmed before:

- Final points are awarded.
- Leaderboards are finalised.
- Called It cards are generated.

The system should support result corrections.

---

# 23. Non-Functional Requirements

## Performance

- Main pages should load within three seconds on a typical mobile connection.
- Prediction submissions should receive immediate confirmation.
- Leaderboards should load efficiently with pagination or virtualisation.
- Images should be compressed and responsive.

## Reliability

- Predictions must not be lost after submission.
- Prediction timestamps must be stored securely.
- Locked predictions must not be editable.
- Point calculations must be reproducible.
- Match result corrections must trigger recalculation.

## Security

- Passwords must be securely hashed.
- Authentication tokens must be protected.
- Prediction endpoints must enforce deadlines server-side.
- Users must not be able to alter points from the client.
- Friend and profile privacy rules must be enforced server-side.
- API endpoints must be rate-limited.

## Accessibility

- Keyboard navigation
- Screen-reader-friendly labels
- Sufficient colour contrast
- Alternative text for team badges
- Clear error messages
- No reliance on colour alone for prediction status

---

# 24. MVP Scope

The MVP should include:

- User registration and authentication
- User profiles
- Favourite team selection
- Friend requests
- Friends list
- Upcoming and completed matches
- Score predictions
- First-goalscorer predictions
- Confidence multipliers
- Prediction locking at kickoff
- Automatic point calculations
- Global leaderboard
- Friends leaderboard filter
- Basic user statistics
- Called It card generation
- Responsive mobile and desktop design
- Snowflake analytics
- Basic Google AI matchday or performance summaries

---

# 25. Features Excluded From MVP

The following should not be included in the first version:

- Private leagues
- Real-money betting
- Tokens or cryptocurrency
- Solana integration
- ElevenLabs audio
- Live chat
- User-created posts
- Complex comment threads
- Native mobile applications
- Predictions for every individual match event
- Paid prediction advantages
- Marketplace for Called It cards

These may be reconsidered after the core product is validated.

---

# 26. Future Features

Potential future additions include:

- More football competitions
- Club football support
- Head-to-head friend challenges
- Country leaderboards
- Creator-hosted competitions
- Seasonal prediction ratings
- Custom friend groups
- Browser push notifications
- Native mobile applications
- Shareable tournament recap
- Prediction difficulty multipliers
- Advanced AI performance coaching
- Live leaderboard movement
- Audio matchday summaries
- Historical prediction archive

---

# 27. Success Metrics

## Acquisition

- Number of registered users
- Registration completion rate
- Friend requests sent
- Percentage of users adding at least one friend

## Engagement

- Predictions per active user
- Percentage of matches predicted
- Daily active users
- Return rate before the next matchday
- Friends leaderboard usage
- Called It card shares

## Retention

- Matchday-to-matchday retention
- Weekly retention
- Tournament completion rate
- Percentage of users active during knockout rounds

## Product Quality

- Prediction submission failure rate
- Incorrect scoring incidents
- Match data correction frequency
- Average page load time
- Mobile conversion rate

---

# 28. Key Product Risks

## Users forget to predict

Mitigation:

- Clear countdowns
- Missing-prediction indicators
- Matchday prediction flow
- Optional notifications

## Low friend adoption

Mitigation:

- Simple friend search
- Shareable profile links
- Contact-based discovery in a later version
- Useful global leaderboard even without friends

## Users near the bottom stop participating

Mitigation:

- Matchday rankings
- Round rankings
- Streaks
- Personal records
- Called It cards
- Friends-only comparison

## Scoring feels unfair

Mitigation:

- Publish clear scoring rules
- Show a point breakdown for every prediction
- Test confidence multiplier limits
- Allow result recalculation after corrections

## Called It cards are too rare

This rarity is intentional, but users still need smaller rewards.

Mitigation:

- Award ordinary badges for exact scores, streaks, and correct scorers.
- Reserve Called It cards for completely correct predictions.

---

# 29. MVP Acceptance Criteria

The MVP is complete when:

1. A user can create an account and profile.
2. A user can search for another user and send a friend request.
3. A user can accept a friend request.
4. A user can view upcoming matches.
5. A user can submit and edit a prediction before kickoff.
6. A prediction cannot be submitted or edited after kickoff.
7. A completed match automatically awards the correct points.
8. A user can see a detailed point breakdown.
9. The global leaderboard updates correctly.
10. The leaderboard can be filtered to the user and their friends.
11. A Called It card is generated only when every prediction field is correct.
12. The user can view and share the Called It card.
13. The application works correctly on both mobile and desktop browsers.
14. AI-generated summaries use only verified platform data.
15. All score and ranking calculations occur securely on the server.

---

# 30. Product Summary

Called It is a responsive social football prediction website where users compete based on the accuracy of their football predictions.

Its main differentiators are:

- Football knowledge instead of fantasy squad management.
- Automatic friend-based leaderboard filtering.
- Hidden predictions until kickoff.
- Strategic confidence multipliers.
- Detailed personal statistics.
- Rare Called It cards awarded only for completely accurate predictions.
- Data-driven summaries powered by Google AI and Snowflake.

The product should feel quick enough for casual fans, competitive enough for serious fans, and social enough to become part of how friends experience a football tournament together.
