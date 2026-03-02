import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import express from "express";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_development";

// Middleware to verify JWT
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    (req as any).user = user;
    next();
  });
}

// Middleware to verify Admin role
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Requires admin privileges" });
  }
  next();
}

async function generateNOCPdf(noc: any, student: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const dirPath = path.join(process.cwd(), "public", "pdfs");
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const fileName = `NOC_${noc.id}_${student.rollNumber}.pdf`;
      const filePath = path.join(dirPath, fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Basic PDF Layout for NOC
      doc.fontSize(20).text("UNIVERSITY NAME", { align: "center", underline: true });
      doc.moveDown();
      
      doc.fontSize(16).text("NO OBJECTION CERTIFICATE", { align: "center" });
      doc.moveDown(2);
      
      const issueDate = new Date().toLocaleDateString();
      doc.fontSize(12).text(`Date: ${issueDate}`, { align: "right" });
      doc.moveDown(2);
      
      doc.fontSize(12).text(`This is to certify that ${student.name}, Roll Number ${student.rollNumber}, is a bonafide student of the ${student.department} department, year ${student.year}, at our university.`);
      doc.moveDown();
      
      doc.text(`We have no objection to them undertaking an internship at ${noc.companyName} for a duration of ${noc.duration}.`);
      doc.moveDown();
      
      doc.text(`Reason for NOC: ${noc.reason}`);
      doc.moveDown(4);
      
      doc.text("Authorized Signature", { align: "right" });
      doc.text("Head of Department", { align: "right" });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve(`/pdfs/${fileName}`);
      });
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Seed the database with default admin
async function seedDatabase() {
  try {
    let admin = await storage.getUserByEmail("admin@college.com");
    if (!admin) {
      const hashedAdminPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        name: "Admin",
        email: "admin@college.com",
        password: hashedAdminPassword,
        role: "admin",
        rollNumber: null,
        department: null,
        year: null,
      });
      console.log("Admin seeded.");
    }
  } catch(e) {
    console.error("Failed to seed db", e);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Call seed at startup
  seedDatabase();

  // Serve static PDF files
  app.use('/pdfs', express.static(path.join(process.cwd(), 'public', 'pdfs')));

  // --- Auth Routes ---
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use", field: "email" });
      }
      
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const userToCreate = { ...input, password: hashedPassword };
      
      const user = await storage.createUser(userToCreate);
      
      const { password, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'student') {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, user: userWithoutPassword });
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.post(api.auth.adminLogin.path, async (req, res) => {
    try {
      const { email, password } = api.auth.adminLogin.input.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, user: userWithoutPassword });
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // --- Student Routes ---
  app.post(api.noc.apply.path, authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'student') {
         return res.status(403).json({ message: "Only students can apply" });
      }

      const input = api.noc.apply.input.parse(req.body);
      const noc = await storage.createNocRequest({ ...input, studentId: user.id });
      
      res.status(201).json(noc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.noc.myRequests.path, authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const requests = await storage.getNocRequestsByStudent(user.id);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin Routes ---
  app.get(api.admin.requests.path, authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllNocRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.admin.approve.path, authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const noc = await storage.getNocRequest(id);
      
      if (!noc) {
        return res.status(404).json({ message: "NOC request not found" });
      }

      const student = await storage.getUser(noc.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Generate PDF
      const pdfPath = await generateNOCPdf(noc, student);
      
      const updatedNoc = await storage.updateNocRequestStatus(id, "Approved", undefined, pdfPath);
      res.json(updatedNoc);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.admin.reject.path, authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.admin.reject.input.parse(req.body);
      
      const noc = await storage.getNocRequest(id);
      if (!noc) {
        return res.status(404).json({ message: "NOC request not found" });
      }
      
      const updatedNoc = await storage.updateNocRequestStatus(id, "Rejected", input.rejectionReason);
      res.json(updatedNoc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
