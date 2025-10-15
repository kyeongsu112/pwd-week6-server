const passport = require('passport');
const authService = require('../services/users.service');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  /**
   * 회원가입
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    console.log('회원가입 요청:', { email, password, name });

    // 유효성 검사
    if (!email || !password || !name) {
      console.log('회원가입 유효성 검사 실패: 이메일, 비밀번호, 이름 필수');
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수입니다.',
      });
    }

    if (password.length < 6) {
      console.log('비밀번호 길이 부족');
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
    }

    console.log('회원가입 요청 처리 중...');
    const user = await authService.register({ email, password, name });

    // 회원가입 후 자동 로그인
    req.login(user, (err) => {
      if (err) {
        console.log('회원가입 후 로그인 중 오류 발생');
        return res.status(500).json({
          success: false,
          message: '회원가입 후 로그인 중 오류가 발생했습니다.',
        });
      }

      console.log('회원가입 완료', user);
      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: { user },
      });
    });
  });

  /**
   * 로컬 로그인
   * POST /api/auth/login
   */
  login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('[Login Error]', err);
        return res.status(500).json({
          success: false,
          message: '로그인 중 오류가 발생했습니다.',
        });
      }

      if (!user) {
        console.warn('[Login Failed] No user:', info);
        return res.status(401).json({
          success: false,
          message: info.message || '로그인에 실패했습니다.',
        });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('[Login Error] Failed to log in:', err);
          return res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.',
          });
        }

        return res.json({
          success: true,
          message: '로그인되었습니다.',
          data: { user },
        });
      });
    })(req, res, next);
  };

  /**
   * 로그아웃
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '로그아웃 중 오류가 발생했습니다.',
        });
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '세션 삭제 중 오류가 발생했습니다.',
          });
        }

        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: '로그아웃되었습니다.',
        });
      });
    });
  });

  /**
   * 현재 사용자 정보 조회
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.',
      });
    }

    const user = await authService.getCurrentUser(req.user._id);

    res.json({
      success: true,
      data: { user },
    });
  });

  /**
   * 구글 OAuth 콜백
   * GET /api/auth/google/callback
   */
  googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      const base = process.env.CLIENT_URL || 'http://localhost:3000';  // 기본값을 로컬로 설정
      if (err) {
        console.error('[Google Callback] Authentication error:', err);
        return res.redirect(`${base}/login?error=server_error`);
      }

      if (!user) {
        console.error('[Google Callback] No user found:', info);
        return res.redirect(`${base}/login?error=${encodeURIComponent(info.message || '로그인 실패')}`);
      }

      req.login(user, (err) => {
        if (err) {
          console.error('[Google Callback] Login error:', err);
          return res.redirect(`${base}/login?error=login_error`);
        }

        console.log('[Google Callback] Successfully logged in user:', user._id);
        return res.redirect(`${base}/dashboard`);
      });
    })(req, res, next);
  };

  /**
   * 네이버 OAuth 콜백
   * GET /api/auth/naver/callback
   */
  naverCallback = (req, res, next) => {
    passport.authenticate('naver', (err, user, info) => {
      const base = process.env.CLIENT_URL || 'http://localhost:3000';  // 기본값을 로컬로 설정
      if (err) {
        console.error('[Naver Callback] Authentication error:', err);
        return res.redirect(`${base}/login?error=server_error`);
      }

      if (!user) {
        console.error('[Naver Callback] No user found:', info);
        return res.redirect(`${base}/login?error=${encodeURIComponent(info.message || '로그인 실패')}`);
      }

      req.login(user, (err) => {
        if (err) {
          console.error('[Naver Callback] Login error:', err);
          return res.redirect(`${base}/login?error=login_error`);
        }

        console.log('[Naver Callback] Successfully logged in user:', user._id);
        return res.redirect(`${base}/dashboard`);
      });
    })(req, res, next);
  };
}

module.exports = new AuthController();
