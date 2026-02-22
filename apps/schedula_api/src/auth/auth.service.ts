import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { generateOtp } from './services/otp.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from "bcrypt";
import { addDays } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService
  ) { }

  async googleLogin(profile: any, role: 'PATIENT' | 'DOCTOR') {

    const generatedOtp = await generateOtp();

    const user = await this.prisma.user.upsert({
      where: { email: profile.email },
      update: {
        otpHash: generatedOtp.otpHash,
        otpExpiry: generatedOtp.otpExpiry,
      },
      create: {
        email: profile.email,
        name: profile.name,
        role,
        otpHash: generatedOtp.otpHash,
        otpExpiry: generatedOtp.otpExpiry,
      },
    });

    await this.mail.sendOtpEmail(user.email, generatedOtp.otp);

    const token = this.jwt.sign({
      sub: user.id,
      role: user.role,
      email: user.email,
      tokenType: 'temp',
    },
      { 
        secret: `${process.env.JWT_ACCESS_SECRET}`,
        expiresIn: '10m' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      }
    };
  }

  async verifyOtp(userId: string, otp: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.otpHash || !user.otpExpiry) {
    throw new BadRequestException('OTP not set');
  }

  if (user.otpExpiry < new Date()) {
    throw new BadRequestException('OTP expired');
  }

  const valid = await bcrypt.compare(otp, user.otpHash);

  if (!valid) {
    throw new UnauthorizedException('Invalid OTP');
  }

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otpHash: null,
      otpExpiry: null,
    },
  });

  const accessToken = this.jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      isVerified: true,
      tokenType: 'access',
    },
    { 
      secret: `${process.env.JWT_ACCESS_SECRET}`,
      expiresIn: '30m' },
  );

  const refreshToken = this.jwt.sign(
    {
      sub: user.id,
      tokenType: 'refresh',
    },
    { 
      secret: `${process.env.JWT_REFRESH_SECRET}`,
      expiresIn: '30d' },
  );

  const hashedRefreshToken  = await bcrypt.hash(refreshToken, 10)

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash:hashedRefreshToken,
      refreshExpiresAt: addDays(new Date(), 30),
    }
  })


  return {
    accessToken,
    refreshToken
  };
}

async refreshToken(token: string) {
  let payload: any;

  try {
  payload = this.jwt.verify(token,{
    secret: `${process.env.JWT_REFRESH_TOKEN}`
  })
} catch (err) {
  throw new UnauthorizedException('Invalid refresh token');
}

  if(payload.tokenType != 'refresh') {
    throw new UnauthorizedException('Wrong token type');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.refreshTokenHash || !user.refreshExpiresAt) {
    throw new UnauthorizedException('Refresh not allowed');
  }

  if(user.refreshExpiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token expired');
  }
  
  const match = await bcrypt.compare(
    token,
    user.refreshTokenHash
  )

  if(!match) {
    throw new UnauthorizedException('Refresh token mismatch');
  }

   const newAccessToken = this.jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
      tokenType: 'access',
    },
    {
      secret: `${process.env.JWT_ACCESS_SECRET}`,
      expiresIn: '30m',
    },
  );

  return newAccessToken;
}
}