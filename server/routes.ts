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
import multer from "multer";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_development";

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storageMulter = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storageMulter });

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
  const settings = await storage.getAdminSettings();
  
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
      
      // Top Left -> College Logo
      if (settings?.logoPath) {
        try {
          const logoFull = path.join(process.cwd(), settings.logoPath.startsWith('/') ? settings.logoPath.substring(1) : settings.logoPath);
          if (fs.existsSync(logoFull)) {
            doc.image(logoFull, 50, 45, { width: 60 });
          }
        } catch (e) {
          console.error("Failed to add logo to PDF", e);
        }
      }

      // Center Top -> College Name
      const collegeName = settings?.collegeName || "UNIVERSITY NAME";
      doc.fontSize(18).font('Helvetica-Bold').text(collegeName.toUpperCase(), { align: "center" });
      doc.moveDown(0.5);
      
      // Title "No Objection Certificate" centered below it
      doc.fontSize(16).font('Helvetica').text("NO OBJECTION CERTIFICATE", { align: "center" });
      doc.moveDown(0.5);
      
      // Horizontal line below title
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);
      
      // Student Details
      doc.fontSize(12).font('Helvetica-Bold').text("STUDENT DETAILS:");
      doc.font('Helvetica').text(`Name: ${student.name}`);
      doc.text(`Roll Number: ${student.rollNumber}`);
      doc.text(`Department: ${student.department}`);
      doc.text(`Year: ${student.year}`);
      doc.moveDown();
      
      // Paragraph
      doc.fontSize(12).text(`This is to certify that the above-mentioned student is a bonafide student of our university. We have no objection to them undertaking an internship at ${noc.companyName} for a duration of ${noc.duration}.`, { align: 'justify' });
      doc.moveDown();
      
      doc.text(`Reason for NOC: ${noc.reason}`);
      doc.moveDown(4);
      
      // Bottom Left -> Date of Issue
      const issueDate = new Date().toLocaleDateString();
      doc.font('Helvetica-Bold').text(`Date of Issue: ${issueDate}`, 50, doc.y, { align: "left" });
      
      // Bottom Right -> Signature Image
      if (settings?.signaturePath) {
        try {
          const sigFull = path.join(process.cwd(), settings.signaturePath.startsWith('/') ? settings.signaturePath.substring(1) : settings.signaturePath);
          if (fs.existsSync(sigFull)) {
            // Place it towards the bottom right
            doc.image(sigFull, 400, doc.y - 40, { width: 100 });
          }
        } catch (e) {
          console.error("Failed to add signature to PDF", e);
        }
      }

      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica').text(settings?.authorizedName || "Authorized Signatory", 400, doc.y, { align: "center" });
      doc.text(settings?.designation || "Head of Department", 400, doc.y, { align: "center" });
      doc.text("Authorized Signatory", 400, doc.y, { align: "center" });
      
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
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/public/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

  app.get(api.admin.settings.get.path, authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      if (!settings) {
        return res.status(200).json({
          collegeName: "",
          authorizedName: "",
          designation: "",
          logoPath: null,
          signaturePath: null
        });
      }
      res.json(settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.admin.settings.update.path, authenticateToken, authenticateAdmin, upload.fields([
    { name: 'collegeLogo', maxCount: 1 },
    { name: 'signatureImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const { collegeName, authorizedName, designation } = req.body;
      
      const logoPath = files?.['collegeLogo']?.[0]?.filename ? `/uploads/${files['collegeLogo'][0].filename}` : undefined;
      const signaturePath = files?.['signatureImage']?.[0]?.filename ? `/uploads/${files['signatureImage'][0].filename}` : undefined;

      const existing = await storage.getAdminSettings();
      
      const settings = {
        collegeName: collegeName || existing?.collegeName || "",
        authorizedName: authorizedName || existing?.authorizedName || "",
        designation: designation || existing?.designation || "",
        logoPath: logoPath || existing?.logoPath || null,
        signaturePath: signaturePath || existing?.signaturePath || null,
      };
      
      const updated = await storage.upsertAdminSettings(settings);
      res.json(updated);
    } catch (err) {
      console.error("CRITICAL: Error updating settings:", err);
      res.status(500).json({ message: "Internal server error occurred while saving settings" });
    }
  });

  return httpServer;
}
