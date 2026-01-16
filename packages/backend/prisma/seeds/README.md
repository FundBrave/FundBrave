# FundBrave Database Seed Scripts

This directory contains seed scripts to populate the FundBrave database with realistic test data.

## Overview

The seed scripts create a comprehensive dataset including:

- **20 diverse users** across 4 user types (activists, entrepreneurs, artists, donors)
- **10 fundraising campaigns** with various statuses and realistic goals
- **50-100 posts** with varied content (announcements, updates, questions, media)
- **100-200 comments** including nested replies
- **500-1,000 likes** on posts
- **50-100 reposts** (including quote reposts)
- **20-30 bookmarks**
- **50-80 follow relationships** creating a realistic social graph
- **Hashtags** extracted from post content
- **Campaign updates and milestones** for each fundraiser

## Quick Start

### Prerequisites

1. PostgreSQL database running
2. Database connection configured in `.env`
3. Dependencies installed: `npm install`

### Running the Seed

```bash
# From the backend directory
npm run seed

# Or using Prisma directly
npx prisma db seed
```

### Full Reset & Seed

```bash
# Reset database and run migrations
npx prisma migrate reset

# This will automatically run the seed script
```

## Seed Script Architecture

### Main Orchestrator: `seed.ts`

The main seed script coordinates the entire seeding process:

1. **Clear Database**: Removes existing data in correct order to avoid FK violations
2. **Seed Users**: Creates 20 users with diverse profiles
3. **Seed Campaigns**: Creates 10 fundraising campaigns
4. **Seed Posts**: Creates 50-100 posts with varied content
5. **Seed Reposts**: Creates posts that reference other posts
6. **Seed Interactions**: Creates likes, comments, follows, bookmarks
7. **Validate Data**: Confirms all data was seeded correctly

### Individual Seed Files

#### `users.seed.ts`

Creates 20 users distributed across 4 types:

- **5 Activists**: Social cause creators, verified creators
- **5 Entrepreneurs**: Startup fundraisers, innovation focus
- **5 Artists**: Creative projects, cultural impact
- **5 Donors**: Primarily engage and donate

**Features:**
- Realistic bios based on user type
- Ethereum wallet addresses (ethers.js)
- Avatar images from DiceBear API
- 30% chance of hybrid Web2+Web3 auth (email/password)
- Default password for hybrid users: `Password123!`
- Onboarding completed for all users

#### `campaigns.seed.ts`

Creates 10 fundraising campaigns with realistic content:

**Status Distribution:**
- 3 Active campaigns (30-85% funded)
- 4 Successful campaigns (110% funded, past deadline)
- 2 New campaigns (5-20% funded, future deadline)
- 1 Urgent campaign (40-70% funded, deadline within 7 days)

**Campaign Categories:**
- Education, Healthcare, Environment, Tech, Arts

**Each Campaign Includes:**
- Detailed description with markdown formatting
- 2-5 updates with optional images
- Milestones at 25%, 50%, 75%, 100%
- Realistic goal amounts ($1,000 - $50,000)
- On-chain IDs and transaction hashes

#### `posts.seed.ts`

Creates 50-100 posts with realistic content:

**Post Type Distribution:**
- 25% Campaign announcements
- 30% Personal updates/thoughts
- 10% Questions/discussions
- 15% Media posts (with images)
- 20% Thoughts/opinions

