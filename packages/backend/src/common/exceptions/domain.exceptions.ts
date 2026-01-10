import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

/**
 * Base class for FundBrave domain exceptions
 */
export abstract class FundBraveDomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

// ==================== IMPACT DAO EXCEPTIONS ====================

/**
 * Thrown when a stake is not found
 */
export class StakeNotFoundException extends NotFoundException {
  constructor(stakeId?: string) {
    super({
      code: 'STAKE_NOT_FOUND',
      message: stakeId
        ? `Stake with ID ${stakeId} not found`
        : 'Stake not found',
    });
  }
}

/**
 * Thrown when user has insufficient stake for an operation
 */
export class InsufficientStakeException extends BadRequestException {
  constructor(required: string, available: string) {
    super({
      code: 'INSUFFICIENT_STAKE',
      message: `Insufficient stake. Required: ${required}, Available: ${available}`,
      details: { required, available },
    });
  }
}

/**
 * Thrown when yield split configuration is invalid
 */
export class InvalidYieldSplitException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: 'INVALID_YIELD_SPLIT',
      message: message || 'Yield split must sum to 10000 basis points with minimum 200 platform share',
    });
  }
}

/**
 * Thrown when there is no yield available to harvest
 */
export class NoYieldAvailableException extends BadRequestException {
  constructor() {
    super({
      code: 'NO_YIELD_AVAILABLE',
      message: 'No yield available to harvest',
    });
  }
}

// ==================== WEALTH BUILDING EXCEPTIONS ====================

/**
 * Thrown when an endowment is not found
 */
export class EndowmentNotFoundException extends NotFoundException {
  constructor(donorAddress?: string, fundraiserId?: number) {
    super({
      code: 'ENDOWMENT_NOT_FOUND',
      message: donorAddress && fundraiserId
        ? `No endowment found for donor ${donorAddress} and fundraiser ${fundraiserId}`
        : 'Endowment not found',
      details: { donorAddress, fundraiserId },
    });
  }
}

/**
 * Thrown when donation amount is invalid
 */
export class InvalidDonationAmountException extends BadRequestException {
  constructor(amount: string, minAmount: string) {
    super({
      code: 'INVALID_DONATION_AMOUNT',
      message: `Donation amount ${amount} is below minimum ${minAmount}`,
      details: { amount, minAmount },
    });
  }
}

/**
 * Thrown when stock token is not supported
 */
export class UnsupportedStockException extends BadRequestException {
  constructor(stockToken: string) {
    super({
      code: 'UNSUPPORTED_STOCK',
      message: `Stock token ${stockToken} is not supported`,
      details: { stockToken },
    });
  }
}

// ==================== TREASURY EXCEPTIONS ====================

/**
 * Thrown when caller is not authorized to perform treasury operations
 */
export class UnauthorizedFeeSenderException extends ForbiddenException {
  constructor(sender: string) {
    super({
      code: 'UNAUTHORIZED_FEE_SENDER',
      message: `Address ${sender} is not authorized to send fees`,
      details: { sender },
    });
  }
}

/**
 * Thrown when there are no pending fees to stake
 */
export class NoPendingFeesException extends BadRequestException {
  constructor() {
    super({
      code: 'NO_PENDING_FEES',
      message: 'No pending fees available to stake',
    });
  }
}

// ==================== FBT VESTING EXCEPTIONS ====================

/**
 * Thrown when a vesting schedule is not found
 */
export class VestingScheduleNotFoundException extends NotFoundException {
  constructor(scheduleId?: string) {
    super({
      code: 'VESTING_SCHEDULE_NOT_FOUND',
      message: scheduleId
        ? `Vesting schedule with ID ${scheduleId} not found`
        : 'Vesting schedule not found',
    });
  }
}

/**
 * Thrown when there are no claimable tokens
 */
export class NoClaimableTokensException extends BadRequestException {
  constructor() {
    super({
      code: 'NO_CLAIMABLE_TOKENS',
      message: 'No tokens available to claim',
    });
  }
}

