import {
  Controller,
  Get,
  Req,
  UseGuards,
  BadRequestException,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google.guard';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwt: JwtService
  ) { }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req) {
    const role = req.query.state as 'PATIENT' | 'DOCTOR';

    if (!role) {
      throw new BadRequestException('role missing');
    }

    return this.authService.googleLogin(req.user, role);
  }

  @Post('verify-otp')
  async verifyOtp(@Req() req, @Body('token') token: string, @Body('otp') otp: string, @Res({ passthrough: true }) res: Response) {
    if (!otp || !token) {
      throw new BadRequestException('Token and OTP required');
    }

    const payload = this.jwt.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const { accessToken, refreshToken } = await this.authService.verifyOtp(payload.sub, otp);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    return { accessToken };
  }

  @Post('refresh')
  async refreshAccessToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshToken(token);
  }
}
