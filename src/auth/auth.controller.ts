import { Controller, Post, Body, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }, @Res() res: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.authService.login(user);
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });

    return res.json({ accessToken });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    try {
      const payload = await this.authService.verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(payload.sub, refreshToken);

      res.cookie('refresh_token', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.json({ accessToken });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any; 
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.authService.logout(user.sub);
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }
}