/**
 * Thrown when vesting duration is invalid
 */
export class InvalidVestingDurationException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_VESTING_DURATION',
      message: 'Vesting duration must be greater than zero',
    });
  }
}

// ==================== DAO VOTING EXCEPTIONS ====================

/**
 * Thrown when a proposal is not found
 */
export class ProposalNotFoundException extends NotFoundException {
  constructor(proposalId?: string) {
    super({
      code: 'PROPOSAL_NOT_FOUND',
      message: proposalId
        ? `Proposal with ID ${proposalId} not found`
        : 'Proposal not found',
    });
  }
}

/**
 * Thrown when user has insufficient voting power
 */
export class InsufficientVotingPowerException extends BadRequestException {
  constructor(required: string, available: string) {
    super({
      code: 'INSUFFICIENT_VOTING_POWER',
      message: `Insufficient voting power. Required: ${required}, Available: ${available}`,
      details: { required, available },
    });
  }
}

/**
 * Thrown when proposal is not active
 */
export class ProposalNotActiveException extends BadRequestException {
  constructor(proposalId: string, status: string) {
    super({
      code: 'PROPOSAL_NOT_ACTIVE',
      message: `Proposal ${proposalId} is not active. Current status: ${status}`,
      details: { proposalId, status },
    });
  }
}

/**
 * Thrown when voting period has ended
 */
export class VotingPeriodEndedException extends BadRequestException {
  constructor(proposalId: string, endTime: Date) {
    super({
      code: 'VOTING_PERIOD_ENDED',
      message: `Voting period for proposal ${proposalId} ended at ${endTime.toISOString()}`,
      details: { proposalId, endTime },
    });
  }
}

/**
 * Thrown when user has already voted
 */
export class AlreadyVotedException extends ConflictException {
  constructor(proposalId: string, voterId: string) {
    super({
      code: 'ALREADY_VOTED',
      message: `User ${voterId} has already voted on proposal ${proposalId}`,
      details: { proposalId, voterId },
    });
  }
}

/**
 * Thrown when quorum is not reached
 */
export class QuorumNotReachedException extends BadRequestException {
  constructor(proposalId: string, required: string, actual: string) {
    super({
      code: 'QUORUM_NOT_REACHED',
      message: `Quorum not reached for proposal ${proposalId}. Required: ${required}, Actual: ${actual}`,
      details: { proposalId, required, actual },
    });
  }
}

// ==================== BLOCKCHAIN EXCEPTIONS ====================

/**
 * Thrown when a blockchain transaction fails
 */
