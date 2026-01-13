import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket Gateway for real-time events
 * Handles subscriptions and broadcasts for all platform activities
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  // Track active connections
  private connectedClients = new Map<string, string[]>(); // socketId => [subscriptions]

  // ==================== Connection Lifecycle ====================

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, []);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // ==================== Subscription Handlers ====================

  /**
   * Subscribe to a specific fundraiser's updates
   */
  @SubscribeMessage('subscribeFundraiser')
  handleSubscribeFundraiser(
    @ConnectedSocket() client: Socket,
    @MessageBody() fundraiserId: string,
  ) {
    const room = `fundraiser:${fundraiserId}`;
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Unsubscribe from a fundraiser
   */
  @SubscribeMessage('unsubscribeFundraiser')
  handleUnsubscribeFundraiser(
    @ConnectedSocket() client: Socket,
    @MessageBody() fundraiserId: string,
  ) {
    const room = `fundraiser:${fundraiserId}`;
    client.leave(room);
    this.removeSubscription(client.id, room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  /**
   * Subscribe to user-specific notifications
   */
  @SubscribeMessage('subscribeUser')
  handleSubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const room = `user:${userId}`;
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Subscribe to Impact DAO pool updates
   */
  @SubscribeMessage('subscribeImpactDAO')
  handleSubscribeImpactDAO(@ConnectedSocket() client: Socket) {
    const room = 'impactDAO:global';
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Subscribe to platform treasury updates
   */
  @SubscribeMessage('subscribeTreasury')
  handleSubscribeTreasury(@ConnectedSocket() client: Socket) {
    const room = 'treasury:global';
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Subscribe to global platform stats
   */
  @SubscribeMessage('subscribeGlobalStats')
  handleSubscribeGlobalStats(@ConnectedSocket() client: Socket) {
    const room = 'stats:global';
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Subscribe to DAO voting proposals
   */
  @SubscribeMessage('subscribeDAOVoting')
  handleSubscribeDAOVoting(@ConnectedSocket() client: Socket) {
    const room = 'dao:voting';
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  // ==================== Event Emitters - Fundraising ====================

  /**
   * Emit new donation event
   */
  emitDonation(data: {
    fundraiserId: string;
    donorAddress: string;
    amount: string;
    txHash: string;
  }) {
    this.server.to(`fundraiser:${data.fundraiserId}`).emit('donation', data);
    this.server.to('stats:global').emit('globalDonation', data);
  }

  /**
   * Emit fundraiser created event
   */
  emitFundraiserCreated(data: {
    fundraiserId: string;
    name: string;
    creatorAddress: string;
    goalAmount: string;
  }) {
    this.server.emit('fundraiserCreated', data);
    this.server.to('stats:global').emit('newFundraiser', data);
  }

  /**
   * Emit fundraiser goal reached event
   */
  emitGoalReached(data: { fundraiserId: string; totalRaised: string }) {
    this.server.to(`fundraiser:${data.fundraiserId}`).emit('goalReached', data);
  }

  // ==================== Event Emitters - Staking ====================

  /**
   * Emit stake event (campaign-specific staking)
   */
  emitStake(data: {
    fundraiserId: string;
    stakerAddress: string;
    amount: string;
    txHash: string;
  }) {
    this.server.to(`fundraiser:${data.fundraiserId}`).emit('stake', data);
  }

  /**
   * Emit unstake event
   */
  emitUnstake(data: {
    fundraiserId: string;
    stakerAddress: string;
    amount: string;
    txHash: string;
  }) {
    this.server.to(`fundraiser:${data.fundraiserId}`).emit('unstake', data);
  }

  /**
   * Emit yield harvested event for campaign staking
   */
  emitYieldHarvested(data: {
    fundraiserId: string;
    totalYield: string;
    causeAmount: string;
    stakerAmount: string;
    txHash: string;
  }) {
    this.server
      .to(`fundraiser:${data.fundraiserId}`)
      .emit('yieldHarvested', data);
  }

  // ==================== Event Emitters - Impact DAO ====================

  /**
   * Emit Impact DAO stake event
   */
  emitImpactDAOStake(data: {
    stakerAddress: string;
    amount: string;
    yieldSplit: {
      daoShare: number;
      stakerShare: number;
      platformShare: number;
    };
    txHash: string;
  }) {
    this.server.to('impactDAO:global').emit('daoStake', data);
    this.server.to('stats:global').emit('impactDAOActivity', data);
  }

  /**
   * Emit Impact DAO yield harvested event
   */
  emitImpactDAOYieldHarvested(data: {
    totalYield: string;
    daoAmount: string;
    stakerAmount: string;
    platformAmount: string;
    txHash: string;
  }) {
    this.server.to('impactDAO:global').emit('daoYieldHarvested', data);
  }

  // ==================== Event Emitters - Wealth Building ====================

  /**
   * Emit wealth building donation event
   */
  emitWealthBuildingDonation(data: {
    fundraiserId: string;
    donorAddress: string;
    totalAmount: string;
    directAmount: string;
    endowmentAmount: string;
    txHash: string;
  }) {
    this.server
      .to(`fundraiser:${data.fundraiserId}`)
      .emit('wealthBuildingDonation', data);
    this.server.to('stats:global').emit('wealthBuildingActivity', data);
  }

  /**
   * Emit stock purchased event
   */
  emitStockPurchased(data: {
    donorAddress: string;
    stockToken: string;
    stockSymbol: string;
    usdcAmount: string;
    stockAmount: string;
    txHash: string;
  }) {
    this.server.to(`user:${data.donorAddress}`).emit('stockPurchased', data);
  }

  // ==================== Event Emitters - Treasury ====================

  /**
   * Emit platform fee received event
   */
  emitFeeReceived(data: {
    from: string;
    amount: string;
    source: string;
    txHash: string;
  }) {
    this.server.to('treasury:global').emit('feeReceived', data);
  }

  /**
   * Emit fees staked event
   */
  emitFeesStaked(data: { amount: string; txHash: string }) {
    this.server.to('treasury:global').emit('feesStaked', data);
  }

  /**
   * Emit FBT staked event
   */
  emitFBTStaked(data: {
    stakerAddress: string;
    amount: string;
    txHash: string;
  }) {
    this.server.to('treasury:global').emit('fbtStaked', data);
    this.server.to(`user:${data.stakerAddress}`).emit('fbtStaked', data);
  }

  // ==================== Event Emitters - FBT Vesting ====================

  /**
   * Emit vesting schedule created event
   */
  emitVestingScheduleCreated(data: {
    recipientAddress: string;
    amount: string;
    duration: number;
    vestingType: string;
    txHash: string;
  }) {
    this.server
      .to(`user:${data.recipientAddress}`)
      .emit('vestingScheduleCreated', data);
  }

  /**
   * Emit vested tokens claimed event
   */
  emitVestedTokensClaimed(data: {
    recipientAddress: string;
    amount: string;
    txHash: string;
  }) {
    this.server
      .to(`user:${data.recipientAddress}`)
      .emit('vestedTokensClaimed', data);
  }

  // ==================== Event Emitters - DAO Voting ====================

  /**
   * Emit new proposal created event
   */
  emitProposalCreated(data: {
    proposalId: string;
    title: string;
    description: string;
    creatorAddress: string;
    fundingRequested: string;
    votingEndsAt: Date;
  }) {
    this.server.to('dao:voting').emit('proposalCreated', data);
  }

  /**
   * Emit vote cast event
   */
  emitVoteCast(data: {
    proposalId: string;
    voterAddress: string;
    votingPower: string;
    support: boolean;
  }) {
    this.server.to('dao:voting').emit('voteCast', data);
  }

  /**
   * Emit proposal executed event
   */
  emitProposalExecuted(data: {
    proposalId: string;
    totalVotes: string;
    result: string;
    txHash: string;
  }) {
    this.server.to('dao:voting').emit('proposalExecuted', data);
  }

  // ==================== Event Emitters - Social & Notifications ====================

  /**
   * Emit user notification
   */
  emitNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      link?: string;
      createdAt: Date;
    },
  ) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Emit new post event
   */
  emitNewPost(data: {
    postId: string;
    authorId: string;
    content: string;
    mediaUrls?: string[];
    fundraiserId?: string;
  }) {
    if (data.fundraiserId) {
      this.server.to(`fundraiser:${data.fundraiserId}`).emit('newPost', data);
    }
    this.server.emit('globalNewPost', data);
  }

  /**
   * Emit global statistics update
   */
  emitGlobalStatsUpdate(stats: {
    totalFundraisers: number;
    totalDonations: string;
    totalStaked: string;
    activeDonors: number;
  }) {
    this.server.to('stats:global').emit('statsUpdate', stats);
  }

  // ==================== Event Emitters - Direct Messaging ====================

  /**
   * Subscribe to a specific conversation for real-time updates
   */
  @SubscribeMessage('subscribeConversation')
  handleSubscribeConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const room = `conversation:${conversationId}`;
    client.join(room);
    this.addSubscription(client.id, room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  /**
   * Unsubscribe from a conversation
   */
  @SubscribeMessage('unsubscribeConversation')
  handleUnsubscribeConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const room = `conversation:${conversationId}`;
    client.leave(room);
    this.removeSubscription(client.id, room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  /**
   * Handle typing start event from client
   */
  @SubscribeMessage('typingStart')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    // Broadcast to other participants in the conversation
    client.to(room).emit('userTyping', {
      conversationId: data.conversationId,
      userId: data.userId,
      isTyping: true,
      timestamp: new Date(),
    });
    return {
      event: 'typingStarted',
      data: { conversationId: data.conversationId },
    };
  }

  /**
   * Handle typing stop event from client
   */
  @SubscribeMessage('typingStop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    // Broadcast to other participants in the conversation
    client.to(room).emit('userTyping', {
      conversationId: data.conversationId,
      userId: data.userId,
      isTyping: false,
      timestamp: new Date(),
    });
    return {
      event: 'typingStopped',
      data: { conversationId: data.conversationId },
    };
  }

  /**
   * Emit new message event
   */
  emitNewMessage(data: {
    conversationId: string;
    message: {
      id: string;
      conversationId: string;
      sender: {
        id: string;
        walletAddress: string;
        username?: string;
        displayName?: string;
        avatarUrl?: string;
      };
      receiver: {
        id: string;
        walletAddress: string;
        username?: string;
        displayName?: string;
        avatarUrl?: string;
      };
      content: string;
      mediaUrl?: string;
      read: boolean;
      readAt?: Date;
      createdAt: Date;
    };
    receiverId: string;
  }) {
    // Emit to the conversation room
    this.server.to(`conversation:${data.conversationId}`).emit('newMessage', {
      conversationId: data.conversationId,
      message: data.message,
    });

    // Also emit to the receiver's user room (for notifications when not in conversation)
    this.server.to(`user:${data.receiverId}`).emit('messageReceived', {
      conversationId: data.conversationId,
      message: data.message,
      senderId: data.message.sender.id,
      senderName:
        data.message.sender.displayName ||
        data.message.sender.username ||
        'Unknown',
      preview: data.message.content.substring(0, 100),
    });

    this.logger.log(
      `New message emitted in conversation ${data.conversationId}`,
    );
  }

  /**
   * Emit typing indicator event (from resolver)
   */
  emitTypingIndicator(data: {
    conversationId: string;
    user: {
      id: string;
      walletAddress: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    };
    isTyping: boolean;
    timestamp: Date;
  }) {
    this.server.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId: data.user.id,
      userName: data.user.displayName || data.user.username || 'Unknown',
      isTyping: data.isTyping,
      timestamp: data.timestamp,
    });
  }

  /**
   * Emit message read receipt event
   */
  emitMessageRead(data: {
    conversationId: string;
    messageIds: string[];
    readByUserId: string;
    readAt: Date;
  }) {
    this.server.to(`conversation:${data.conversationId}`).emit('messagesRead', {
      conversationId: data.conversationId,
      messageIds: data.messageIds,
      readByUserId: data.readByUserId,
      readAt: data.readAt,
    });

    this.logger.log(
      `Read receipt for ${data.messageIds.length} messages in conversation ${data.conversationId}`,
    );
  }

  /**
   * Emit message delivered event (when receiver connects)
   */
  emitMessageDelivered(data: {
    conversationId: string;
    messageIds: string[];
    deliveredToUserId: string;
    deliveredAt: Date;
  }) {
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('messagesDelivered', {
        conversationId: data.conversationId,
        messageIds: data.messageIds,
        deliveredToUserId: data.deliveredToUserId,
        deliveredAt: data.deliveredAt,
      });
  }

  // ==================== Helper Methods ====================

  /**
   * Add subscription to client's subscription list
   */
  private addSubscription(clientId: string, room: string) {
    const subscriptions = this.connectedClients.get(clientId) || [];
    if (!subscriptions.includes(room)) {
      subscriptions.push(room);
      this.connectedClients.set(clientId, subscriptions);
    }
  }

  /**
   * Remove subscription from client's subscription list
   */
  private removeSubscription(clientId: string, room: string) {
    const subscriptions = this.connectedClients.get(clientId) || [];
    const index = subscriptions.indexOf(room);
    if (index > -1) {
      subscriptions.splice(index, 1);
      this.connectedClients.set(clientId, subscriptions);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClients(): number {
    return this.connectedClients.size;
  }

  /**
   * Get number of subscribers to a room
   */
  getRoomSubscribers(room: string): number {
    return Array.from(this.connectedClients.values()).filter((subscriptions) =>
      subscriptions.includes(room),
    ).length;
  }
}
