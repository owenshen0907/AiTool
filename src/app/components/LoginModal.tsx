'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { useUser } from '@/app/providers/UserProvider';
import {
    buildLoginModalClosePath,
    getCurrentRouteForLogin,
    isLoginModalOpen,
    readLoginModalNext,
} from '@/lib/auth/loginModal';

type Mode = 'login' | 'register';

interface AuthResponse {
    ok?: boolean;
    msg?: string;
    redirectTo?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginModal() {
    const pathname = usePathname() || '/';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    const modalOpen = isLoginModalOpen(search);
    const fallbackNext = getCurrentRouteForLogin(pathname, search);
    const nextUrl = readLoginModalNext(search, fallbackNext);
    const closeHref = buildLoginModalClosePath(pathname, search);

    const [mode, setMode] = useState<Mode>('login');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerDisplayName, setRegisterDisplayName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!modalOpen) return;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                router.replace(closeHref, { scroll: false });
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeHref, isSubmitting, modalOpen, router]);

    useEffect(() => {
        if (!modalOpen || !user) return;
        router.replace(closeHref, { scroll: false });
    }, [closeHref, modalOpen, router, user]);

    const title = useMemo(
        () => (mode === 'login' ? '欢迎回到 AiTool' : '创建你的 AiTool 账号'),
        [mode]
    );

    const description = useMemo(
        () =>
            mode === 'login'
                ? '直接在当前弹层输入邮箱或用户名和密码登录，成功后会回到刚才正在访问的页面。'
                : '注册会直接通过 Casdoor API 创建账号，并在成功后自动登录，不再跳转到外部页面。',
        [mode]
    );

    if (!modalOpen || user) {
        return null;
    }

    const handleClose = () => {
        if (isSubmitting) return;
        router.replace(closeHref, { scroll: false });
    };

    const switchMode = (nextMode: Mode) => {
        if (isSubmitting) return;
        setMode(nextMode);
        setErrorMessage('');
    };

    const validateClientSide = () => {
        if (mode === 'login') {
            if (!loginIdentifier.trim()) return '请输入邮箱或用户名';
            if (!loginPassword) return '请输入密码';
            return '';
        }

        if (!registerEmail.trim()) return '请输入邮箱';
        if (!EMAIL_REGEX.test(registerEmail.trim())) return '邮箱格式不正确';
        if (!registerPassword) return '请输入密码';
        if (registerPassword.length < 8) return '密码至少需要 8 位';
        if (registerPassword !== registerConfirmPassword) return '两次输入的密码不一致';
        return '';
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationMessage = validateClientSide();
        if (validationMessage) {
            setErrorMessage(validationMessage);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const endpoint =
                mode === 'login' ? '/api/auth/password-login' : '/api/auth/register';
            const payload =
                mode === 'login'
                    ? {
                          identifier: loginIdentifier.trim(),
                          password: loginPassword,
                          next: nextUrl,
                      }
                    : {
                          email: registerEmail.trim().toLowerCase(),
                          password: registerPassword,
                          confirmPassword: registerConfirmPassword,
                          displayName: registerDisplayName.trim(),
                          next: nextUrl,
                      };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = (await response.json().catch(() => null)) as AuthResponse | null;
            if (!response.ok || !result?.ok) {
                setErrorMessage(result?.msg || (mode === 'login' ? '登录失败' : '注册失败'));
                return;
            }

            window.location.href = result.redirectTo || nextUrl;
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '请求失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
            onClick={handleClose}
        >
            <section
                className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-[#eef4fb] shadow-[0_28px_100px_rgba(15,23,42,0.26)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
            >
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-5 top-5 z-20 rounded-full border border-white/60 bg-white/75 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    aria-label="关闭登录弹窗"
                >
                    <X size={18} />
                </button>

                <div className="grid min-h-[720px] lg:grid-cols-[1.18fr_0.82fr]">
                    <div className="relative overflow-hidden border-b border-white/35 bg-gradient-to-br from-[#dfe9f8] via-[#d7e3f4] to-[#c5d9f2] px-7 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
                        <div className="inline-flex items-center rounded-full border border-[#b8cae5] bg-white/55 px-5 py-3 text-[15px] font-medium text-[#597196] shadow-sm">
                            AiTool / Secure Access
                        </div>

                        <div className="relative mt-14 flex min-h-[420px] items-center justify-center">
                            <div className="absolute h-[340px] w-[340px] rounded-full border border-white/45 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.86),rgba(209,228,248,0.35)_68%,rgba(209,228,248,0)_100%)]" />
                            <div className="absolute bottom-[-140px] left-1/2 h-[240px] w-[760px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(147,179,228,0.42),rgba(147,179,228,0.18)_60%,rgba(147,179,228,0)_78%)]" />
                            <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/55 bg-white/58 text-5xl font-semibold text-[#30558a] shadow-[0_18px_45px_rgba(122,151,194,0.24)] backdrop-blur">
                                A
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto space-y-4 text-[#47648f]">
                            <div className="text-sm uppercase tracking-[0.22em] text-[#7a93b8]">
                                AiTool Platform
                            </div>
                            <div className="text-4xl font-semibold text-[#2d4d82]">
                                统一身份认证入口
                            </div>
                            <p className="max-w-xl text-lg leading-8 text-[#5c769b]">
                                登录后直接进入 Prompt 管理、知识库与 Agent 工作台。认证交互在站内完成，不再跳去 Casdoor 页面。
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#f7f9fc] px-7 py-8 sm:px-9 lg:px-10 lg:py-10">
                        <div className="flex h-full flex-col">
                            <div className="text-[48px] font-semibold leading-none text-[#173b6d]">
                                AiTool
                            </div>
                            <h2
                                id="login-modal-title"
                                className="mt-10 text-[36px] font-semibold leading-tight text-[#173b6d]"
                            >
                                {title}
                            </h2>
                            <p className="mt-5 max-w-md text-[15px] leading-8 text-[#6b82a8]">
                                {description}
                            </p>

                            <div className="mt-8 inline-flex rounded-[24px] border border-[#c7d4e6] bg-white p-2 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className={`rounded-[18px] px-7 py-3 text-lg font-semibold transition ${
                                        mode === 'login'
                                            ? 'bg-[#dbe6f8] text-[#173b6d]'
                                            : 'text-[#7286a7] hover:text-[#173b6d]'
                                    }`}
                                >
                                    账号登录
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode('register')}
                                    className={`rounded-[18px] px-7 py-3 text-lg font-semibold transition ${
                                        mode === 'register'
                                            ? 'bg-[#dbe6f8] text-[#173b6d]'
                                            : 'text-[#7286a7] hover:text-[#173b6d]'
                                    }`}
                                >
                                    邮箱注册
                                </button>
                            </div>

                            <form className="mt-8 flex flex-1 flex-col" onSubmit={submit}>
                                {mode === 'register' && (
                                    <label className="mb-5 block">
                                        <span className="mb-3 block text-lg font-medium text-[#4b678f]">
                                            昵称
                                        </span>
                                        <div className="flex h-20 items-center rounded-[999px] border border-[#c4d2e5] bg-white px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                                            <UserRound size={20} className="mr-4 text-[#86a0c4]" />
                                            <input
                                                value={registerDisplayName}
                                                onChange={(event) => setRegisterDisplayName(event.target.value)}
                                                placeholder="可选，不填则默认取邮箱前缀"
                                                className="h-full w-full bg-transparent text-[18px] text-[#173b6d] outline-none placeholder:text-[#9aaec9]"
                                                autoComplete="nickname"
                                            />
                                        </div>
                                    </label>
                                )}

                                <label className="mb-5 block">
                                    <span className="mb-3 block text-lg font-medium text-[#4b678f]">
                                        {mode === 'login' ? '邮箱 / 用户名' : '邮箱'}
                                    </span>
                                    <div className="flex h-20 items-center rounded-[999px] border border-[#c4d2e5] bg-white px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                                        <Mail size={20} className="mr-4 text-[#86a0c4]" />
                                        <input
                                            value={mode === 'login' ? loginIdentifier : registerEmail}
                                            onChange={(event) =>
                                                mode === 'login'
                                                    ? setLoginIdentifier(event.target.value)
                                                    : setRegisterEmail(event.target.value)
                                            }
                                            placeholder={mode === 'login' ? '请输入邮箱或用户名' : '请输入邮箱'}
                                            className="h-full w-full bg-transparent text-[18px] text-[#173b6d] outline-none placeholder:text-[#9aaec9]"
                                            autoComplete={mode === 'login' ? 'username' : 'email'}
                                            inputMode={mode === 'login' ? 'text' : 'email'}
                                        />
                                    </div>
                                </label>

                                <label className="mb-5 block">
                                    <span className="mb-3 block text-lg font-medium text-[#4b678f]">
                                        密码
                                    </span>
                                    <div className="flex h-20 items-center rounded-[999px] border border-[#c4d2e5] bg-white px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                                        <LockKeyhole size={20} className="mr-4 text-[#86a0c4]" />
                                        <input
                                            value={mode === 'login' ? loginPassword : registerPassword}
                                            onChange={(event) =>
                                                mode === 'login'
                                                    ? setLoginPassword(event.target.value)
                                                    : setRegisterPassword(event.target.value)
                                            }
                                            type="password"
                                            placeholder="请输入密码"
                                            className="h-full w-full bg-transparent text-[18px] text-[#173b6d] outline-none placeholder:text-[#9aaec9]"
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        />
                                    </div>
                                </label>

                                {mode === 'register' && (
                                    <label className="mb-5 block">
                                        <span className="mb-3 block text-lg font-medium text-[#4b678f]">
                                            确认密码
                                        </span>
                                        <div className="flex h-20 items-center rounded-[999px] border border-[#c4d2e5] bg-white px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                                            <LockKeyhole size={20} className="mr-4 text-[#86a0c4]" />
                                            <input
                                                value={registerConfirmPassword}
                                                onChange={(event) =>
                                                    setRegisterConfirmPassword(event.target.value)
                                                }
                                                type="password"
                                                placeholder="请再次输入密码"
                                                className="h-full w-full bg-transparent text-[18px] text-[#173b6d] outline-none placeholder:text-[#9aaec9]"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </label>
                                )}

                                {errorMessage && (
                                    <div className="mb-5 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-[15px] text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-4 inline-flex h-20 items-center justify-center gap-3 rounded-[999px] bg-gradient-to-r from-[#bed2f4] to-[#a7c2f0] text-[20px] font-semibold text-[#173b6d] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:from-[#b2caf2] hover:to-[#9bb9ec] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {mode === 'login' ? '登录中...' : '注册中...'}
                                        </>
                                    ) : (
                                        <>
                                            {mode === 'login' ? '登录' : '注册并登录'}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <div className="mt-8 text-center text-[16px] text-[#6c83a8]">
                                    {mode === 'login' ? '还没有账号？' : '已经有账号？'}
                                    <button
                                        type="button"
                                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                        className="ml-2 font-semibold text-[#295b9a] transition hover:text-[#173b6d]"
                                    >
                                        {mode === 'login' ? '去注册' : '去登录'}
                                    </button>
                                </div>

                                <div className="mt-6 text-sm leading-7 text-[#7a90b1]">
                                    登录即表示继续使用当前工作台。认证成功后将返回：
                                    <span className="ml-2 font-mono text-[#47648f] break-all">
                                        {nextUrl}
                                    </span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