export class BlockchainTransactionException extends HttpException {
  constructor(txHash: string, error: string) {
    super(
      {
        code: 'BLOCKCHAIN_TRANSACTION_FAILED',
        message: `Transaction ${txHash} failed: ${error}`,
        details: { txHash, error },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Thrown when contract address is not found
 */
export class ContractNotRegisteredException extends NotFoundException {
  constructor(contractName: string, chainId: number) {
    super({
      code: 'CONTRACT_NOT_REGISTERED',
      message: `Contract ${contractName} not registered for chain ${chainId}`,
      details: { contractName, chainId },
    });
  }
}

// ==================== GENERAL EXCEPTIONS ====================

/**
 * Thrown when a fundraiser is not found
 */
export class FundraiserNotFoundException extends NotFoundException {
  constructor(fundraiserId?: string | number) {
    super({
      code: 'FUNDRAISER_NOT_FOUND',
      message: fundraiserId
        ? `Fundraiser with ID ${fundraiserId} not found`
        : 'Fundraiser not found',
    });
  }
}

/**
 * Thrown when a user is not found
 */
export class UserNotFoundException extends NotFoundException {
  constructor(identifier?: string) {
    super({
      code: 'USER_NOT_FOUND',
      message: identifier
        ? `User ${identifier} not found`
        : 'User not found',
    });
  }
}

/**
 * Thrown when a user already exists
 */
export class UserAlreadyExistsException extends ConflictException {
  constructor(identifier?: string) {
    super({
      code: 'USER_ALREADY_EXISTS',
      message: identifier
        ? `User ${identifier} already exists`
        : 'User already exists',
    });
  }
}

/**
 * Thrown when a username is already taken
 */
export class UsernameAlreadyTakenException extends ConflictException {
  constructor(username: string) {
    super({
      code: 'USERNAME_ALREADY_TAKEN',
      message: `Username ${username} is already taken`,
      details: { username },
    });
  }
}

/**
 * Thrown when input validation fails
 */
export class InvalidInputException extends BadRequestException {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      code: 'INVALID_INPUT',
      message,
      details,
    });
  }
}

/**
 * Thrown when user is not authorized to perform an action
 */
export class UnauthorizedException extends ForbiddenException {
  constructor(message?: string) {
    super({
      code: 'UNAUTHORIZED',
      message: message || 'You are not authorized to perform this action',
    });
  }
}

// ==================== MESSAGING EXCEPTIONS ====================

/**
 * Thrown when a conversation is not found
 */
export class ConversationNotFoundException extends NotFoundException {
  constructor(conversationId?: string) {
    super({
      code: 'CONVERSATION_NOT_FOUND',
      message: conversationId
        ? `Conversation with ID ${conversationId} not found`
        : 'Conversation not found',
    });
  }
}

/**
 * Thrown when a message is not found
 */
export class MessageNotFoundException extends NotFoundException {
  constructor(messageId?: string) {
    super({
      code: 'MESSAGE_NOT_FOUND',
      message: messageId
        ? `Message with ID ${messageId} not found`
        : 'Message not found',
    });
  }
}

/**
 * Thrown when user attempts to message a blocked user
 */
export class CannotMessageBlockedUserException extends ForbiddenException {
  constructor() {
    super({
      code: 'CANNOT_MESSAGE_BLOCKED_USER',
      message: 'Cannot send messages to or from a blocked user',
    });
  }
}

/**
 * Thrown when user attempts to message themselves
 */
export class CannotMessageSelfException extends BadRequestException {
  constructor() {
    super({
      code: 'CANNOT_MESSAGE_SELF',
      message: 'Cannot start a conversation with yourself',
    });
  }
}

/**
 * Thrown when user is not a participant of a conversation
 */
export class NotConversationParticipantException extends ForbiddenException {
  constructor(conversationId?: string) {
    super({
      code: 'NOT_CONVERSATION_PARTICIPANT',
      message: conversationId
        ? `You are not a participant of conversation ${conversationId}`
        : 'You are not a participant of this conversation',
    });
  }
}

// ==================== DONATIONS EXCEPTIONS ====================

/**
 * Thrown when a donation is not found
 */
export class DonationNotFoundException extends NotFoundException {
  constructor(donationId?: string) {
    super({
      code: 'DONATION_NOT_FOUND',
      message: donationId
        ? `Donation with ID ${donationId} not found`
        : 'Donation not found',
    });
  }
}

/**
 * Thrown when a transaction has already been processed
 */
export class DuplicateTransactionException extends ConflictException {
  constructor(txHash: string) {
    super({
      code: 'DUPLICATE_TRANSACTION',
      message: `Transaction ${txHash} has already been processed`,
      details: { txHash },
    });
  }
}

// ==================== SOCIAL EXCEPTIONS ====================

/**
 * Thrown when a post is not found
 */
export class PostNotFoundException extends NotFoundException {
  constructor(postId?: string) {
    super({
      code: 'POST_NOT_FOUND',
      message: postId ? `Post with ID ${postId} not found` : 'Post not found',
    });
  }
}

/**
 * Thrown when a comment is not found
 */
export class CommentNotFoundException extends NotFoundException {
  constructor(commentId?: string) {
    super({
      code: 'COMMENT_NOT_FOUND',
      message: commentId
        ? `Comment with ID ${commentId} not found`
        : 'Comment not found',
    });
  }
}
