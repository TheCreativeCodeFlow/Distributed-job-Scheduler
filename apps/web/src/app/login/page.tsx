'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../components/feedback/toasts';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Database, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Pre-fill email from localStorage on client-side mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true);
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken, user } = response.data;

      setSession({
        accessToken,
        refreshToken,
        user,
      });

      // Handle remember me logic
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      toast.success('Successfully logged in!', `Welcome back, ${user.email}.`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Invalid email or password.';
      toast.error('Authentication Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <Card className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md shadow-2xl hoverEffect glow">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary animate-pulse">
              <Database className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              TASKFLOW
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Sign in to manage your distributed jobs
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              error={errors.email?.message}
              {...register('email')}
              aria-label="Email Address"
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                error={errors.password?.message}
                {...register('password')}
                aria-label="Password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground select-none">
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    'Forgot Password',
                    'Password recovery is handled by organization administrators.',
                  )
                }
                className="hover:text-foreground hover:underline transition-colors focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
