import { prisma } from "../config/prisma.js";
import { hashPassword, verifyPassword } from "../utils/hash.util.js";
import { generateToken } from "../utils/jwt.util.js";
import { UserRole } from "@prisma/client";

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const { email, password, role } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      role,
    },
    select: {
      user_id: true,
      email: true,
      role: true,
      created_at: true,
    },
  });

  // Generate token
  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
  };
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  // Generate token
  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

