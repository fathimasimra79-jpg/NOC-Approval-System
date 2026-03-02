import { db } from "./db";
import { users, nocRequests, adminSettings, type User, type InsertUser, type NocRequest, type InsertNocRequest, type NocRequestWithStudent, type AdminSettings, type InsertAdminSettings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // NOC Requests operations
  createNocRequest(request: InsertNocRequest & { studentId: number }): Promise<NocRequest>;
  getNocRequestsByStudent(studentId: number): Promise<NocRequest[]>;
  getAllNocRequests(): Promise<NocRequestWithStudent[]>;
  getNocRequest(id: number): Promise<NocRequest | undefined>;
  updateNocRequestStatus(id: number, status: string, rejectionReason?: string, pdfPath?: string): Promise<NocRequest>;

  // Admin Settings operations
  getAdminSettings(): Promise<AdminSettings | undefined>;
  upsertAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createNocRequest(request: InsertNocRequest & { studentId: number }): Promise<NocRequest> {
    const [noc] = await db.insert(nocRequests).values(request).returning();
    return noc;
  }

  async getNocRequestsByStudent(studentId: number): Promise<NocRequest[]> {
    return await db.select().from(nocRequests).where(eq(nocRequests.studentId, studentId)).orderBy(desc(nocRequests.createdAt));
  }

  async getAllNocRequests(): Promise<NocRequestWithStudent[]> {
    // Left join with users to get student details
    const rows = await db
      .select({
        nocRequest: nocRequests,
        student: users,
      })
      .from(nocRequests)
      .leftJoin(users, eq(nocRequests.studentId, users.id))
      .orderBy(desc(nocRequests.createdAt));
      
    return rows.map(row => ({
      ...row.nocRequest,
      student: row.student ? {
        id: row.student.id,
        name: row.student.name,
        rollNumber: row.student.rollNumber,
        department: row.student.department,
        year: row.student.year,
        email: row.student.email,
        role: row.student.role
      } : undefined
    }));
  }

  async getNocRequest(id: number): Promise<NocRequest | undefined> {
    const [noc] = await db.select().from(nocRequests).where(eq(nocRequests.id, id));
    return noc;
  }

  async updateNocRequestStatus(id: number, status: string, rejectionReason?: string, pdfPath?: string): Promise<NocRequest> {
    const updateData: Partial<typeof nocRequests.$inferInsert> = { status };
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (pdfPath !== undefined) updateData.pdfPath = pdfPath;

    const [updated] = await db.update(nocRequests)
      .set(updateData)
      .where(eq(nocRequests.id, id))
      .returning();
    return updated;
  }

  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings).limit(1);
    return settings;
  }

  async upsertAdminSettings(insertSettings: InsertAdminSettings): Promise<AdminSettings> {
    const [existing] = await db.select().from(adminSettings).limit(1);
    if (existing) {
      const [updated] = await db.update(adminSettings)
        .set(insertSettings)
        .where(eq(adminSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings).values(insertSettings).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
