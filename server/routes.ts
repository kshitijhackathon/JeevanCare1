import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./email";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertProductSchema, insertCartItemSchema, insertConsultationSchema } from "@shared/schema";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (!user) {
        // Create new user
        user = await storage.createUserWithPassword({
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          email: profile.emails?.[0]?.value || '',
          password: '', // No password for OAuth users
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Facebook OAuth Strategy  
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (!user) {
        // Create new user
        user = await storage.createUserWithPassword({
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          email: profile.emails?.[0]?.value || '',
          password: '', // No password for OAuth users
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Helper function to generate OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper function to generate JWT token
  const generateToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { 
      expiresIn: '7d' 
    });
  };

  // JWT Authentication middleware
  const authenticateJWT = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      console.log('Verifying token:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      console.log('Decoded token:', decoded);
      
      const user = await storage.getUser(decoded.userId);
      console.log('Found user:', user);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };

  // Google OAuth routes
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/signin' }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const token = generateToken(user.id);
        
        // Redirect to frontend with token
        res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }))}`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/auth/signin?error=oauth_failed');
      }
    }
  );

  // Facebook OAuth routes
  app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  
  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/signin' }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const token = generateToken(user.id);
        
        // Redirect to frontend with token
        res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }))}`);
      } catch (error) {
        console.error('Facebook OAuth callback error:', error);
        res.redirect('/auth/signin?error=oauth_failed');
      }
    }
  );

  // Auth routes
  app.get('/api/auth/user', authenticateJWT, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Authentication Routes
  
  // Sign up with email/password and send OTP
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const signupSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      });

      const { firstName, lastName, email, password } = signupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate and send OTP
      const otp = generateOTP();
      await storage.createOTP(email, otp);
      
      // Send OTP email (will need email service setup)
      const emailSent = await emailService.sendOTP(email, otp);
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      // Store user data temporarily in session or cache
      req.session.pendingUser = { firstName, lastName, email, password };

      res.json({ 
        message: "Verification code sent to your email",
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  // Verify OTP and complete registration
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const verifySchema = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      });

      const { email, otp } = verifySchema.parse(req.body);

      // Verify OTP
      const otpRecord = await storage.getValidOTP(email, otp);
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Get pending user data from session
      const pendingUser = req.session.pendingUser;
      if (!pendingUser || pendingUser.email !== email) {
        return res.status(400).json({ message: "Session expired. Please try signing up again" });
      }

      // Create user account
      const user = await storage.createUserWithPassword(pendingUser);
      
      // Mark OTP as verified
      await storage.markOTPAsVerified(otpRecord.id);

      // Clear pending user data
      delete req.session.pendingUser;

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        message: "Account created successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: "Invalid verification data" });
    }
  });

  // Sign in with email/password
  app.post('/api/auth/signin', async (req, res) => {
    try {
      const signinSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const { email, password } = signinSchema.parse(req.body);

      // Verify user credentials
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(400).json({ message: "Invalid signin data" });
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
