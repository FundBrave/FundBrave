import type { LeaderboardUser, LeaderboardData } from "@/app/types/leaderboard";

// Mock avatar URLs using Unsplash
const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
];

// Mock names for leaderboard
const names = [
  "Agatha Links",
  "Lincoln Mike",
  "Jude Knorrs",
  "Akpan Mike",
  "Kate Tanner",
  "Thomas Magnum",
  "Angela Bower",
  "Lynn Tanner",
  "Dr. Bonnie Barstow",
  "B.A. Baracus",
  "April Curtis",
  "Rick Simon",
  "A.J. Simon",
  "Maddie Hayes",
  "David Addison",
  "Laura Holt",
  "Remington Steele",
  "Jonathan Hart",
  "Jennifer Hart",
  "Max",
  "Colt Seavers",
  "Howie Munson",
  "Jody Banks",
  "Michael Knight",
  "Devon Miles",
  "Bonnie Barstow",
  "April Curtis",
  "Stringfellow Hawke",
  "Dominic Santini",
  "Caitlin O'Shannessy",
  "MacGyver",
  "Pete Thornton",
  "Jack Dalton",
  "Nikki Carpenter",
  "Kelly Garrett",
  "Jill Munroe",
  "Sabrina Duncan",
  "Kris Munroe",
  "Tiffany Welles",
  "Julie Rogers",
  "Thomas Sullivan",
  "Jessica Fletcher",
  "Amos Tupper",
  "Seth Hazlitt",
  "Magnum",
  "TC Calvin",
  "Rick Wright",
  "Higgins",
  "Robin Masters",
  "Carol Baldwin",
];

// Generate mock user data
function generateUser(rank: number, pointsBase: number): LeaderboardUser {
  const nameIndex = (rank - 1) % names.length;
  const avatarIndex = (rank - 1) % avatars.length;

  // Generate random date in 2024
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const memberSince = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/2024`;

  return {
    rank,
    id: `user-${rank}`,
    name: names[nameIndex],
    username: `@${names[nameIndex].toLowerCase().replace(/\s+/g, "").replace(/\./g, "")}`,
    avatar: avatars[avatarIndex],
    points: Math.max(10, pointsBase - (rank - 1) * Math.floor(Math.random() * 15 + 5)),
    memberSince,
  };
}

// Generate all-time leaderboard (50+ entries)
function generateAllTimeLeaderboard(): LeaderboardUser[] {
  const users: LeaderboardUser[] = [];
  const basePoints = 500;

  for (let i = 1; i <= 50; i++) {
    users.push(generateUser(i, basePoints));
  }

  // Add current user at rank 100 for testing the position indicator
  users.push({
    rank: 100,
    id: "current-user",
    name: "You (Test User)",
    username: "@testuser",
    avatar: avatars[0],
    points: 145,
    memberSince: "01/01/2025",
  });

  // Add users around the current user for context
  users.push(generateUser(99, 150));
  users.push(generateUser(101, 140));

  return users;
}

// Generate monthly leaderboard (different rankings)
function generateMonthlyLeaderboard(): LeaderboardUser[] {
  const users: LeaderboardUser[] = [];
  const basePoints = 200;

  for (let i = 1; i <= 50; i++) {
    // Shuffle the order slightly for monthly
    const shuffledIndex = ((i * 7) % 50) + 1;
    const user = generateUser(i, basePoints);
    user.name = names[(shuffledIndex - 1) % names.length];
    user.username = `@${user.name.toLowerCase().replace(/\s+/g, "").replace(/\./g, "")}`;
    users.push(user);
  }

  // Add current user at different position for monthly
  users.push({
    rank: 75,
    id: "current-user",
    name: "You (Test User)",
    username: "@testuser",
    avatar: avatars[0],
    points: 85,
    memberSince: "01/01/2025",
  });

  users.push(generateUser(74, 90));
  users.push(generateUser(76, 80));

  return users;
}

// Generate weekly leaderboard (different rankings)
function generateWeeklyLeaderboard(): LeaderboardUser[] {
  const users: LeaderboardUser[] = [];
  const basePoints = 100;

  for (let i = 1; i <= 50; i++) {
    // Different shuffle for weekly
    const shuffledIndex = ((i * 13) % 50) + 1;
    const user = generateUser(i, basePoints);
    user.name = names[(shuffledIndex - 1) % names.length];
    user.username = `@${user.name.toLowerCase().replace(/\s+/g, "").replace(/\./g, "")}`;
    users.push(user);
  }

  // Add current user at position 25 for weekly (visible in list)
  users.push({
    rank: 25,
    id: "current-user",
    name: "You (Test User)",
    username: "@testuser",
    avatar: avatars[0],
    points: 55,
    memberSince: "01/01/2025",
  });

  return users;
}

// Export mock data
export const mockLeaderboardData: LeaderboardData = {
  allTime: generateAllTimeLeaderboard().sort((a, b) => a.rank - b.rank),
  monthly: generateMonthlyLeaderboard().sort((a, b) => a.rank - b.rank),
  weekly: generateWeeklyLeaderboard().sort((a, b) => a.rank - b.rank),
};

// Current user ID for testing
export const CURRENT_USER_ID = "current-user";
