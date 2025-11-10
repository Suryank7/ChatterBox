import { users, messages, conversations, type User, type InsertUser, type Message, type InsertMessage, type Conversation } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation>;
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  markMessageAsDelivered(messageId: string): Promise<void>;
  getLastMessage(userId1: string, userId2: string): Promise<Message | undefined>;
  getMessageById(messageId: string): Promise<Message | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    const [smallerId, largerId] = [user1Id, user2Id].sort();
    const conversationId = `${smallerId}-${largerId}`;

    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (existing) {
      return existing;
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({
        id: conversationId,
        user1Id: smallerId,
        user2Id: largerId,
      })
      .returning();

    return newConversation;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDelivered: true })
      .where(eq(messages.id, messageId));
  }

  async getLastMessage(userId1: string, userId2: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return message || undefined;
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    return message || undefined;
  }
}

export const storage = new DatabaseStorage();
