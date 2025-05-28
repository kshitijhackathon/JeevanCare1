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

  // Advanced AI Doctor Consultation
  app.post("/api/ai-doctor/start", isAuthenticated, async (req, res) => {
    try {
      const { name, gender, age, bloodGroup, language } = req.body;
      res.json({ 
        success: true, 
        message: "AI Doctor consultation started",
        sessionId: `session_${Date.now()}`
      });
    } catch (error) {
      console.error("AI Doctor start error:", error);
      res.status(500).json({ message: "Failed to start consultation" });
    }
  });

  app.post("/api/ai-doctor/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, language, patientDetails, selectedBodyPart, capturedImage } = req.body;

      let enhancedMessage = message;
      if (selectedBodyPart) {
        enhancedMessage += ` Patient pointed to their ${selectedBodyPart} on the body model.`;
      }
      if (capturedImage) {
        enhancedMessage += ` Patient provided a photo for medical analysis.`;
      }

      const systemPrompt = language === 'hindi' 
        ? `You are a highly professional, emotionally intelligent AI Doctor. Respond in Hinglish (Hindi-English mix). Patient: ${patientDetails.name}, Age: ${patientDetails.age}, Gender: ${patientDetails.gender}, Blood Group: ${patientDetails.bloodGroup}. Provide empathetic medical advice, ask specific follow-up questions about symptoms like timing, severity, and associated symptoms. Be professional like a real doctor consultation.`
        : `You are a highly professional, emotionally intelligent AI Doctor. Patient: ${patientDetails.name}, Age: ${patientDetails.age}, Gender: ${patientDetails.gender}, Blood Group: ${patientDetails.bloodGroup}. Provide empathetic medical advice, ask specific follow-up questions about symptoms like timing, severity, and associated symptoms. Be professional like a real doctor consultation.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: enhancedMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 
        (language === 'hindi' 
          ? "Main samajh sakta hoon aap pareshaan hain. Kripaya apne symptoms detail mein bataiye."
          : "I understand your concern. Please describe your symptoms in detail.");

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("AI Doctor chat error:", error);
      res.status(500).json({ 
        response: language === 'hindi' 
          ? "Maaf kariye, main abhi available nahi hun. Kripaya baad mein try kariye."
          : "I apologize, but I'm currently unavailable. Please try again later."
      });
    }
  });

  // AI Consultation with Perplexity API
  app.post("/api/consultations/ai-chat", isAuthenticated, async (req, res) => {
    try {
      const { action, message, language, patientDetails } = req.body;

      if (action === 'start') {
        res.json({ success: true, message: "Consultation started" });
        return;
      }

      if (action === 'chat') {
        const systemPrompt = language === 'hindi' 
          ? `You are a helpful AI doctor assistant. Respond in Hinglish (Hindi-English mix) as requested. Patient details: Name: ${patientDetails.name}, Age: ${patientDetails.age}, Gender: ${patientDetails.gender}. Provide medical advice, ask relevant questions about symptoms, and be empathetic. Keep responses concise and helpful.`
          : `You are a helpful AI doctor assistant. Patient details: Name: ${patientDetails.name}, Age: ${patientDetails.age}, Gender: ${patientDetails.gender}. Provide medical advice, ask relevant questions about symptoms, and be empathetic. Keep responses concise and helpful.`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.2,
            top_p: 0.9,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not process your message. Please try again.';

        res.json({ response: aiResponse });
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ 
        response: language === 'hindi' 
          ? "Sorry, main abhi available nahi hun. Kripaya baad mein try kariye."
          : "I apologize, but I'm currently unavailable. Please try again later."
      });
    }
  });

  // Medical Records Upload and AI Analysis
  app.get('/api/medical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await storage.getHealthReports(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      res.status(500).json({ message: "Failed to fetch records" });
    }
  });

  app.post('/api/medical-records/upload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Note: In production, you would handle file upload with multer
      // For now, we'll simulate the upload and AI analysis
      
      const mockRecord = {
        fileName: 'blood_test_report.pdf',
        fileType: 'pdf',
        uploadDate: new Date().toISOString(),
        status: 'analyzed',
        aiAnalysis: {
          conditions: ['Vitamin D Deficiency', 'Mild Anemia'],
          medications: ['Vitamin D3 Supplements', 'Iron Tablets'],
          allergies: [],
          recommendations: [
            'Increase sun exposure for natural Vitamin D',
            'Include iron-rich foods in diet',
            'Follow up with doctor in 3 months',
            'Regular exercise recommended'
          ],
          summary: 'Blood test shows mild vitamin D deficiency and slight anemia. Both conditions are treatable with supplements and dietary changes.',
          riskLevel: 'low',
          nextSteps: ['Schedule follow-up appointment', 'Start supplement regimen']
        }
      };

      const healthReport = await storage.createHealthReport({
        userId,
        reportType: 'lab_results',
        reportData: JSON.stringify(mockRecord),
        diagnosis: mockRecord.aiAnalysis.conditions.join(', '),
        recommendations: mockRecord.aiAnalysis.recommendations.join('; ')
      });

      res.json({ success: true, record: mockRecord });
    } catch (error) {
      console.error("Error uploading medical record:", error);
      res.status(500).json({ message: "Failed to upload record" });
    }
  });

  // AI Consultation API
  app.post('/api/ai-consultation', isAuthenticated, async (req: any, res) => {
    try {
      const { message, history, medicalHistory } = req.body;
      const userId = req.user.claims.sub;

      // Build context from medical history
      let contextPrompt = "You are a professional AI health assistant. Provide helpful medical guidance while emphasizing that this doesn't replace professional medical advice.";
      
      if (medicalHistory && medicalHistory.conditions.length > 0) {
        contextPrompt += `\n\nPatient's medical history: ${medicalHistory.conditions.join(', ')}`;
      }
      if (medicalHistory && medicalHistory.medications.length > 0) {
        contextPrompt += `\nCurrent medications: ${medicalHistory.medications.join(', ')}`;
      }
      if (medicalHistory && medicalHistory.allergies.length > 0) {
        contextPrompt += `\nKnown allergies: ${medicalHistory.allergies.join(', ')}`;
      }

      // For demonstration, provide intelligent responses based on symptoms
      let aiResponse = generateIntelligentResponse(message, medicalHistory);
      let diagnosis = null;
      let recommendations = [];

      // Check if this seems like a diagnostic conversation
      if (message.toLowerCase().includes('pain') || message.toLowerCase().includes('symptoms') || 
          message.toLowerCase().includes('fever') || message.toLowerCase().includes('headache')) {
        diagnosis = extractPossibleCondition(message);
        recommendations = generateRecommendations(message);
        
        // Save consultation
        await storage.createConsultation({
          userId,
          symptoms: message,
          diagnosis: diagnosis || '',
          recommendations: recommendations.join('; '),
          status: 'completed'
        });
      }

      res.json({ 
        response: aiResponse, 
        diagnosis,
        recommendations,
        type: diagnosis ? 'analysis' : 'text'
      });
    } catch (error) {
      console.error("AI consultation error:", error);
      res.status(500).json({ message: "AI consultation failed" });
    }
  });

  // Medical History API
  app.get('/api/medical-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Aggregate medical history from various sources
      const consultations = await storage.getConsultations(userId);
      const healthReports = await storage.getHealthReports(userId);
      
      const conditions = [...new Set([
        ...consultations.filter(c => c.diagnosis).map(c => c.diagnosis),
        ...healthReports.filter(r => r.diagnosis).map(r => r.diagnosis)
      ])];

      // Extract medications and other data from reports
      const medications: string[] = [];
      const allergies: string[] = [];
      
      healthReports.forEach(report => {
        try {
          const reportData = JSON.parse(report.reportData || '{}');
          if (reportData.aiAnalysis) {
            medications.push(...(reportData.aiAnalysis.medications || []));
            allergies.push(...(reportData.aiAnalysis.allergies || []));
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      res.json({
        conditions,
        medications: [...new Set(medications)],
        allergies: [...new Set(allergies)],
        recentReports: healthReports.slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching medical history:", error);
      res.status(500).json({ 
        conditions: [], 
        medications: [], 
        allergies: [], 
        recentReports: [] 
      });
    }
  });

  // Enhanced Doctor Search API
  app.post('/api/indian-medical-registry/search', async (req, res) => {
    try {
      const { specialty, condition, location, filters } = req.body;
      
      // Mock comprehensive Indian Medical Registry data
      const indianDoctors = [
        {
          id: 'IMR_DL_001',
          name: 'Dr. Priya Sharma',
          specialty: 'dermatology',
          subSpecialty: 'Cosmetic & Medical Dermatology',
          qualification: 'MBBS, MD (Dermatology), Fellowship in Dermatopathology',
          experience: 12,
          rating: 4.8,
          reviewCount: 247,
          hospitalName: 'Apollo Hospitals Delhi',
          address: 'Mathura Road, Sarita Vihar, New Delhi - 110076',
          distance: 2.3,
          consultationFee: 800,
          languages: ['English', 'Hindi'],
          registrationNumber: 'DL-12345-2010',
          medicalCouncil: 'Delhi Medical Council',
          isRegistrationVerified: true,
          gender: 'female',
          availability: {
            nextSlot: 'Today 3:00 PM',
            slotsAvailable: 4,
            isAvailableToday: true
          }
        },
        {
          id: 'IMR_MH_002',
          name: 'Dr. Rajesh Kumar',
          specialty: 'endocrinology',
          subSpecialty: 'Diabetes & Thyroid Disorders',
          qualification: 'MBBS, MD (Medicine), DM (Endocrinology)',
          experience: 15,
          rating: 4.7,
          reviewCount: 189,
          hospitalName: 'Max Super Speciality Hospital',
          address: 'Press Enclave Road, Saket, New Delhi - 110017',
          distance: 4.1,
          consultationFee: 1200,
          languages: ['English', 'Hindi', 'Bengali'],
          registrationNumber: 'MH-67890-2008',
          medicalCouncil: 'Maharashtra Medical Council',
          isRegistrationVerified: true,
          gender: 'male',
          availability: {
            nextSlot: 'Tomorrow 10:30 AM',
            slotsAvailable: 2,
            isAvailableToday: false
          }
        }
      ];

      // Filter and sort based on specialty and condition
      let filteredDoctors = indianDoctors;
      
      if (specialty && specialty !== 'any') {
        filteredDoctors = filteredDoctors.filter(d => d.specialty === specialty);
      }

      res.json(filteredDoctors);
    } catch (error) {
      console.error("Doctor search error:", error);
      res.status(500).json({ message: "Doctor search failed" });
    }
  });

  // Recent consultations for condition detection
  app.get('/api/consultations/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consultations = await storage.getConsultations(userId);
      res.json(consultations.slice(0, 5)); // Return last 5 consultations
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.json([]); // Return empty array instead of error
    }
  });

  // Face scan results API
  app.get('/api/face-scan/results', async (req, res) => {
    try {
      // Mock face scan results for demo
      const mockResults = [
        {
          id: 1,
          createdAt: new Date().toISOString(),
          conditions: [
            {
              name: 'Mild Acne',
              confidence: 0.85,
              severity: 'low',
              description: 'Detected inflammatory lesions consistent with mild acne'
            },
            {
              name: 'Dark Circles',
              confidence: 0.92,
              severity: 'low',
              description: 'Periorbital darkening possibly indicating fatigue'
            }
          ]
        }
      ];
      res.json(mockResults);
    } catch (error) {
      console.error("Error fetching face scan results:", error);
      res.json([]);
    }
  });

  // Health Assistant Chat with Groq API
  app.post('/api/health-assistant/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      
      // Build context from conversation history
      const conversationContext = history?.slice(-3).map((msg: any) => 
        `${msg.role}: ${msg.content}`
      ).join('\n') || '';

      const systemPrompt = `You are an intelligent healthcare assistant that helps users navigate a comprehensive healthcare platform. Your role is to:

1. **Guide users to appropriate features** based on their needs
2. **Provide helpful health information** while emphasizing professional medical advice
3. **Navigate users through the platform** with specific action suggestions

Available platform features:
- AI Consultation (/ai-consultation): For symptom analysis and health guidance
- Medical Records Upload (/medical-records): For uploading and AI analysis of medical documents
- Doctor Escalation (/doctor-escalation): For finding verified specialists from Indian Medical Registry
- Face Scan (/face-scan): For AI-powered facial health analysis
- Global Health Map (/global-health-map): For worldwide disease tracking and trends
- Emergency Services (ambulance button): For immediate emergency assistance
- Lab Test Booking (/book-test): For scheduling medical tests
- Medicine Delivery: For prescription medication delivery

Response format guidelines:
- Be conversational, helpful, and encouraging
- Suggest specific platform features when relevant
- Provide actionable guidance
- Include relevant actions with routes when appropriate
- Keep medical advice general and emphasize consulting professionals

Previous conversation:
${conversationContext}

Current user message: ${message}

Respond helpfully and suggest relevant platform features.`;

      // Use Perplexity as backup if Groq isn't available
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not process your message. Please try again.';

      // Parse response to extract suggestions and actions
      const suggestions = extractSuggestions(message, aiResponse);
      const actions = extractActions(message, aiResponse);
      const responseType = determineResponseType(message);

      res.json({ 
        response: aiResponse,
        type: responseType,
        suggestions,
        actions
      });
    } catch (error) {
      console.error("Health assistant error:", error);
      
      // Fallback intelligent response
      const fallbackResponse = generateFallbackResponse(req.body.message);
      res.json(fallbackResponse);
    }
  });

  // Global Health Data API
  app.get('/api/global-health-data', async (req, res) => {
    try {
      const { disease } = req.query;
      
      // Comprehensive global health data
      const globalHealthData = [
        {
          id: 'region_001',
          name: 'Delhi NCR',
          country: 'India',
          coordinates: [28.6139, 77.2090],
          totalCases: 45230,
          population: 32900000,
          riskLevel: 'high',
          lastUpdated: new Date().toISOString(),
          diseases: [
            {
              disease: 'Air Pollution Related Respiratory Issues',
              cases: 18500,
              trend: 'up',
              severity: 'high',
              description: 'Increased respiratory problems due to air quality deterioration'
            },
            {
              disease: 'Dengue',
              cases: 12400,
              trend: 'stable',
              severity: 'medium',
              description: 'Seasonal dengue cases within expected range'
            },
            {
              disease: 'Diabetes Type 2',
              cases: 8900,
              trend: 'up',
              severity: 'medium',
              description: 'Rising diabetes cases linked to lifestyle factors'
            },
            {
              disease: 'Hypertension',
              cases: 5430,
              trend: 'stable',
              severity: 'medium',
              description: 'Cardiovascular conditions in urban population'
            }
          ]
        },
        {
          id: 'region_002',
          name: 'Mumbai Metropolitan',
          country: 'India',
          coordinates: [19.0760, 72.8777],
          totalCases: 38700,
          population: 25700000,
          riskLevel: 'medium',
          lastUpdated: new Date().toISOString(),
          diseases: [
            {
              disease: 'Waterborne Diseases',
              cases: 15200,
              trend: 'down',
              severity: 'medium',
              description: 'Monsoon-related waterborne illness decreasing with better sanitation'
            },
            {
              disease: 'COVID-19',
              cases: 9800,
              trend: 'stable',
              severity: 'low',
              description: 'COVID cases stabilized with vaccination coverage'
            },
            {
              disease: 'Malaria',
              cases: 7400,
              trend: 'down',
              severity: 'medium',
              description: 'Vector control measures showing positive results'
            },
            {
              disease: 'Tuberculosis',
              cases: 6300,
              trend: 'down',
              severity: 'medium',
              description: 'TB treatment programs reducing active cases'
            }
          ]
        },
        {
          id: 'region_003',
          name: 'Kerala State',
          country: 'India',
          coordinates: [10.8505, 76.2711],
          totalCases: 22800,
          population: 35400000,
          riskLevel: 'low',
          lastUpdated: new Date().toISOString(),
          diseases: [
            {
              disease: 'Nipah Virus',
              cases: 45,
              trend: 'stable',
              severity: 'high',
              description: 'Controlled outbreak with enhanced surveillance'
            },
            {
              disease: 'Chikungunya',
              cases: 8900,
              trend: 'down',
              severity: 'low',
              description: 'Vector-borne disease reducing due to prevention measures'
            },
            {
              disease: 'Lifestyle Diseases',
              cases: 13855,
              trend: 'up',
              severity: 'medium',
              description: 'Diabetes and cardiovascular diseases rising with affluence'
            }
          ]
        },
        {
          id: 'region_004',
          name: 'West Bengal',
          country: 'India',
          coordinates: [22.9868, 87.8550],
          totalCases: 31200,
          population: 97700000,
          riskLevel: 'medium',
          lastUpdated: new Date().toISOString(),
          diseases: [
            {
              disease: 'Japanese Encephalitis',
              cases: 1200,
              trend: 'stable',
              severity: 'high',
              description: 'Endemic disease with seasonal patterns'
            },
            {
              disease: 'Kala-azar',
              cases: 890,
              trend: 'down',
              severity: 'medium',
              description: 'Visceral leishmaniasis cases reducing with treatment campaigns'
            },
            {
              disease: 'Diarrheal Diseases',
              cases: 15400,
              trend: 'stable',
              severity: 'medium',
              description: 'Water and sanitation related illnesses'
            },
            {
              disease: 'Respiratory Infections',
              cases: 13710,
              trend: 'up',
              severity: 'medium',
              description: 'Seasonal respiratory infections increasing'
            }
          ]
        }
      ];

      // Filter by disease if specified
      let filteredData = globalHealthData;
      if (disease && disease !== 'all') {
        filteredData = globalHealthData.map(region => ({
          ...region,
          diseases: region.diseases.filter(d => 
            d.disease.toLowerCase().includes(disease.toString().toLowerCase())
          ),
          totalCases: region.diseases
            .filter(d => d.disease.toLowerCase().includes(disease.toString().toLowerCase()))
            .reduce((sum, d) => sum + d.cases, 0)
        })).filter(region => region.diseases.length > 0);
      }

      res.json(filteredData);
    } catch (error) {
      console.error("Error fetching global health data:", error);
      res.status(500).json({ message: "Failed to fetch health data" });
    }
  });

  // Health Metrics API
  app.get('/api/health-metrics', async (req, res) => {
    try {
      const healthMetrics = [
        {
          name: 'Heart Rate',
          value: '72',
          unit: 'bpm',
          trend: 'stable',
          status: 'normal',
          history: [
            { date: '2025-05-21', value: 75 },
            { date: '2025-05-22', value: 73 },
            { date: '2025-05-23', value: 71 },
            { date: '2025-05-24', value: 74 },
            { date: '2025-05-25', value: 72 },
            { date: '2025-05-26', value: 70 },
            { date: '2025-05-27', value: 72 }
          ]
        },
        {
          name: 'Blood Pressure',
          value: '120/80',
          unit: 'mmHg',
          trend: 'stable',
          status: 'normal',
          history: [
            { date: '2025-05-21', value: 118 },
            { date: '2025-05-22', value: 120 },
            { date: '2025-05-23', value: 122 },
            { date: '2025-05-24', value: 119 },
            { date: '2025-05-25', value: 121 },
            { date: '2025-05-26', value: 118 },
            { date: '2025-05-27', value: 120 }
          ]
        },
        {
          name: 'Weight',
          value: '65.2',
          unit: 'kg',
          trend: 'down',
          status: 'normal',
          history: [
            { date: '2025-05-21', value: 66.1 },
            { date: '2025-05-22', value: 65.9 },
            { date: '2025-05-23', value: 65.7 },
            { date: '2025-05-24', value: 65.5 },
            { date: '2025-05-25', value: 65.3 },
            { date: '2025-05-26', value: 65.4 },
            { date: '2025-05-27', value: 65.2 }
          ]
        },
        {
          name: 'Temperature',
          value: '98.6',
          unit: '°F',
          trend: 'stable',
          status: 'normal',
          history: [
            { date: '2025-05-21', value: 98.4 },
            { date: '2025-05-22', value: 98.6 },
            { date: '2025-05-23', value: 98.7 },
            { date: '2025-05-24', value: 98.5 },
            { date: '2025-05-25', value: 98.6 },
            { date: '2025-05-26', value: 98.4 },
            { date: '2025-05-27', value: 98.6 }
          ]
        }
      ];

      res.json(healthMetrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  // Notifications API
  app.get('/api/notifications', async (req, res) => {
    try {
      const { filter } = req.query;
      
      const notifications = [
        {
          id: 1,
          type: 'health_alert',
          title: 'Blood Pressure Alert',
          message: 'Your recent blood pressure reading (135/85) is slightly elevated. Consider consulting your doctor.',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          actionUrl: '/reports',
          actionText: 'View Report',
          category: 'Cardiovascular Health'
        },
        {
          id: 2,
          type: 'medication',
          title: 'Medication Reminder',
          message: 'Time to take your daily vitamin D supplement. Maintain your bone health routine.',
          priority: 'low',
          read: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          actionUrl: '/medications',
          actionText: 'Mark Taken',
          category: 'Daily Medications'
        },
        {
          id: 3,
          type: 'appointment',
          title: 'Upcoming Cardiology Appointment',
          message: 'Dr. Rajesh Kumar - Tomorrow at 10:30 AM. Apollo Hospital, Delhi. Please bring your recent ECG reports.',
          priority: 'high',
          read: true,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          actionUrl: '/doctor-escalation',
          actionText: 'View Details',
          category: 'Appointments'
        },
        {
          id: 4,
          type: 'report',
          title: 'Lab Results Available',
          message: 'Your comprehensive metabolic panel results are now available. All values are within normal range.',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          actionUrl: '/reports',
          actionText: 'View Results',
          category: 'Laboratory Reports'
        },
        {
          id: 5,
          type: 'emergency',
          title: 'Health Advisory',
          message: 'Dengue cases rising in Delhi NCR. Take preventive measures: use mosquito repellent, avoid stagnant water.',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          actionUrl: '/global-health-map',
          actionText: 'View Map',
          category: 'Public Health'
        },
        {
          id: 6,
          type: 'health_alert',
          title: 'AI Health Scan Complete',
          message: 'Your face scan analysis detected mild skin irritation. Consider using gentle skincare products.',
          priority: 'low',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          actionUrl: '/face-scan',
          actionText: 'View Analysis',
          category: 'AI Diagnostics'
        },
        {
          id: 7,
          type: 'system',
          title: 'Health Assistant Update',
          message: 'Your AI health assistant has learned new capabilities for better symptom analysis and doctor recommendations.',
          priority: 'low',
          read: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          actionUrl: '/ai-consultation',
          actionText: 'Try Now',
          category: 'System Updates'
        }
      ];

      // Filter notifications if needed
      let filteredNotifications = notifications;
      if (filter && filter !== 'all') {
        filteredNotifications = notifications.filter(notification => notification.type === filter);
      }

      res.json(filteredNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      // In a real app, this would update the database
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch('/api/notifications/mark-all-read', async (req, res) => {
    try {
      // In a real app, this would update all unread notifications for the user
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Intelligent AI response generator
function generateIntelligentResponse(message: string, medicalHistory?: any): string {
  const messageLower = message.toLowerCase();
  
  // Check for specific symptoms and provide contextual responses
  if (messageLower.includes('headache')) {
    return `I understand you're experiencing a headache. This could be due to various factors like stress, dehydration, or lack of sleep. 

**Immediate steps:**
• Drink plenty of water
• Rest in a quiet, dark room
• Apply a cold or warm compress
• Consider over-the-counter pain relief if needed

If headaches persist, are severe, or accompanied by fever, vision changes, or neck stiffness, please seek immediate medical attention.

**Note:** This is informational guidance only and doesn't replace professional medical advice.`;
  }
  
  if (messageLower.includes('fever')) {
    return `Fever can indicate your body is fighting an infection. Here's what I recommend:

**For fever management:**
• Stay hydrated with plenty of fluids
• Rest and avoid strenuous activities
• Use fever-reducing medication as directed
• Monitor your temperature regularly

**Seek immediate medical care if:**
• Temperature exceeds 103°F (39.4°C)
• Fever lasts more than 3 days
• Accompanied by severe symptoms like difficulty breathing

${medicalHistory?.conditions.length ? `Given your medical history of ${medicalHistory.conditions.join(', ')}, please consult your doctor promptly.` : ''}

Would you like specific guidance based on your temperature reading?`;
  }
  
  if (messageLower.includes('stomach') || messageLower.includes('nausea')) {
    return `Stomach issues can be uncomfortable. Here are some general recommendations:

**For stomach upset:**
• Stay hydrated with small, frequent sips of water
• Try the BRAT diet (Bananas, Rice, Applesauce, Toast)
• Avoid dairy, fatty, or spicy foods temporarily
• Rest and avoid unnecessary stress

**Contact a healthcare provider if:**
• Severe or persistent pain
• Blood in vomit or stool
• Signs of dehydration
• Symptoms worsen after 24-48 hours

Can you describe your symptoms in more detail? This will help me provide more specific guidance.`;
  }
  
  // General health inquiry
  if (messageLower.includes('tired') || messageLower.includes('fatigue')) {
    return `Fatigue can have many causes. Let's explore some possibilities:

**Common causes:**
• Insufficient sleep or poor sleep quality
• Stress or anxiety
• Nutritional deficiencies (especially iron or vitamin D)
• Dehydration
• Underlying medical conditions

**To help improve energy:**
• Ensure 7-9 hours of quality sleep
• Maintain regular exercise routine
• Eat balanced, nutritious meals
• Stay hydrated throughout the day
• Manage stress levels

${medicalHistory?.conditions.length ? `I see you have a history of ${medicalHistory.conditions.join(', ')}. Some conditions can contribute to fatigue.` : ''}

If fatigue persists for more than 2 weeks or significantly impacts your daily life, please consult a healthcare professional for proper evaluation.`;
  }
  
  // Default response for general inquiries
  return `Thank you for sharing your health concerns with me. I'm here to provide helpful guidance while emphasizing that this doesn't replace professional medical advice.

${medicalHistory?.conditions.length ? `I note your medical history includes: ${medicalHistory.conditions.join(', ')}. ` : ''}

To better assist you, could you please:
• Describe your specific symptoms
• Mention when they started
• Rate their severity (1-10)
• Note any factors that make them better or worse

This information will help me provide more targeted recommendations. Remember, for serious or persistent symptoms, it's always best to consult with a healthcare professional.

What specific symptoms or health concerns would you like to discuss?`;
}

function extractPossibleCondition(message: string): string | null {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('headache') && messageLower.includes('nausea')) {
    return 'Possible Migraine';
  }
  if (messageLower.includes('fever') && messageLower.includes('cough')) {
    return 'Possible Respiratory Infection';
  }
  if (messageLower.includes('stomach') && messageLower.includes('pain')) {
    return 'Possible Gastric Upset';
  }
  if (messageLower.includes('tired') || messageLower.includes('fatigue')) {
    return 'Possible Fatigue Syndrome';
  }
  if (messageLower.includes('headache')) {
    return 'Possible Tension Headache';
  }
  
  return null;
}

function generateRecommendations(message: string): string[] {
  const messageLower = message.toLowerCase();
  const recommendations: string[] = [];
  
  if (messageLower.includes('headache')) {
    recommendations.push('Stay hydrated and rest in a quiet environment');
    recommendations.push('Consider over-the-counter pain relief if appropriate');
    recommendations.push('Monitor for worsening symptoms or fever');
  }
  
  if (messageLower.includes('fever')) {
    recommendations.push('Monitor temperature regularly');
    recommendations.push('Stay well-hydrated with fluids');
    recommendations.push('Rest and avoid strenuous activities');
    recommendations.push('Seek medical care if fever exceeds 103°F or persists');
  }
  
  if (messageLower.includes('stomach')) {
    recommendations.push('Follow a bland diet (BRAT: Bananas, Rice, Applesauce, Toast)');
    recommendations.push('Stay hydrated with small, frequent sips');
    recommendations.push('Avoid dairy, fatty, or spicy foods temporarily');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Monitor symptoms and track any changes');
    recommendations.push('Maintain proper hydration and rest');
    recommendations.push('Consult healthcare provider if symptoms persist or worsen');
  }
  
  return recommendations;
}

// Helper functions for health assistant
function extractSuggestions(message: string, aiResponse: string): string[] {
  const messageLower = message.toLowerCase();
  const suggestions = [];

  if (messageLower.includes('sick') || messageLower.includes('unwell') || messageLower.includes('symptoms')) {
    suggestions.push("Tell me about your specific symptoms");
    suggestions.push("How long have you been feeling this way?");
    suggestions.push("Have you taken your temperature?");
  }

  if (messageLower.includes('doctor') || messageLower.includes('specialist')) {
    suggestions.push("What type of specialist do you need?");
    suggestions.push("Do you have any medical records to upload?");
    suggestions.push("What's your current location for nearby doctors?");
  }

  if (messageLower.includes('upload') || messageLower.includes('records') || messageLower.includes('report')) {
    suggestions.push("What type of medical document do you have?");
    suggestions.push("Do you need help interpreting your results?");
    suggestions.push("Would you like AI analysis of your reports?");
  }

  if (suggestions.length === 0) {
    suggestions.push("I need help with symptoms");
    suggestions.push("Find doctors near me");
    suggestions.push("Upload medical records");
    suggestions.push("Check global health trends");
  }

  return suggestions.slice(0, 4);
}

function extractActions(message: string, aiResponse: string): { label: string; route: string; icon: string }[] {
  const messageLower = message.toLowerCase();
  const actions = [];

  if (messageLower.includes('symptoms') || messageLower.includes('sick') || messageLower.includes('pain')) {
    actions.push({
      label: "Start AI Health Consultation",
      route: "/ai-consultation",
      icon: "stethoscope"
    });
    actions.push({
      label: "Find Specialist Doctors",
      route: "/doctor-escalation",
      icon: "stethoscope"
    });
  }

  if (messageLower.includes('upload') || messageLower.includes('records') || messageLower.includes('report')) {
    actions.push({
      label: "Upload Medical Records",
      route: "/medical-records",
      icon: "file"
    });
  }

  if (messageLower.includes('doctor') || messageLower.includes('specialist') || messageLower.includes('appointment')) {
    actions.push({
      label: "Find Verified Doctors",
      route: "/doctor-escalation",
      icon: "stethoscope"
    });
  }

  if (messageLower.includes('face') || messageLower.includes('skin') || messageLower.includes('scan')) {
    actions.push({
      label: "AI Face Scan Analysis",
      route: "/face-scan",
      icon: "camera"
    });
  }

  if (messageLower.includes('global') || messageLower.includes('disease') || messageLower.includes('outbreak')) {
    actions.push({
      label: "View Global Health Map",
      route: "/global-health-map",
      icon: "globe"
    });
  }

  if (messageLower.includes('test') || messageLower.includes('lab') || messageLower.includes('blood')) {
    actions.push({
      label: "Book Health Tests",
      route: "/book-test",
      icon: "calendar"
    });
  }

  if (messageLower.includes('emergency') || messageLower.includes('urgent') || messageLower.includes('help')) {
    actions.push({
      label: "Emergency Services",
      route: "/",
      icon: "shield"
    });
  }

  return actions.slice(0, 3);
}

function determineResponseType(message: string): string {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('emergency') || messageLower.includes('urgent')) {
    return 'emergency';
  }
  if (messageLower.includes('navigate') || messageLower.includes('how to') || messageLower.includes('where')) {
    return 'navigation';
  }
  if (messageLower.includes('symptoms') || messageLower.includes('diagnosis')) {
    return 'medical';
  }
  
  return 'general';
}

function generateFallbackResponse(message: string): any {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('symptoms') || messageLower.includes('sick')) {
    return {
      response: `I understand you're not feeling well. Our platform can help you in several ways:

🩺 **AI Health Consultation** - Get immediate symptom analysis and guidance
👨‍⚕️ **Find Verified Doctors** - Connect with specialists from Indian Medical Registry
📋 **Upload Medical Records** - Get AI analysis of your reports and prescriptions

For immediate concerns, please consider consulting a healthcare professional. How would you like me to help you today?`,
      type: 'suggestion',
      suggestions: [
        "Start AI consultation for my symptoms",
        "Find doctors near me",
        "Upload my medical reports",
        "I need emergency assistance"
      ],
      actions: [
        { label: "AI Health Consultation", route: "/ai-consultation", icon: "stethoscope" },
        { label: "Find Doctors", route: "/doctor-escalation", icon: "stethoscope" },
        { label: "Upload Records", route: "/medical-records", icon: "file" }
      ]
    };
  }

  if (messageLower.includes('doctor') || messageLower.includes('specialist')) {
    return {
      response: `I can help you find the right healthcare professionals! Our platform connects you with verified doctors from the Indian Medical Registry.

🔍 **Smart Doctor Matching** - AI matches you with specialists based on your conditions
📍 **Location-Based Search** - Find doctors near your location
✅ **Verified Credentials** - All doctors are verified with medical council registration

What type of specialist are you looking for, or would you like me to analyze your symptoms first to recommend the right specialty?`,
      type: 'navigation',
      suggestions: [
        "I need a cardiologist",
        "Help me choose the right specialist",
        "Find doctors near my location",
        "Analyze my symptoms first"
      ],
      actions: [
        { label: "Find Specialists", route: "/doctor-escalation", icon: "stethoscope" },
        { label: "AI Symptom Analysis", route: "/ai-consultation", icon: "stethoscope" }
      ]
    };
  }

  // Default response
  return {
    response: `Hello! I'm your intelligent healthcare assistant. I can guide you through our comprehensive health platform and help you access the right services.

🏥 **What I can help you with:**
• Symptom analysis and health consultations
• Finding verified doctors and specialists
• Medical record management and AI analysis
• Global health information and trends
• Emergency services and urgent care guidance

What would you like to do today?`,
    type: 'suggestion',
    suggestions: [
      "I have health symptoms to discuss",
      "I need to find a doctor",
      "Upload my medical records",
      "Check global health trends"
    ],
    actions: [
      { label: "Health Consultation", route: "/ai-consultation", icon: "stethoscope" },
      { label: "Find Doctors", route: "/doctor-escalation", icon: "stethoscope" },
      { label: "Medical Records", route: "/medical-records", icon: "file" },
      { label: "Global Health Map", route: "/global-health-map", icon: "globe" }
    ]
  };
}

// Simple AI response generator (legacy function for compatibility)
function generateAIResponse(symptoms: string): string {
  return generateIntelligentResponse(symptoms);
}
