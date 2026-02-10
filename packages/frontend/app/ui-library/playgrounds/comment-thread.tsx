"use client";

import { CommentThread } from "@/app/components/ui/comments/CommentThread";
import {
  MOCK_COMMENT_AUTHOR_1,
  MOCK_COMMENT_AUTHOR_2,
  MOCK_COMMENT_AUTHOR_3,
} from "@/app/ui-library/playgrounds/_mock-data";
import type { Comment } from "@/app/types/comment";
import type { PlaygroundConfig } from "../types";

// ---------------------------------------------------------------------------
// Mock root comment with 5 replies to demonstrate collapse/expand
// ---------------------------------------------------------------------------

const MOCK_ROOT_COMMENT: Comment = {
  id: "thread-root-001",
  content:
    "The Solar Panels for Rural Schools campaign just passed its funding milestone. 3.8 ETH raised from 62 on-chain donors. Every transaction is verifiable on the blockchain -- that is the FundBrave promise.",
  parentId: null,
  rootId: null,
  depth: 0,
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_2,
  likesCount: 18,
  repliesCount: 5,
  isLiked: false,
  postId: "demo-post",
  replies: [],
};

const MOCK_REPLY_1: Comment = {
  id: "thread-reply-001",
  content:
    "Congrats on the milestone! I staked 0.5 ETH and the yield tracking has been spot-on so far.",
  parentId: "thread-root-001",
  rootId: "thread-root-001",
  depth: 1,
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_1,
  likesCount: 7,
  repliesCount: 2,
  isLiked: true,
  postId: "demo-post",
  replies: [],
};

const MOCK_REPLY_2: Comment = {
  id: "thread-reply-002",
  content:
    "Is there a breakdown of how the funds are allocated between equipment and installation costs?",
  parentId: "thread-root-001",
  rootId: "thread-root-001",
  depth: 1,
  createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_3,
  likesCount: 3,
  repliesCount: 0,
  isLiked: false,
  postId: "demo-post",
  replies: [],
};

const MOCK_REPLY_3: Comment = {
  id: "thread-reply-003",
  content:
    "Shared this with our DAO governance channel. We are considering a collective donation.",
  parentId: "thread-root-001",
  rootId: "thread-root-001",
  depth: 1,
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  author: {
    id: "user-005",
    name: "Lena Petrov",
    username: "lenapetrov",
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Lena&backgroundColor=1a1a2e",
    isVerified: true,
  },
  likesCount: 11,
  repliesCount: 0,
  isLiked: false,
  postId: "demo-post",
  replies: [],
};

const MOCK_REPLY_4: Comment = {
  id: "thread-reply-004",
  content:
    "The on-chain transparency is what sold me. I can see exactly which wallet received my contribution.",
  parentId: "thread-root-001",
  rootId: "thread-root-001",
  depth: 1,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_1,
  likesCount: 5,
  repliesCount: 0,
  isLiked: false,
  postId: "demo-post",
  replies: [],
};

const MOCK_REPLY_5: Comment = {
  id: "thread-reply-005",
  content:
    "Just donated another 0.2 ETH. Let us push this over the finish line before the deadline!",
  parentId: "thread-root-001",
  rootId: "thread-root-001",
  depth: 1,
  createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_3,
  likesCount: 9,
  repliesCount: 0,
  isLiked: true,
  postId: "demo-post",
  replies: [],
};

const ALL_REPLIES: Comment[] = [
  MOCK_REPLY_1,
  MOCK_REPLY_2,
  MOCK_REPLY_3,
  MOCK_REPLY_4,
  MOCK_REPLY_5,
];

// Nested replies for MOCK_REPLY_1 to demonstrate depth-2 expand/collapse
const MOCK_NESTED_REPLIES: Record<string, Comment[]> = {
  "thread-reply-001": [
    {
      id: "thread-nested-001",
      content:
        "Same here -- the staking APY has been consistent at around 4.2%. Really incentivizes long-term support.",
      parentId: "thread-reply-001",
      rootId: "thread-root-001",
      depth: 2,
      createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      author: MOCK_COMMENT_AUTHOR_3,
      likesCount: 2,
      repliesCount: 0,
      isLiked: false,
      postId: "demo-post",
      replies: [],
    },
    {
      id: "thread-nested-002",
      content:
        "The yield is auto-compounded too. Smart contract handles everything.",
      parentId: "thread-reply-001",
      rootId: "thread-root-001",
      depth: 2,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      author: MOCK_COMMENT_AUTHOR_2,
      likesCount: 4,
      repliesCount: 0,
      isLiked: true,
      postId: "demo-post",
      replies: [],
    },
  ],
};

const noop = () => {};

const commentThreadPlayground: PlaygroundConfig = {
  componentName: "CommentThread",
  importPath: "@/app/components/ui/comments/CommentThread",
  controls: [
    {
      prop: "maxVisibleReplies",
      label: "Max Visible Replies",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 10,
      step: 1,
    },
  ],
  renderPreview: (props) => (
    <CommentThread
      comment={MOCK_ROOT_COMMENT}
      replies={ALL_REPLIES}
      nestedReplies={MOCK_NESTED_REPLIES}
      maxVisibleReplies={props.maxVisibleReplies as number}
      onReply={noop}
      onLike={noop}
      onUnlike={noop}
      onShowMoreReplies={noop}
      onDelete={noop}
      currentUserUsername="demo-viewer"
      isHighlighted={false}
      isCreator={false}
    />
  ),
};

export default commentThreadPlayground;