**Features:**
- Hashtags (#SocialImpact, #DeFi, #Web3, etc.)
- @mentions of other users (20% of posts)
- Engagement metrics (likes, reposts, views)
- Timestamps within past 30 days
- Automatic hashtag extraction and creation

#### `interactions.seed.ts`

Creates all social interactions:

**Comments (100-200):**
- Top-level comments on posts
- Nested replies (30% of comments get replies)
- Post authors reply to comments
- Realistic comment content

**Likes (500-1,000):**
- Distributed across all posts
- Users can't like their own posts
- Unique constraint (one like per user per post)

**Reposts (50-100):**
- Simple reposts and quote reposts (30%)
- Tracked in Repost model
- Unique constraint

**Bookmarks (20-30):**
- 1-3 bookmarks per user
- Save interesting posts

**Follows (50-80):**
- Realistic social graph
- Some mutual follows (friends)
- Updates denormalized follower/following counts

**Comment Likes:**
- 2-5 likes per comment
- Increases comment engagement

## Data Characteristics

### Realistic Features

1. **Time Distribution**: All data has realistic timestamps spread over past 30 days
2. **Social Graph**: Follow relationships create a connected community
3. **Engagement Patterns**: Popular posts get more likes/comments
4. **User Behavior**: Users with similar types tend to interact more
5. **Campaign Progress**: Varies by status (new, active, successful, urgent)

### Database Integrity

- All foreign key relationships are valid
- Unique constraints are respected
- Denormalized counts match actual data
- No orphaned records

### Idempotency

The seed script is idempotent:
- Clears all existing data first
- Can be run multiple times safely
- Always produces consistent results

## Validation

After seeding, the script validates:

- Minimum counts for all entity types
- Referential integrity (no orphaned records)
- Sample data inspection
- Detailed summary statistics

### Example Output

```
📊 Seed Data Summary:
  Users: 20
  Fundraisers: 10
  Posts: 75
  Comments: 150
  Likes: 750
  Reposts: 75
  Bookmarks: 25
  Follows: 65
  Hashtags: 12

✓ Users count meets minimum (20)
✓ Fundraisers count meets minimum (10)
✓ Posts count meets minimum (50)
✓ Comments count meets minimum (100)
✓ Likes count meets minimum (500)
✓ Reposts count meets minimum (50)
✓ Bookmarks count meets minimum (20)
✓ Follows count meets minimum (50)

✅ All validations passed!
```

## Testing with Seeded Data

### Authentication

**Web3 Login:**
- Use any seeded user's wallet address
- SIWE (Sign-In with Ethereum) flow

**Web2 Login (Hybrid Users):**
- Email: Any user with email field populated
- Password: `Password123!` (default for all hybrid users)

### Sample Queries

```graphql
# Get all users
query {
  users {
    id
    username
    displayName
    followersCount
  }
}

# Get all campaigns
query {
  fundraisers {
    id
    name
    goalAmount
    raisedAmount
    isActive
  }
}

# Get feed posts
query {
  posts(take: 20) {
    id
    content
    author {
      username
      displayName
    }
    likesCount
    repostsCount
  }
}
```

## Customization

### Adjusting Data Volume

Edit the seed files to change quantities:

```typescript
// posts.seed.ts
const totalPosts = faker.number.int({ min: 50, max: 100 }); // Change these values

// interactions.seed.ts
const totalLikes = faker.number.int({ min: 500, max: 1000 }); // Change these values
```

### Adding New User Types

```typescript
// users.seed.ts
const userTypes = [
  ...Array(5).fill('activist'),
  ...Array(5).fill('entrepreneur'),
  ...Array(5).fill('artist'),
  ...Array(5).fill('donor'),
  ...Array(5).fill('your-new-type'), // Add new type
];
```

### Custom Campaign Templates

Add new campaigns to the `campaignTemplates` array in `campaigns.seed.ts`.

## Troubleshooting

### "Cannot connect to database"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### "Foreign key constraint violation"

- The clear function should handle this automatically
- Try `npx prisma migrate reset` for a full reset

### "Unique constraint violation"

- This should not happen as the script handles uniqueness
- Try clearing the database manually first

### Performance Issues

- Seeding takes 30-60 seconds typically
- For large datasets, consider batching creates
- Check database connection pool settings

## Advanced Usage

### Seed Specific Tables Only

```typescript
// In seed.ts, comment out steps you don't need
await seedUsers(); // Keep
// await seedCampaigns(users); // Skip
// await seedPosts(users, campaigns); // Skip
```

### Custom Seed Data

```typescript
// Create your own seed functions
async function seedCustomData() {
  await prisma.user.create({
    data: {
      walletAddress: '0x1234...',
      username: 'custom_user',
      // ... your data
    },
  });
}
```

### Production Considerations

**DO NOT run seed scripts in production!**

The seed script includes:
- `clearDatabase()` which DELETES ALL DATA
- Test data not suitable for production
- Predictable test credentials

Use migrations and manual data entry for production.

## Dependencies

- `@faker-js/faker` - Fake data generation
- `ethers` - Wallet address generation
- `bcrypt` - Password hashing
- `@prisma/client` - Database access

## Contributing

When adding new seed data:

1. Create/update seed file in `prisma/seeds/`
2. Update main orchestrator in `seed.ts`
3. Add validation in `validateSeedData()`
4. Update this README with new data characteristics
5. Test with `npm run seed`

## Resources

- [Prisma Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database)
- [Faker.js Documentation](https://fakerjs.dev/)
- [FundBrave Schema](../schema.prisma)

---

**Last Updated**: 2026-01-14
**Maintainer**: FundBrave Backend Team
