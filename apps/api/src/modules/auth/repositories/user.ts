import { db } from '../../../database/index.js';
import { User, OrganizationMember } from '@prisma/client';

export type UserWithMemberships = User & {
  memberships: OrganizationMember[];
};

export class UserRepository {
  /**
   * Finds a user record by email including memberships.
   */
  public static async findByEmail(
    email: string,
  ): Promise<UserWithMemberships | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return db.user.findUnique({
      where: { email: normalizedEmail },
      include: { memberships: true },
    }) as Promise<UserWithMemberships | null>;
  }

  /**
   * Finds a user by ID.
   */
  public static async findById(
    id: string,
  ): Promise<UserWithMemberships | null> {
    return db.user.findUnique({
      where: { id },
      include: { memberships: true },
    }) as Promise<UserWithMemberships | null>;
  }

  /**
   * Creates a new user record.
   */
  public static async create(data: {
    email: string;
    name?: string;
    passwordHash: string;
  }): Promise<UserWithMemberships> {
    const normalizedEmail = data.email.toLowerCase().trim();

    return db.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          ...(data.name !== undefined ? { name: data.name } : {}),
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: { memberships: true },
      }) as Promise<UserWithMemberships>;
    }) as Promise<UserWithMemberships>;
  }
}
