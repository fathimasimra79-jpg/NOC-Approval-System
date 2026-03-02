import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number"),
  department: text("department"),
  year: text("year"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('student'), // 'student' or 'admin'
});

export const nocRequests = pgTable("noc_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  companyName: text("company_name").notNull(),
  duration: text("duration").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default('Pending'), // Pending, Approved, Rejected
  rejectionReason: text("rejection_reason"),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  nocRequests: many(nocRequests),
}));

export const nocRequestsRelations = relations(nocRequests, ({ one }) => ({
  student: one(users, {
    fields: [nocRequests.studentId],
    references: [users.id],
  }),
}));

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  collegeName: text("college_name").notNull(),
  logoPath: text("logo_path"),
  signaturePath: text("signature_path"),
  authorizedName: text("authorized_name").notNull(),
  designation: text("designation").notNull(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true });
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertNocRequestSchema = createInsertSchema(nocRequests).omit({ 
  id: true, 
  studentId: true, 
  status: true, 
  rejectionReason: true, 
  pdfPath: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NocRequest = typeof nocRequests.$inferSelect;
export type InsertNocRequest = z.infer<typeof insertNocRequestSchema>;

// API Request/Response Types
export type AuthResponse = {
  token: string;
  user: Omit<User, "password">;
};

export type NocRequestWithStudent = NocRequest & {
  student?: Omit<User, "password">;
};
