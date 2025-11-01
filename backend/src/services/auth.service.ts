import { prisma } from "../config/prisma.js";
import { hashPassword, verifyPassword } from "../utils/hash.util.js";
import { generateToken } from "../utils/jwt.util.js";

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const { email, password } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user - always as customer (admin accounts are pre-configured)
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      role: "customer",
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

  // Check if user has password_hash (not OAuth user)
  if (!user.password_hash) {
    throw new Error("Please login with Google");
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

