import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertCartItemSchema, insertConsultationSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { age, weight, gender, bloodGroup } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        age,
        weight,
        gender,
        bloodGroup,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Initialize sample products if none exist
  app.post('/api/admin/init-products', async (req, res) => {
    try {
      const existingProducts = await storage.getProducts();
      if (existingProducts.length > 0) {
        return res.json({ message: "Products already initialized" });
      }

      const sampleProducts = [
        {
          name: "Panadol",
          description: "Pain relief and fever reducer tablets",
          price: "15.00",
          imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
          category: "pain-relief",
          rating: "4.0",
          isOnSale: false,
        },
        {
          name: "Bodrex",
          description: "Herbal medicine for headaches and fever",
          price: "7.90",
          imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
          category: "herbal",
          rating: "5.0",
          isOnSale: false,
        },
        {
          name: "Konidin",
          description: "Cough medicine for dry and wet cough",
          price: "6.90",
          imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
          category: "cough",
          rating: "4.2",
          isOnSale: false,
        },
        {
          name: "OBH Combi",
          description: "Cough medicine containing Paracetamol, Ephedrine HCl, and Chlorpheniramine maleate",
          price: "9.99",
          imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
          category: "cough",
          rating: "4.0",
          isOnSale: true,
        },
        {
          name: "Betadine",
          description: "Antiseptic solution for wound care",
          price: "6.90",
          imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
          category: "antiseptic",
          rating: "5.0",
          isOnSale: true,
        },
      ];

      for (const product of sampleProducts) {
        await storage.createProduct(product);
      }

      res.json({ message: "Sample products initialized successfully" });
    } catch (error) {
      console.error("Error initializing products:", error);
      res.status(500).json({ message: "Failed to initialize products" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      const updatedItem = await storage.updateCartItemQuantity(itemId, quantity);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.removeFromCart(itemId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Health reports routes
  app.get('/api/health-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getHealthReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching health reports:", error);
      res.status(500).json({ message: "Failed to fetch health reports" });
    }
  });

  // Consultation routes
  app.post('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consultationData = insertConsultationSchema.parse({
        ...req.body,
        userId,
      });
      
      // Simulate AI response based on symptoms
      const aiResponse = generateAIResponse(consultationData.symptoms || "");
      consultationData.aiResponse = aiResponse;
      
      const consultation = await storage.createConsultation(consultationData);
      res.json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  app.get('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consultations = await storage.getConsultations(userId);
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  // Stripe payment route
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simple AI response generator
function generateAIResponse(symptoms: string): string {
  const responses = [
    "Based on your symptoms, it sounds like you might have a common cold. I recommend rest, staying hydrated, and over-the-counter medication. If symptoms persist for more than 3 days, please consult a healthcare professional.",
    "Your symptoms suggest a possible viral infection. Please get adequate rest, drink plenty of fluids, and consider taking fever reducers if needed. Monitor your condition and seek medical attention if symptoms worsen.",
    "These symptoms could indicate several conditions. I recommend monitoring your temperature, staying hydrated, and avoiding contact with others to prevent spread. If symptoms persist or worsen, please consult with a doctor.",
    "Based on what you've described, this appears to be a minor ailment. Rest and basic care should help. However, if you experience severe symptoms or they don't improve in a few days, please see a healthcare provider.",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
