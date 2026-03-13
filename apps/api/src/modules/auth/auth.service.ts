import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name || dto.email.split('@')[0],
      },
    });

    // Auto-create a default workspace
    const slug = `ws-${user.id.slice(0, 8)}`;
    await this.prisma.workspace.create({
      data: {
        name: `${user.name || 'My'}'s Workspace`,
        slug,
        ownerId: user.id,
        members: { create: { userId: user.id, role: 'admin' } },
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();

    const workspaces = await this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      select: { id: true, name: true, slug: true, plan: true },
    });

    return { ...user, workspaces };
  }

  async googleLogin(profile: { email: string; name: string; googleId: string; picture: string }) {
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        // Link Google account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId, avatarUrl: profile.picture, emailVerified: true },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: profile.googleId,
            avatarUrl: profile.picture,
            emailVerified: true,
          },
        });
        const slug = `ws-${user.id.slice(0, 8)}`;
        await this.prisma.workspace.create({
          data: {
            name: `${user.name}'s Workspace`,
            slug,
            ownerId: user.id,
            members: { create: { userId: user.id, role: 'admin' } },
          },
        });
      }
    }

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken = uuidv4();
    const resetTokenExp = new Date(Date.now() + 3600000); // 1hr

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // TODO: Send email via Resend/SendGrid
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    });

    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshTokenStr = uuidv4();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
      },
    });

    return { accessToken, refreshToken: refreshTokenStr, expiresIn: 900 };
  }

  async refreshToken(token: string) {
    const record = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate token
    await this.prisma.refreshToken.delete({ where: { id: record.id } });

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email);
  }
}
