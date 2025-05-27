import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  healthReports,
  consultations,
  type User,
  type UpsertUser,
  type Product,
  type CartItem,
  type Order,
  type OrderItem,
  type HealthReport,
  type Consultation,
  type InsertProduct,
  type InsertCartItem,
  type InsertOrder,
  type InsertHealthReport,
  type InsertConsultation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Health reports
  getHealthReports(userId: string): Promise<HealthReport[]>;
  createHealthReport(report: InsertHealthReport): Promise<HealthReport>;
  
  // Consultations
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultations(userId: string): Promise<Consultation[]>;
  updateConsultation(id: number, data: Partial<Consultation>): Promise<Consultation>;
  
  // Email/Password Auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // OTP operations
  createOTP(email: string, otp: string): Promise<OtpVerification>;
  getValidOTP(email: string, otp: string): Promise<OtpVerification | undefined>;
  markOTPAsVerified(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId)
        )
      );

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Health reports
  async getHealthReports(userId: string): Promise<HealthReport[]> {
    return await db
      .select()
      .from(healthReports)
      .where(eq(healthReports.userId, userId))
      .orderBy(desc(healthReports.createdAt));
  }

  async createHealthReport(report: InsertHealthReport): Promise<HealthReport> {
    const [newReport] = await db.insert(healthReports).values(report).returning();
    return newReport;
  }

  // Consultations
  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [newConsultation] = await db.insert(consultations).values(consultation).returning();
    return newConsultation;
  }

  async getConsultations(userId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.userId, userId))
      .orderBy(desc(consultations.createdAt));
  }

  async updateConsultation(id: number, data: Partial<Consultation>): Promise<Consultation> {
    const [updatedConsultation] = await db
      .update(consultations)
      .set(data)
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }
}

export const storage = new DatabaseStorage();
