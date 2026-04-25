import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from './auth.validation';

export class AuthService {
  // Register new user
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        department: data.department,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    return { user, token };
  }

  // Login user
  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw createError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (user.status === 'INACTIVE') {
      throw createError.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw createError.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    // Return user data (exclude password)
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  // Get current user
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError.notFound('User not found');
    }

    return user;
  }

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Change password
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError.notFound('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

    if (!isValidPassword) {
      throw createError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // Forgot password (generate reset token)
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    // For now, return the token
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return {
      message: 'If your email is registered, you will receive a password reset link',
      resetToken, // Remove this in production
    };
  }

  // Reset password
  async resetPassword(data: ResetPasswordInput) {
    try {
      // Verify reset token
      const decoded = jwt.verify(
        data.token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; email: string };

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError.badRequest('Reset token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError.badRequest('Invalid reset token');
      }
      throw error;
    }
  }

  // Helper: Generate JWT token
  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Verify JWT token
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; email: string; role: string };

      const user = await this.getCurrentUser(decoded.userId);
      return { user, valid: true };
    } catch (error) {
      return { user: null, valid: false };
    }
  }
}
