import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { indicTranslationService } from "./indic-translation-service";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./email";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertProductSchema, insertCartItemSchema, insertConsultationSchema } from "@shared/schema";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { medicalAI } from "./medical-ai-engine";
import { enhancedAudioTranscription } from "./simple-audio-transcription";
import { fastResponseEngine } from "./fast-response-engine";
import multer from 'multer';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// In-memory cart for demo purposes
const demoCart = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Browser-based speech recognition endpoint
  app.post('/api/speech-recognition-status', async (req, res) => {
    // Simple endpoint to check if speech recognition is available
    res.json({
      available: true,
      message: 'Using browser-based speech recognition',
      type: 'browser'
    });
  });

  // Fast response engine for medical consultation
  app.post("/api/fast-response", async (req, res) => {
    try {
      const { message, language = 'hin_Deva' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log('=== FAST MEDICAL RESPONSE ===');
      console.log('Message:', message);
      console.log('Language:', language);

      // Generate instant acknowledgment
      const instantAck = fastResponseEngine.getInstantAck(language);
      
      // Generate comprehensive response
      const response = await fastResponseEngine.generateFastResponse(message);
      
      console.log('Response generated:', response.text);
      console.log('Urgency:', response.urgency);
      console.log('Category:', response.category);

      res.json({
        success: true,
        instantAck,
        response: response.text,
        followUp: response.followUpQuestion,
        urgency: response.urgency,
        category: response.category,
        confidence: response.confidence
      });

    } catch (error) {
      console.error('Fast response error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate medical response",
        response: "माफ करें, कुछ तकनीकी समस्या है। कृपया फिर से कोशिश करें।"
      });
    }
  });

  // Enhanced prescription generation
  app.post("/api/generate-prescription", async (req, res) => {
    try {
      const { patientName, age, gender, symptoms, complaint, language } = req.body;
      
      console.log('=== PRESCRIPTION GENERATION ===');
      console.log('Patient:', patientName, age, gender);
      console.log('Symptoms:', symptoms);
      console.log('Complaint:', complaint);

      // Basic prescription generation
      const prescription = {
        patientName: patientName || 'Patient',
        age: age || '25',
        gender: gender || 'M',
        date: new Date().toLocaleDateString('en-IN'),
        complaint: complaint || symptoms,
        medicines: [
          {
            name: 'Paracetamol 500mg',
            dosage: '1 tablet',
            frequency: 'Twice daily',
            duration: '3 days',
            instructions: 'After meals',
            timing: 'Morning and Evening'
          },
          {
            name: 'Rest',
            dosage: 'Adequate',
            frequency: 'As needed',
            duration: '2-3 days',
            instructions: 'Avoid heavy work',
            timing: 'Throughout the day'
          }
        ],
        generalInstructions: [
          'Take medicines as prescribed',
          'Drink plenty of water',
          'Get adequate rest',
          'Consult doctor if symptoms persist'
        ],
        doctorName: 'Dr. AI Assistant',
        clinicName: 'JeevanCare Clinic'
      };

      res.json({
        success: true,
        prescription
      });

    } catch (error) {
      console.error('Prescription generation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate prescription"
      });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
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

  // Basic routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  app.get("/api/cart", (req, res) => {
    res.json([]);
  });

  app.get("/api/health-reports", (req, res) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json([]);
  });

  const httpServer = createServer(app);
  return httpServer;
}