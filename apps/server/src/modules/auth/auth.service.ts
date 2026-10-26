import { prisma } from "../../config/prisma.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
  SanitizedUser,
  RequestMetadata,
} from "./auth.types.js";
import argon2 from "argon2";
import { ApiError } from "../../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.js";
import { Role, AccountStatus } from "@prisma/client";

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const generateSession = async (
  userId: string,
  role: Role,
  metadata?: RequestMetadata
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken({ sub: userId });
  const expirationDate = new Date(Date.now() + jwtConfig.refreshExpiresInMs);

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  const storedToken = await prisma.refreshToken.upsert({
    where: { userId },
    update: {
      token: refreshToken,
      isRevoked: false,
      expiresAt: expirationDate,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
    create: {
      userId,
      token: refreshToken,
      expiresAt: expirationDate,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  if (!storedToken) {
    throw new ApiError(500, "Token storage failed");
  }

  return { accessToken, refreshToken };
};

export const registerService = async (
  data: RegisterInput,
  metadata?: RequestMetadata
): Promise<{ user: SanitizedUser; tokens: AuthTokens }> => {
  if (!data.username || !data.email || !data.password) {
    throw new ApiError(400, "Missing required fields");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  });

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new ApiError(409, "User with this email already exists");
    }
    throw new ApiError(409, "User with this username already exists");
  }

  const passwordHash = await argon2.hash(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: data.username,
        email: data.email,
        avatarUrl: data.avatarUrl || null,
      },
    });

    const newPassword = await tx.passwordCredential.create({
      data: {
        userId: newUser.id,
        passwordHash,
      },
    });

    if (!newUser || !newPassword) {
      throw new ApiError(500, "Account creation failed");
    }

    return newUser;
  });

  const tokens = await generateSession(user.id, user.role, metadata);

  const sanitizedUser: SanitizedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    eloRating: user.eloRating,
  };

  return { user: sanitizedUser, tokens };
};

export const loginService = async (
  data: LoginInput,
  metadata?: RequestMetadata
): Promise<{ user: SanitizedUser; tokens: AuthTokens }> => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.identifier }, { email: data.identifier }],
    },
    include: {
      passwordCredential: true,
    },
  });

  if (!user || !user.passwordCredential) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.status !== AccountStatus.ACTIVE) {
    throw new ApiError(403, `Account is ${user.status.toLowerCase()}`);
  }

  const isPasswordValid = await argon2.verify(
    user.passwordCredential.passwordHash,
    data.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const tokens = await generateSession(user.id, user.role, metadata);

  const sanitizedUser: SanitizedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    eloRating: user.eloRating,
  };

  return { user: sanitizedUser, tokens };
};

export const refreshSessionService = async (
  incomingRefreshToken: string,
  metadata?: RequestMetadata
): Promise<AuthTokens> => {
  let decoded: RefreshTokenPayload;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      jwtConfig.refreshSecret
    ) as RefreshTokenPayload;
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const userId = decoded.sub;

  const storedToken = await prisma.refreshToken.findUnique({
    where: { userId },
    include: { user: true },
  });

  // Token reuse or tampering detection
  if (
    !storedToken ||
    storedToken.token !== incomingRefreshToken ||
    storedToken.isRevoked
  ) {
    if (storedToken) {
      await prisma.refreshToken.update({
        where: { userId },
        data: { isRevoked: true },
      });
    }
    throw new ApiError(
      401,
      "Token reuse detected or token revoked. Please login again."
    );
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { userId } });
    throw new ApiError(401, "Refresh token expired. Please login again.");
  }

  if (storedToken.user.status !== AccountStatus.ACTIVE) {
    throw new ApiError(403, `Account is ${storedToken.user.status.toLowerCase()}`);
  }

  // Rotate tokens
  return generateSession(storedToken.userId, storedToken.user.role, metadata);
};

export const logoutService = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
