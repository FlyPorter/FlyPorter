import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma.js";
import { env } from "./env.js";
import { generateToken } from "../utils/jwt.util.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.GOOGLE_CALLBACK_URL}/api/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;

        // Check if user exists with google_id
        let user = await prisma.user.findFirst({
          where: { google_id: googleId },
        });

        if (!user) {
          const email = profile.emails?.[0]?.value || "";

          // Check if email is already used by another account
          const existingUserWithEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUserWithEmail) {
            return done(null, false, { message: "EMAIL_EXISTS", email });
          }

          // Create new user without password_hash for OAuth users
          user = await prisma.user.create({
            data: {
              email,
              google_id: googleId,
              role: "customer",
              password_hash: "", // Empty for OAuth users
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;

