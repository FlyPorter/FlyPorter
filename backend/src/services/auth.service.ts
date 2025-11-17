import { prisma } from "../config/prisma.js";
import { hashPassword, verifyPassword } from "../utils/hash.util.js";
import { generateToken } from "../utils/jwt.util.js";

export interface RegisterInput {
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const DEFAULT_DOB_PLACEHOLDER = new Date("1900-01-01T00:00:00.000Z");

export async function registerUser(input: RegisterInput) {
  const { email, password, phone, full_name } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const password_hash = await hashPassword(password);

  const derivedFullName =
    full_name?.trim() ||
    email.split("@")[0]?.replace(/\./g, " ") ||
    "New Customer";

  // Create user and prefill customer info in a single transaction
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        password_hash,
        role: "customer",
        phone: phone ?? null,
      },
      select: {
        user_id: true,
        email: true,
        role: true,
        phone: true,
        created_at: true,
      },
    });

    await tx.customerInfo.create({
      data: {
        user_id: createdUser.user_id,
        full_name: derivedFullName,
        phone: phone ?? null,
        passport_number: null,
        date_of_birth: DEFAULT_DOB_PLACEHOLDER,
      },
    });

    return createdUser;
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
      phone: user.phone,
    },
    token,
  };
}
