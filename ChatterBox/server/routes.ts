import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { generateToken, verifyToken, authMiddleware, type AuthRequest } from "./middleware/auth";
import { loginSchema, registerSchema, insertMessageSchema } from "@shared/schema";

interface AuthSocket {
  userId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    path: "/socket.io/",
  });

  const userSockets = new Map<string, string>();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    (socket as any).userId = payload.id;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    userSockets.set(userId, socket.id);

    io.emit('user:online', { userId });

    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit('users:online', { userIds: onlineUserIds });

    socket.on('message:send', async (data) => {
      try {
        const recipientSocketId = userSockets.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:new', { message: data.message });
          
          await storage.markMessageAsDelivered(data.message.id);
          socket.emit('message:delivered', {
            messageId: data.message.id,
            conversationId: data.message.conversationId,
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('typing:start', (data) => {
      const recipientSocketId = userSockets.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const recipientSocketId = userSockets.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on('message:read', async (data) => {
      try {
        await storage.markMessageAsRead(data.messageId);
        
        const message = await storage.getMessageById(data.messageId);
        if (message) {
          const senderSocketId = userSockets.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message:read', {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', () => {
      userSockets.delete(userId);
      io.emit('user:offline', { userId });
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  app.get('/api/users', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const currentUserId = req.user!.id;

      const usersWithStatus = await Promise.all(
        allUsers.map(async (user) => {
          const lastMessage = await storage.getLastMessage(currentUserId, user.id);
          const { password: _, ...userWithoutPassword } = user;
          
          return {
            ...userWithoutPassword,
            isOnline: userSockets.has(user.id),
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            } : undefined,
          };
        })
      );

      res.json(usersWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  app.get('/api/conversations/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversationId = req.params.id;
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.id;
      const { receiverId, content } = req.body;

      const conversation = await storage.getOrCreateConversation(currentUserId, receiverId);

      const messageData = insertMessageSchema.parse({
        conversationId: conversation.id,
        senderId: currentUserId,
        receiverId,
        content,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to send message' });
    }
  });

  return httpServer;
}
